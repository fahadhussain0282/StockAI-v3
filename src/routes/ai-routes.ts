import { Router, Request, Response } from 'express';
import { SeoEngine, sanitizeErrorMessage, getGeminiClient, aiTelemetryLogs } from '../core/seo';
import { MARKETPLACE_REGISTRY } from '../registries/marketplaces';
import { AuthMiddleware, userStore } from '../core/auth';
import { syncUserLicense } from '../core/admin/admin-store';

const router = Router();

// ─── Helper: Strict Auth + Subscription Check ─────────────────────────────────
async function validateAuthAndSubscription(req: Request, res: Response): Promise<{ userId: string; isAdmin: boolean } | null> {
  const authHeader = req.headers['authorization'];
  const deviceHeader = (req.headers['x-device-id'] as string) || '';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to use StockAI.',
      code: 'AUTH_REQUIRED'
    });
    return null;
  }

  const token = authHeader.substring(7);
  const { SessionService } = await import('../core/auth');
  const auth = await SessionService.validateSession(token, deviceHeader);

  if (!auth) {
    res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
      code: 'SESSION_EXPIRED'
    });
    return null;
  }

  // Admins bypass subscription checks
  if (auth.user.role === 'admin') {
    return { userId: auth.user.id, isAdmin: true };
  }

  // Sync and check subscription
  const user = await syncUserLicense(auth.user.id);
  if (!user || !user.subscription.isActive || user.subscription.isExpired || user.status === 'expired' || user.status === 'suspended') {
    res.status(403).json({
      error: 'Subscription Required. Your StockAI license is not active. Please activate a plan to continue.',
      code: 'SUBSCRIPTION_REQUIRED',
      status: user?.status || 'inactive'
    });
    return null;
  }

  return { userId: auth.user.id, isAdmin: false };
}

// ─── Test API Key (Auth required to prevent public provider probing) ────────────────────
router.post('/test-key', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, model } = req.body;
    if (!provider) {
      return res.status(400).json({ status: 'error', message: 'Provider is required.' });
    }

    // ── xAI (Grok) ────────────────────────────────────────────────────────
    if (provider === 'xai' || provider === 'grok') {
      const keyToUse = apiKey || process.env.XAI_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No xAI API Key provided.' });
      try {
        const testRes = await fetch('https://api.x.ai/v1/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) {
          return res.json({ status: 'ok', provider: 'xai', message: `xAI (Grok) API Connected — Model: ${model || 'grok-2-vision-1212'}` });
        }
        return res.status(400).json({ status: 'error', message: `xAI authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach xAI API. (${netErr.message})` });
      }

    // ── Groq ────────────────────────────────────────────────────────────
    } else if (provider === 'groq') {
      const keyToUse = apiKey || process.env.GROQ_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No Groq API Key provided.' });
      try {
        const testRes = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) {
          const data = await testRes.json();
          const modelCount = data?.data?.length || 0;
          return res.json({ status: 'ok', provider: 'groq', message: `Groq API Connected — ${modelCount} models available` });
        }
        return res.status(400).json({ status: 'error', message: `Groq authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach Groq API. (${netErr.message})` });
      }

    // ── OpenAI ──────────────────────────────────────────────────────────
    } else if (provider === 'openai') {
      const keyToUse = apiKey || process.env.OPENAI_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No OpenAI API Key provided.' });
      try {
        const testRes = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) {
          const data = await testRes.json();
          const gptModels = (data.data || []).filter((m: any) => m.id.startsWith('gpt-') || m.id.startsWith('o4')).length;
          return res.json({ status: 'ok', provider: 'openai', message: `OpenAI API Connected — ${gptModels} GPT models available` });
        }
        if (testRes.status === 401) return res.status(400).json({ status: 'error', message: 'Invalid OpenAI API key. Keys start with sk-...' });
        return res.status(400).json({ status: 'error', message: `OpenAI authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach OpenAI API. (${netErr.message})` });
      }

    // ── Anthropic Claude ────────────────────────────────────────────────
    } else if (provider === 'anthropic') {
      const keyToUse = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No Anthropic API Key provided.' });
      try {
        const testRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': keyToUse,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
        if (testRes.ok) {
          return res.json({ status: 'ok', provider: 'anthropic', message: `Anthropic Claude API Connected — claude-3-haiku-20240307` });
        }
        if (testRes.status === 401) return res.status(400).json({ status: 'error', message: 'Invalid Anthropic API key. Keys start with sk-ant-...' });
        return res.status(400).json({ status: 'error', message: `Anthropic authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach Anthropic API. (${netErr.message})` });
      }

    // ── Google Gemini (default) ─────────────────────────────────────────
    } else {
      const ai = getGeminiClient(apiKey);
      try {
        const testResponse = await ai.models.generateContent({
          model: model || 'gemini-2.5-flash',
          contents: 'Reply with only: OK'
        });
        if (testResponse) {
          return res.json({ status: 'ok', provider: 'google-gemini', message: `Google Gemini Connected — Model: ${model || 'gemini-2.5-flash'}` });
        }
        return res.status(400).json({ status: 'error', message: 'Gemini connection test failed. Check your API key.' });
      } catch (geminiErr: any) {
        return res.status(400).json({ status: 'error', message: `Gemini API Error: ${sanitizeErrorMessage(geminiErr?.message || 'Authentication failed.')}` });
      }
    }
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: sanitizeErrorMessage(err?.message || 'Internal server error during key test.') });
  }
});

