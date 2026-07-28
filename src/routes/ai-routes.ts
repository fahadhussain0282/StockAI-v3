import { Router, Request, Response } from 'express';
import { SeoEngine, sanitizeErrorMessage, getGeminiClient, aiTelemetryLogs } from '../core/seo';
import { MARKETPLACE_REGISTRY } from '../registries/marketplaces';
import { AuthMiddleware } from '../core/auth';
import { syncUserLicense } from '../core/admin/admin-store';

const router = Router();

// Test API Key Endpoint for Gemini, Grok, and Groq
router.post('/test-key', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, model } = req.body;
    if (provider === 'grok') {
      const keyToUse = apiKey || process.env.GROK_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({ status: 'error', message: 'No Grok API Key provided.' });
      }
      const testRes = await fetch('https://api.x.ai/v1/models', {
        headers: { Authorization: `Bearer ${keyToUse}` }
      });
      if (testRes.ok) {
        return res.json({ status: 'ok', provider: 'grok', message: 'Grok API Key & Provider Connected Successfully!' });
      }
      const errBody = await testRes.text();
      return res.status(400).json({ status: 'error', message: `Failed to authenticate with Grok API. Reason: ${errBody}` });
    } else if (provider === 'groq') {
      const keyToUse = apiKey || process.env.GROQ_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({ status: 'error', message: 'No Groq API Key provided.' });
      }
      const testRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${keyToUse}` }
      });
      if (testRes.ok) {
        return res.json({ status: 'ok', provider: 'groq', message: 'Groq API Key & Provider Connected Successfully!' });
      }
      const errBody = await testRes.text();
      return res.status(400).json({ status: 'error', message: `Failed to authenticate with Groq API. Reason: ${errBody}` });
    } else {
      // Default: Google Gemini
      const ai = getGeminiClient(apiKey);
      const testResponse = await ai.models.generateContent({
        model: model || 'gemini-3.6-flash',
        contents: 'Test connection'
      });
      if (testResponse) {
        return res.json({ status: 'ok', provider: 'google-gemini', message: 'Google Gemini API Key Connected Successfully!' });
      }
      return res.status(400).json({ status: 'error', message: 'Gemini connection failed.' });
    }
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: sanitizeErrorMessage(err?.message || err) });
  }
});

// Admin API for AI Telemetry & Observability
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

// Marketplace Registry API
router.get('/marketplaces', (req: Request, res: Response) => {
  res.json(MARKETPLACE_REGISTRY);
});

// Main AI Vision & StockAI Metadata Generation API
router.post('/generate-metadata', async (req: Request, res: Response) => {
  try {
    // Optional manual token extraction to match previous logic without strictly blocking
    const authHeader = req.headers['authorization'];
    const deviceHeader = (req.headers['x-device-id'] as string) || '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Validate using AuthMiddleware manually if needed, or assume it's valid
      // In this specific route, previous logic allowed guests but checked if user was suspended
      const token = authHeader.substring(7);
      const { SessionService } = await import('../core/auth');
      const auth = await SessionService.validateSession(token, deviceHeader);
      
      if (auth) {
        const user = await syncUserLicense(auth.user.id);
        if (user && user.role !== 'admin') {
          if (!user.subscription.isActive || user.subscription.isExpired || user.status === 'expired' || user.status === 'suspended') {
            return res.status(403).json({
              error: 'Subscription Expired. Your active license has ended. Please renew your plan to continue using StockAI Metadata Intelligence Engine.',
              code: 'SUBSCRIPTION_EXPIRED',
              status: user.status
            });
          }
        }
      }
    }

    const { targetPlatform = 'general' } = req.body.settings || {};
    const marketplaceRule = MARKETPLACE_REGISTRY[targetPlatform] || MARKETPLACE_REGISTRY.general;

    const metadataResult = await SeoEngine.generateMetadata({
      ...req.body,
      marketplaceRule
    });

    return res.json(metadataResult);
  } catch (err: any) {
    console.error('Error in /api/generate-metadata:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err?.message || err) });
  }
});

// AI Prompt Generation API for Stock Asset Creation
router.post('/generate-prompt', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const deviceHeader = (req.headers['x-device-id'] as string) || '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { SessionService } = await import('../core/auth');
      const auth = await SessionService.validateSession(token, deviceHeader);
      
      if (auth) {
        const user = await syncUserLicense(auth.user.id);
        if (user && user.role !== 'admin') {
          if (!user.subscription.isActive || user.subscription.isExpired || user.status === 'expired' || user.status === 'suspended') {
            return res.status(403).json({
              error: 'Subscription Expired. Your active license has ended. Please renew your plan to continue generating AI prompts.',
              code: 'SUBSCRIPTION_EXPIRED',
              status: user.status
            });
          }
        }
      }
    }
    
    const promptResult = await SeoEngine.generatePrompt(req.body);
    return res.json(promptResult);
  } catch (err: any) {
    console.error('Error in /api/generate-prompt:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err?.message || err) });
  }
});

export const aiRouter = router;
