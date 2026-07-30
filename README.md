<div align="center">
  <h1>StockAI v3.0 Enterprise</h1>
  <p><strong>Enterprise AI Metadata Platform & Gateway</strong></p>
  <p>
    <img src="https://img.shields.io/badge/version-3.0.0-blue" alt="version" />
    <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="node" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="typescript" />
    <img src="https://img.shields.io/badge/license-private-red" alt="license" />
  </p>
</div>

---

## Overview

StockAI is an enterprise-grade AI-powered stock metadata generation platform. It analyzes images using computer vision and generates SEO-optimized titles, keywords, and descriptions for major stock marketplaces including Adobe Stock, Shutterstock, Getty Images, Etsy, and Creative Market.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│   UploadZone · MetadataPanel · AdminPanel           │
│   PromptGenerator · Settings · AuthModal            │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / REST
┌─────────────────────▼───────────────────────────────┐
│              Express API Server (server.ts)          │
│   Auth Routes · AI Routes · Admin Routes            │
│   Rate Limiting · Helmet · CORS · Timeouts          │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Enterprise AI Gateway                  │
│   ┌─────────────────────────────────────────┐       │
│   │         API Key Pool Manager            │       │
│   │  AES-256-GCM · Health Score 0-100       │       │
│   │  Round-Robin / LRU / Health-Based       │       │
│   │  Auto-Cooldown · Circuit Breaker        │       │
│   └─────────────────────────────────────────┘       │
│   ┌─────────────────────────────────────────┐       │
│   │      Provider Failover Chain            │       │
│   │  Gemini → OpenAI → Claude → Groq        │       │
│   │  → xAI → OpenRouter                    │       │
│   └─────────────────────────────────────────┘       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              SEO Engine V3                          │
│   Title Engine · Keyword Engine (30-50 keywords)    │
│   Category Engine · Vector/Icon/Sheet Engines       │
│   Transparent/Illustration Engines                 │
│   SEO Score · Commercial Score · Confidence Score  │
└─────────────────────────────────────────────────────┘
```

---

## Features

### Enterprise AI Gateway
- **Unlimited API keys per provider** — no hard cap, all keys simultaneously active
- **Automatic key rotation** — health-based, round-robin, or LRU strategies
- **Provider failover chain**: Gemini → OpenAI → Claude → Groq → xAI → OpenRouter
- **Circuit breaker** — trips after 5 consecutive failures, auto-recovers after 30s
- **Per-key health scoring** (0–100) based on success rate, latency, and failure count
- **AES-256-GCM encryption** at rest for all stored keys (enable via env var)
- **28s per-key timeout** with instant failover to next key
- **25s server-side generation timeout** — eliminates stuck requests permanently

### SEO Engine
- Deep vision analysis via multimodal AI (image → structured metadata)
- Enterprise keyword engine with strict deduplication and priority ordering
- Title intelligence with commercial intent optimization
- Marketplace-specific rules for Adobe, Shutterstock, Getty, Etsy, Creative Market
- Specialized engines: Vector, Icon, Illustration, Transparent, Sheet/Collection
- SEO Score, Commercial Score, and Confidence Score on every result
- 10-minute in-memory cache with platform-aware cache keys

### Authentication & Security
- Google OAuth 2.0 + local email/password authentication
- JWT session tokens with 30-day expiry
- Single-device enforcement (configurable)
- PBKDF2 password hashing with 100,000 iterations
- AES-256-GCM API key encryption at rest
- Helmet security headers, rate limiting, CORS
- All error messages sanitized — no raw keys or internals exposed

### Admin Dashboard
- Real-time API Key Pool management (add, edit, delete, enable/disable, bulk reset)
- Per-key health metrics (success rate, avg latency, cooldown status, health score)
- Circuit breaker status for all providers
- Model management — enable/disable models, set admin defaults
- AI telemetry (request count, success rate, avg latency, cache hits)
- Audit log for all admin actions
- User management (activate, suspend, change roles, grant subscriptions)

---

## Supported Providers

| Provider | Environment Variable | Supported Models |
|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash |
| OpenAI | `OPENAI_API_KEY` | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Anthropic Claude | `ANTHROPIC_API_KEY` | claude-opus-4-5, claude-sonnet-4-5, claude-haiku-3-5 |
| Groq | `GROQ_API_KEY` | llama-3.3-70b, llama-4-scout, mixtral-8x7b |
| xAI | `XAI_API_KEY` | grok-2-vision-1212, grok-beta |
| OpenRouter | `OPENROUTER_API_KEY` | Any OpenRouter-compatible model |

---

## Supported Marketplaces

| Marketplace | ID | Keywords | Title Max |
|---|---|---|---|
| Adobe Stock | `adobe-stock` | 30–50 | 70 chars |
| Shutterstock | `shutterstock` | 15–50 | 100 chars |
| Getty Images | `getty-images` | 10–50 | 200 chars |
| Etsy | `etsy` | 13 | 140 chars |
| Creative Market | `creative-market` | 15–20 | 60 chars |
| iStock | `istock` | 10–50 | 200 chars |
| Pond5 | `pond5` | 20–50 | 100 chars |
| Dreamstime | `dreamstime` | 7–50 | 75 chars |

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# ── AI Providers (add at least one) ─────────────────────────────
GEMINI_API_KEY=AIzaSy...              # Required for Gemini provider
OPENAI_API_KEY=sk-...                 # Required for OpenAI provider
ANTHROPIC_API_KEY=sk-ant-...          # Required for Claude provider
GROQ_API_KEY=gsk_...                  # Required for Groq provider
XAI_API_KEY=xai-...                   # Required for xAI provider
OPENROUTER_API_KEY=sk-or-...          # Required for OpenRouter provider

# ── Security ─────────────────────────────────────────────────────
STOCKAI_KEY_ENCRYPTION_SECRET=        # Min 32 chars — enables AES-256-GCM key encryption

# ── Google OAuth ─────────────────────────────────────────────────
GOOGLE_CLIENT_ID=                     # From Google Cloud Console
GOOGLE_CLIENT_SECRET=                 # From Google Cloud Console
VITE_GOOGLE_CLIENT_ID=                # Same as GOOGLE_CLIENT_ID (frontend)

# ── Application ──────────────────────────────────────────────────
APP_URL=https://your-domain.com
NODE_ENV=production                   # Set to 'production' for deployment

# ── Dev/Testing (development only) ───────────────────────────────
DEV_TEST_SECRET=stockai-dev-test-2024 # Required only for stress testing
```

