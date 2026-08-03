import { GoogleGenAI } from '@google/genai';
import { AITelemetryEntry } from './types';

export const aiTelemetryLogs: AITelemetryEntry[] = [];
export const visionMetadataCache = new Map<string, { data: any; cachedAt: number }>();

export function getGeminiClient(customApiKey?: string) {
  const key = (customApiKey && customApiKey.trim().length > 0) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error('GEMINI_API_KEY is not configured or invalid.');
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

export function sanitizeErrorMessage(msg: any): string {
  if (!msg) return 'An unexpected error occurred. Please try again.';
  const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
  if (str.includes('429') || str.includes('RESOURCE_EXHAUSTED') || str.includes('Quota exceeded') || str.includes('rate-limits')) {
    return 'API Quota/Rate limit reached. Please wait a moment or add a custom API key in API Keys Manager.';
  }
  if (str.includes('401') || str.includes('403') || str.includes('API_KEY_INVALID') || str.includes('invalid key') || str.includes('Unauthorized')) {
    return 'Invalid API Key. Please verify your key in API Keys Manager.';
  }
  if (str.includes('FETCH_ERROR') || str.includes('fetch failed') || str.includes('ENOTFOUND')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed?.error?.message) return sanitizeErrorMessage(parsed.error.message);
    } catch {
      // ignore
    }
  }
  return str.length > 2000 ? str.slice(0, 2000) + '...' : str;
}

export async function resolveBase64Image(base64Data?: string, previewUrl?: string, mimeType?: string): Promise<{ resolvedBase64: string | undefined; resolvedMimeType: string }> {
  let resolvedBase64 = base64Data;
  let resolvedMimeType = mimeType || 'image/jpeg';

  const imageUrlToFetch = (base64Data && base64Data.startsWith('http')) ? base64Data : (previewUrl && previewUrl.startsWith('http') ? previewUrl : null);

  if (!resolvedBase64 && imageUrlToFetch) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const imgRes = await fetch(imageUrlToFetch, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        resolvedBase64 = Buffer.from(buffer).toString('base64');
        const contentType = imgRes.headers.get('content-type');
        if (contentType) resolvedMimeType = contentType;
      }
    } catch (e) {
      console.warn('Could not fetch image from URL for vision analysis:', e);
    }
  }

  return { resolvedBase64, resolvedMimeType };
}
