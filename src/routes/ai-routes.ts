import { Router, Request, Response } from 'express';
import { SeoEngine, sanitizeErrorMessage, getGeminiClient, aiTelemetryLogs } from '../core/seo';
import { MARKETPLACE_REGISTRY } from '../registries/marketplaces';
import { AuthMiddleware, userStore } from '../core/auth';
import { syncUserLicense } from '../core/admin/admin-store';
import { getDb, isDbAvailable } from '../core/db/client';
import crypto from 'crypto';

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
          const data = (await testRes.json()) as any;
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
          const data = (await testRes.json()) as any;
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

    // ── Mistral ─────────────────────────────────────────────────────────
    } else if (provider === 'mistral') {
      const keyToUse = apiKey || process.env.MISTRAL_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No Mistral API Key provided.' });
      try {
        const testRes = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) return res.json({ status: 'ok', provider: 'mistral', message: `Mistral API Connected` });
        return res.status(400).json({ status: 'error', message: `Mistral authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach Mistral API. (${netErr.message})` });
      }

    // ── DeepSeek ────────────────────────────────────────────────────────
    } else if (provider === 'deepseek') {
      const keyToUse = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No DeepSeek API Key provided.' });
      try {
        const testRes = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) return res.json({ status: 'ok', provider: 'deepseek', message: `DeepSeek API Connected` });
        return res.status(400).json({ status: 'error', message: `DeepSeek authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach DeepSeek API. (${netErr.message})` });
      }

    // ── Together AI ──────────────────────────────────────────────────────
    } else if (provider === 'together') {
      const keyToUse = apiKey || process.env.TOGETHER_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No Together API Key provided.' });
      try {
        const testRes = await fetch('https://api.together.xyz/v1/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) return res.json({ status: 'ok', provider: 'together', message: `Together API Connected` });
        return res.status(400).json({ status: 'error', message: `Together authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach Together API. (${netErr.message})` });
      }

    // ── OpenRouter ──────────────────────────────────────────────────────
    } else if (provider === 'openrouter') {
      const keyToUse = apiKey || process.env.OPENROUTER_API_KEY;
      if (!keyToUse) return res.status(400).json({ status: 'error', message: 'No OpenRouter API Key provided.' });
      try {
        const testRes = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${keyToUse}` }
        });
        if (testRes.ok) return res.json({ status: 'ok', provider: 'openrouter', message: `OpenRouter API Connected` });
        return res.status(400).json({ status: 'error', message: `OpenRouter authentication failed. [HTTP ${testRes.status}]` });
      } catch (netErr: any) {
        return res.status(503).json({ status: 'error', message: `Unable to reach OpenRouter API. (${netErr.message})` });
      }

    // ── Google Gemini (default) ─────────────────────────────────────────
    } else {
      const ai = getGeminiClient(apiKey);
      try {
        const testResponse = await ai.models.generateContent({
          model: model || 'gemini-1.5-flash',
          contents: 'Reply with only: OK'
        });
        if (testResponse) {
          return res.json({ status: 'ok', provider: 'google-gemini', message: `Google Gemini Connected — Model: ${model || 'gemini-1.5-flash'}` });
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
  const routeStart = Date.now();
  const requestId = crypto.randomUUID();
  try {
    // MANDATORY: Auth + subscription validation
    let authResult: { userId: string; isAdmin: boolean } | null;
    try {
      authResult = await validateAuthAndSubscription(req, res);
    } catch (authErr: any) {
      const msg = (authErr instanceof Error ? authErr.message : String(authErr)) || 'Authentication failed';
      console.error('[generate-metadata] Auth validation threw:', msg);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Authentication check failed. Please try again.', code: 'AUTH_CHECK_FAILED' });
      }
      return;
    }
    if (!authResult) return; // Response already sent by validateAuthAndSubscription

    const { targetPlatform = 'general' } = req.body.settings || {};
    const marketplaceRule = MARKETPLACE_REGISTRY[targetPlatform] || MARKETPLACE_REGISTRY.general;

    // ── VERBOSE REQUEST LOGGING ──────────────────────────────────────────────
    console.log(`\n╔══ [generate-metadata] REQUEST ══════════════════════════════`);
    console.log(`║  User ID          : ${authResult.userId} (admin=${authResult.isAdmin})`);
    console.log(`║  Requested Provider: ${req.body.provider || '(not specified — will use google-gemini)'}`);
    console.log(`║  Requested Model  : ${req.body.selectedModel || '(auto)'}`);
    console.log(`║  Custom Key Sent  : ${!!(req.body.customApiKey && req.body.customApiKey.trim())}`);
    console.log(`║  File             : ${req.body.fileName || '(unnamed)'} (${req.body.fileType || 'unknown'})`);
    console.log(`║  Has Image Data   : ${!!(req.body.base64Data && req.body.base64Data.length > 0)}`);
    console.log(`╚══════════════════════════════════════════════════════════════\n`);

    // CRITICAL FIX: 25s server-side timeout wrapper — permanently prevents stuck states
    // Server hard limit is 30s; we use 25s to give time for the response to be sent.
    const GENERATION_TIMEOUT_MS = 25000;

    let metadataResult: any;
    try {
      metadataResult = await Promise.race([
        SeoEngine.generateMetadata({ ...req.body, userId: authResult.userId, marketplaceRule }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('GENERATION_TIMEOUT: Metadata generation exceeded 25s. All providers attempted. Please try again.')),
            GENERATION_TIMEOUT_MS
          )
        )
      ]);
    } catch (genErr: any) {
      let errMsg = (genErr instanceof Error ? genErr.message : String(genErr)) || 'Generation failed';
      let trace: any = null;
      let errorCode = 'GENERATION_FAILED';

      // Attempt to parse structured gateway error
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.trace) {
          trace = parsed.trace;
          errMsg = parsed.message;
          errorCode = parsed.code || errorCode;
        }
      } catch (e) {
        // Not a structured JSON error, keep original message
      }

      console.error('[generate-metadata] Generation error:', errMsg);
      const isTimeout = errMsg.includes('GENERATION_TIMEOUT') || errMsg.includes('timed out');
      const isAuthError = errMsg.includes('AUTH_ERROR') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('invalid key') || errMsg.includes('Invalid API Key');
      const isNoProviders = errMsg.includes('No API keys') || errMsg.includes('No available') || errMsg.includes('All configured providers');
      const elapsed = Date.now() - routeStart;

      if (isDbAvailable()) {
        getDb()!.telemetryLog.create({
          data: {
            requestId, userId: authResult.userId, provider: 'unknown', model: 'unknown',
            responseTimeMs: elapsed, success: false,
            errorType: isTimeout ? 'timeout' : isAuthError ? 'auth_error' : 'generation_error',
            errorMessage: errMsg.slice(0, 250), fileName: req.body.fileName, fileType: req.body.fileType,
          }
        }).catch(() => {});
      }

      const statusCode = isTimeout ? 504 : isAuthError ? 400 : isNoProviders ? 503 : 500;
      res.status(statusCode).json({
        error: sanitizeErrorMessage(errMsg),
        code: isTimeout ? 'GENERATION_TIMEOUT' : isAuthError ? 'INVALID_API_KEY' : isNoProviders ? 'NO_PROVIDER_CONFIGURED' : errorCode,
        trace
      });
      return;
    }

    const elapsed = Date.now() - routeStart;
    // Log telemetry success to DB (non-blocking)
    if (isDbAvailable()) {
      getDb()!.telemetryLog.create({
        data: {
          requestId,
          userId: authResult.userId,
          provider: metadataResult?.provider || 'unknown',
          model: metadataResult?.model || 'unknown',
          responseTimeMs: elapsed,
          success: true,
          fileName: req.body.fileName,
          fileType: req.body.fileType,
        }
      }).catch(() => {});
    }

    // Increment real generation counter (fire-and-forget, never blocks response)
    userStore.incrementGeneration(authResult.userId).catch(() => {});

    res.setHeader('X-Generation-Time', `${elapsed}ms`);
    res.setHeader('X-Request-Id', requestId);
    return res.json(metadataResult);
  } catch (err: any) {
    const errMsg = (err instanceof Error ? err.message : String(err)) || 'Internal error';
    console.error('Unexpected error in /api/generate-metadata:', errMsg);
    if (!res.headersSent) {
      return res.status(500).json({ error: sanitizeErrorMessage(errMsg), code: 'INTERNAL_ERROR' });
    }
  }
});

// ─── AI Prompt Generation (PROTECTED) ────────────────────────────────────────
router.post('/generate-prompt', async (req: Request, res: Response) => {
  const routeStart = Date.now();
  try {
    // MANDATORY: Auth + subscription validation
    let authResult: { userId: string; isAdmin: boolean } | null;
    try {
      authResult = await validateAuthAndSubscription(req, res);
    } catch (authErr: any) {
      const msg = (authErr instanceof Error ? authErr.message : String(authErr)) || 'Authentication failed';
      console.error('[generate-prompt] Auth validation threw:', msg);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Authentication check failed. Please try again.', code: 'AUTH_CHECK_FAILED' });
      }
      return;
    }
    if (!authResult) return;

    // 20s timeout for prompt generation (simpler operation)
    const PROMPT_TIMEOUT_MS = 20000;

    let promptResult: any;
    try {
      promptResult = await Promise.race([
        SeoEngine.generatePrompt({ ...req.body, userId: authResult.userId }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PROMPT_TIMEOUT: Prompt generation exceeded 20s.')),
            PROMPT_TIMEOUT_MS
          )
        )
      ]);
    } catch (genErr: any) {
      const errMsg = (genErr instanceof Error ? genErr.message : String(genErr)) || 'Prompt generation failed';
      console.error('[generate-prompt] Generation error:', errMsg);
      // For prompt generation, fall through to template fallback by returning a 200 with default prompt
      // This ensures the user always gets something useful
      res.setHeader('X-Generation-Time', `${Date.now() - routeStart}ms`);
      return res.json({
        promptMidjourney: `/imagine prompt: professional commercial stock photo, studio lighting, clean background, sharp focus, 8k resolution --ar 16:9 --v 6.0`,
        promptDalle: `A professional commercial stock photograph with studio lighting and clean background. High quality, sharp focus.`,
        promptFlux: `professional commercial stock photo, studio lighting, clean composition, ultra-detailed, 8k resolution`,
        styleKeywords: ['studio lighting', 'clean background', 'professional', 'commercial', '8k resolution'],
        commercialConcepts: ['business', 'technology', 'lifestyle', 'corporate', 'modern'],
        aiGenerated: false,
        provider: 'fallback',
        fallbackReason: sanitizeErrorMessage(errMsg)
      });
    }

    // Increment real prompt counter (fire-and-forget, never blocks response)
    userStore.incrementPrompt(authResult.userId).catch(() => {});

    res.setHeader('X-Generation-Time', `${Date.now() - routeStart}ms`);
    return res.json(promptResult);
  } catch (err: any) {
    const errMsg = (err instanceof Error ? err.message : String(err)) || 'Internal error';
    console.error('Unexpected error in /api/generate-prompt:', errMsg);
    if (!res.headersSent) {
      return res.status(500).json({ error: sanitizeErrorMessage(errMsg), code: 'INTERNAL_ERROR' });
    }
  }
});

export const aiRouter = router;