### API Key Pool — Adding Multiple Keys

After the server is running, use the Admin Dashboard → API Management tab to:
1. Add multiple keys per provider (unlimited)
2. Set the rotation strategy (health-based recommended)
3. Monitor key health scores in real time
4. Bulk-reset failed keys

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env and add your API keys

# 3. Start development server
npm run dev
# Server: http://localhost:3002

# 4. Build for production
npm run build

# 5. Run production stress test (development only)
node stress-test.js http://localhost:3002
```

---

## Deployment (Vercel)

1. Push this repository to GitHub
2. Import in Vercel → select the repo
3. Set all environment variables in Vercel dashboard
4. Set `NODE_ENV=production`
5. Deploy

The server entry point is `api/index.ts` for Vercel serverless.

---

## API Reference

### POST /api/generate-metadata
Generates SEO metadata for an image.

**Headers:** `Authorization: Bearer <token>`, `X-Device-Id: <device>`

**Body:**
```json
{
  "fileId": "string",
  "fileName": "image.jpg",
  "fileType": "image",
  "base64Data": "base64string",
  "mimeType": "image/jpeg",
  "provider": "google-gemini",
  "settings": {
    "targetPlatform": "adobe-stock",
    "keywordsCount": 30,
    "titleLength": 70
  }
}
```

**Response:**
```json
{
  "title": "string",
  "description": "string",
  "keywords": ["string"],
  "primaryCategory": "string",
  "scores": { "seoScore": 92, "commercialScore": 88 },
  "provider": "google-gemini",
  "latency": 2340
}
```

### POST /api/generate-prompt
Generates AI image prompts for Midjourney, DALL-E 3, and Flux.

### GET /api/marketplaces
Returns all supported marketplace configurations.

### POST /api/test-key
Tests an API key for a given provider.

---

## Security

- **No API keys are ever logged** — all error messages are sanitized via `ApiKeyManager.sanitizeKeyFromMessage()`
- **Keys in pool responses are masked** — only labels and metadata are returned, never raw values
- **Admin endpoints require `role: admin`** — enforced at middleware level
- **All sessions are JWT-signed** with 30-day expiry and device-lock enforcement
- **Rate limiting** on all endpoints (100 req/15min per IP)
- Enable `STOCKAI_KEY_ENCRYPTION_SECRET` (min 32 chars) for AES-256-GCM key encryption at rest

---

## License

Private / Commercial. All rights reserved.