// ─── Admin AI Telemetry ───────────────────────────────────────────────────────
router.get('/admin/ai-telemetry', AuthMiddleware.authenticate, AuthMiddleware.requireRole('admin'), (req: Request, res: Response) => {
  const total = aiTelemetryLogs.length;
  const successful = aiTelemetryLogs.filter(l => l.success).length;
  const avgLatency = total > 0 ? Math.round(aiTelemetryLogs.reduce((acc, l) => acc + l.responseTimeMs, 0) / total) : 0;
  const cacheHits = aiTelemetryLogs.filter(l => l.cacheHit).length;

  return res.json({
    totalRequests: total,
    successRate: total > 0 ? `${Math.round((successful / total) * 100)}%` : '100%',
    avgResponseTimeMs: avgLatency,
    cacheHits,
    logs: aiTelemetryLogs.slice(0, 50)
  });
});

// ─── Marketplace Registry ─────────────────────────────────────────────────────
router.get('/marketplaces', (req: Request, res: Response) => {
  res.json(MARKETPLACE_REGISTRY);
});

// ─── Main AI Vision + Metadata Generation (PROTECTED) ────────────────────────
router.post('/generate-metadata', async (req: Request, res: Response) => {
  try {
    // MANDATORY: Auth + subscription validation
    const authResult = await validateAuthAndSubscription(req, res);
    if (!authResult) return; // Response already sent

    const { targetPlatform = 'general' } = req.body.settings || {};
    const marketplaceRule = MARKETPLACE_REGISTRY[targetPlatform] || MARKETPLACE_REGISTRY.general;

    const metadataResult = await SeoEngine.generateMetadata({
      ...req.body,
      marketplaceRule
    });

    // Increment real generation counter (fire-and-forget, never blocks response)
    userStore.incrementGeneration(authResult.userId).catch(() => {});

    return res.json(metadataResult);
  } catch (err: any) {
    console.error('Error in /api/generate-metadata:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err?.message || err) });
  }
});

// ─── AI Prompt Generation (PROTECTED) ────────────────────────────────────────
router.post('/generate-prompt', async (req: Request, res: Response) => {
  try {
    // MANDATORY: Auth + subscription validation
    const authResult = await validateAuthAndSubscription(req, res);
    if (!authResult) return; // Response already sent

    const promptResult = await SeoEngine.generatePrompt(req.body);

    // Increment real prompt counter (fire-and-forget, never blocks response)
    userStore.incrementPrompt(authResult.userId).catch(() => {});

    return res.json(promptResult);
  } catch (err: any) {
    console.error('Error in /api/generate-prompt:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err?.message || err) });
  }
});

export const aiRouter = router;
