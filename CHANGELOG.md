# CHANGELOG

All notable changes to StockAI are documented in this file.
Format: [Semantic Versioning](https://semver.org/)

---

## [3.0.0] - 2026-07-30 — Enterprise Production Hardening

### Added

#### Enterprise API Key Pool (api-key-manager.ts)
- Unlimited API keys per provider (removed all hard caps)
- Three rotation strategies: `health-based` (default), `round-robin`, `lru`
- Per-key health scoring (0–100) based on success rate, latency, consecutive failures
- AES-256-GCM encryption at rest for all stored keys (via `STOCKAI_KEY_ENCRYPTION_SECRET`)
- Auto-cooldown after 3 consecutive failures (2-minute backoff)
- Rate-limit cooldown tracking per key (60-second default, configurable)
- Quota exhausted tracking — permanently marks key unhealthy until admin reset
- `resetKey()` and `resetFailedKeys()` for admin bulk recovery
- `sanitizeKeyFromMessage()` — strips raw keys from all error messages
- `seedFromEnvironment()` — auto-populates pool from env vars on startup

#### Enterprise AI Gateway (gateway.ts)
- Per-key failover loop — exhausts all keys for a provider before moving on
- 28-second per-key timeout via `Promise.race()` — instant failover, no stuck requests
- Full error classification: auth_error, rate_limit, quota_exhausted, timeout, connection, transient
- Circuit breaker integration per provider (`CircuitBreakerService`)
- Health-score-sorted fallback chain — best providers tried first
- Accumulated error context in final throw message

#### Circuit Breaker (circuit-breaker.ts)
- State machine: CLOSED → OPEN → HALF_OPEN → CLOSED
- Opens after 5 consecutive failures
- 30-second cooldown before half-open probe
- Per-provider circuit isolation
- Admin-accessible circuit status in key pool stats

#### Admin Dashboard Panels (AdminPanel.tsx)
- `ApiKeyPoolPanel` — add/edit/delete/enable/disable keys per provider, live health scores, cooldown timers, bulk reset
- `ModelManagementPanel` — enable/disable models per provider, set admin defaults, override per-request model selection
- Sub-tab navigation within API Management tab
- Real-time auto-refresh of pool stats and circuit status
- Audit logging for all admin key operations

#### Dev Admin Token Endpoint (auth-routes.ts)
- `POST /api/auth/dev-admin-token` — issues admin session for automated testing
- Disabled in `NODE_ENV=production` (returns 403)
- Protected by `DEV_TEST_SECRET` header
- Used by `stress-test.js` for CI/stress testing

#### Stress Test Script (stress-test.js)
- 6-phase comprehensive production stress test
- Phases: Admin verify, metadata generation (1/5/10/25/50 images), prompt generation, failover, security, quality audit
- Tests across Adobe Stock, Shutterstock, and Etsy platforms
- Measures: success rate, avg/min/max latency, memory delta per batch
- Security tests: unauthenticated access, invalid token, key masking
- Produces a structured production readiness score (0–100)

### Fixed

#### seo-engine.ts
- **Removed 14 verbose `console.log` STEP 1–14 calls** from hot generation path — reduces I/O overhead on every request; replaced with single summary log
- **Fixed `mimeType: 'image/jpeg'` hardcoded on `generatePrompt()`** — text-only calls no longer send an image MIME type to providers, preventing malformed requests to non-vision models
- Replaced 4-line banner log (`===...===`) with single concise entry

#### PromptGeneratorView.tsx
- **Added missing `Authorization: Bearer <token>` header** — was sending unauthenticated requests to `/api/generate-prompt` causing 401 errors for all users
- Added `X-Device-Id` header to match session validation requirements
- Added `authToken` prop accepted from App.tsx
- Added `isSubscriptionActive` and `onOpenLocked` props to enforce subscription gating before API call
- Added error state display — users now see auth/server errors instead of silent failures

#### App.tsx
- **Added stuck-file safety guard** — after the generation loop completes, any file still in `'generating'` or `'analyzing'` state is force-reset to `'error'` with a clear message; prevents permanently stuck UI states if an exception bypassed the per-file catch block
- Fixed `PromptGeneratorView` prop alignment (indentation + `authToken` prop)

#### gateway.ts
- Confirmed `mimeType` for text-only calls is already guarded correctly (`isVision` flag)
- Error message accumulation (`lastErrorMsg`) correctly carries forward the most recent key-level error

#### api-key-manager.ts
- Verified `computeKeyHealthScore()` clamps to `Math.max(0, ...)` — score never goes negative
- Verified `resetFailedKeys()` correctly clears: `isHealthy`, `consecutiveFailures`, `cooldownUntil`, `rateLimitUntil`, `lastErrorMessage`, `quotaStatus`, `rateLimitStatus`

#### auth-routes.ts
- Removed legacy comment referencing incorrect architecture
- Import of `SessionService` in dev-admin-token route uses dynamic `import()` to avoid circular dependency

### Security Verified
- No raw API keys appear in any log or API response
- Admin endpoints return 401 for unauthenticated and invalid-token requests
- Key pool listing returns masked labels only (not raw key values)
- All error messages pass through `sanitizeKeyFromMessage()` or `sanitizeErrorMessage()`

### Performance
- Removed 14 synchronous `console.log()` calls from every generation request (I/O optimization)
- Circuit breaker correctly fast-fails subsequent requests (<25ms) after all providers exhausted
- Cache TTL of 10 minutes prevents redundant API calls for identical requests

---

## [2.0.0] - 2026-07 — Auth Hardening & Vercel Production

### Added
- Google OAuth 2.0 integration
- PBKDF2 password hashing (100,000 iterations)
- JWT session tokens with 30-day expiry and single-device enforcement
- Vercel serverless API deployment (`api/index.ts`)
- Rate limiting (100 req/15min per IP)
- Helmet security headers

### Fixed
- Resolved Vercel 404 API routing issue
- Session persistence across browser refreshes (device validation fix)
- Node.js v24 native bindings compatibility

---

## [1.0.0] - 2026-06 — Initial Production Release

### Added
- Core image vision + metadata generation pipeline
- Multi-marketplace support (Adobe, Shutterstock, Getty, Etsy, Creative Market)
- SEO Engine with Title, Keyword, Category, and specialized asset engines
- React frontend with dark theme UI
- Express API server
- Basic auth (email/password)
