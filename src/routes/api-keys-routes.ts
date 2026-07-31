import { Router, Request, Response } from 'express';
import { getDb, isDbAvailable } from '../core/db/client';
import { AuthMiddleware } from '../core/auth/auth-middleware';
import crypto from 'crypto';
import { PROVIDER_REGISTRY } from '../registries/providers';

const router = Router();
import { encryptKey } from '../core/ai/api-key-manager';

function maskKey(key: string): string {
  if (key.length <= 8) return '*'.repeat(key.length);
  return key.substring(0, 4) + '*'.repeat(16) + key.substring(key.length - 4);
}

// Get all keys for current user
router.get('/', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.auth!.user.id;
    const keys = await db.userApiKey.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
      select: {
        id: true,
        provider: true,
        label: true,
        maskedKey: true,
        isEnabled: true,
        isHealthy: true,
        addedAt: true,
        lastUsedAt: true,
        lastSuccessAt: true,
        lastFailureAt: true,
        successCount: true,
        failureCount: true,
        avgLatencyMs: true,
        quotaStatus: true,
        rateLimitStatus: true,
        lastErrorMessage: true
      }
    });
    
    let settings = await db.userProviderSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await db.userProviderSettings.create({
        data: { userId, fallbackOrder: JSON.stringify(PROVIDER_REGISTRY.map(p => p.id)), loadBalancingStrategy: 'round-robin' }
      });
    }

    res.json({ keys, settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch keys', details: err.message });
  }
});

// Test a single key against provider APIs
async function testKey(provider: string, apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    let url = '';
    let headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
    let method = 'GET';
    let body: any = undefined;

    switch (provider) {
      case 'openai': url = 'https://api.openai.com/v1/models'; break;
      case 'mistral': url = 'https://api.mistral.ai/v1/models'; break;
      case 'deepseek': url = 'https://api.deepseek.com/models'; break;
      case 'together': url = 'https://api.together.xyz/v1/models'; break;
      case 'openrouter': url = 'https://openrouter.ai/api/v1/models'; break;
      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages';
        method = 'POST';
        headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
        body = JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] });
        break;
      case 'xai': url = 'https://api.x.ai/v1/models'; break;
      case 'groq': url = 'https://api.groq.com/openai/v1/models'; break;
      case 'google-gemini':
      default:
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`;
        headers = {};
        break;
    }

    const res = await fetch(url, { method, headers, body });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: 'Authentication Failed (Invalid Key)' };
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      if (data.error?.message?.includes('API key not valid')) {
        return { ok: false, error: 'Authentication Failed (Invalid Key)' };
      }
      return { ok: false, error: 'Bad Request (400)' };
    }
    if (res.status === 403) return { ok: false, error: 'Access Denied (403)' };
    if (res.status === 429) return { ok: false, error: 'Rate Limited or Quota Exceeded (429)' };
    if (res.status >= 500) return { ok: false, error: 'Provider Offline or Server Error' };
    return { ok: false, error: `Provider Error [HTTP ${res.status}]` };
  } catch (err: any) {
    return { ok: false, error: `Network Error: ${err.message}` };
  }
}

// Add new key(s)
router.post('/', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.auth!.user.id;
    const { provider, keys } = req.body;
    
    if (!provider || !keys || !Array.isArray(keys)) {
      return res.status(400).json({ error: 'Missing provider or keys array' });
    }

    const results = [];
    for (const raw of keys) {
      const keyStr = typeof raw === 'string' ? raw.trim() : raw.key?.trim();
      const labelStr = raw.label?.trim() || 'Imported Key';
      if (!keyStr) continue;

      const test = await testKey(provider, keyStr);
      if (!test.ok) {
        results.push({ key: maskKey(keyStr), status: 'error', error: test.error });
        continue;
      }

      const encrypted = encryptKey(keyStr);
      const masked = maskKey(keyStr);
      const newKey = await db.userApiKey.create({
        data: {
          userId,
          provider,
          label: labelStr,
          encryptedKey: encrypted,
          maskedKey: masked
        }
      });
      results.push({ key: masked, status: 'ok', id: newKey.id });
    }

    res.json({ status: 'ok', results });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save keys', details: err.message });
  }
});

// Update provider settings
router.put('/settings', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.auth!.user.id;
    const { fallbackOrder, loadBalancingStrategy } = req.body;
    
    if (fallbackOrder && !Array.isArray(fallbackOrder)) return res.status(400).json({ error: 'fallbackOrder must be an array' });
    
    const settings = await db.userProviderSettings.upsert({
      where: { userId },
      create: { userId, fallbackOrder: JSON.stringify(fallbackOrder || PROVIDER_REGISTRY.map(p => p.id)), loadBalancingStrategy: loadBalancingStrategy || 'round-robin' },
      update: { fallbackOrder: fallbackOrder ? JSON.stringify(fallbackOrder) : undefined, loadBalancingStrategy }
    });
    
    res.json({ status: 'ok', settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

// Delete a key
router.delete('/:id', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.auth!.user.id;
    await db.userApiKey.deleteMany({ where: { id: req.params.id, userId } });
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

// Edit a key's label
router.put('/:id', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.auth!.user.id;
    const { label } = req.body;
    
    if (!label) {
      return res.status(400).json({ error: 'Label is required for editing' });
    }

    const key = await db.userApiKey.findFirst({ where: { id: req.params.id, userId } });
    if (!key) return res.status(404).json({ error: 'Key not found' });
    
    await db.userApiKey.update({
      where: { id: key.id },
      data: { label: label.trim() }
    });
    res.json({ status: 'ok', label: label.trim() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to edit key' });
  }
});

// Toggle key
router.put('/:id/toggle', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.auth!.user.id;
    const key = await db.userApiKey.findFirst({ where: { id: req.params.id, userId } });
    if (!key) return res.status(404).json({ error: 'Key not found' });
    
    await db.userApiKey.update({
      where: { id: key.id },
      data: { isEnabled: !key.isEnabled }
    });
    res.json({ status: 'ok', isEnabled: !key.isEnabled });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle key' });
  }
});

export default router;
