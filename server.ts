import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './src/core/auth/index';
import { userRouter } from './src/core/users/index';
import { teamRouter } from './src/core/teams/index';
import { billingRouter } from './src/core/billing/index';
import { adminRouter, systemSettingsStore } from './src/routes/admin-routes';
import { aiRouter } from './src/routes/ai-routes';
import apiKeysRouter from './src/routes/api-keys-routes';
import { ApiKeyManager } from './src/core/ai/api-key-manager';
import { initDb, isDbAvailable } from './src/core/db/client';
import { userStore } from './src/core/auth/user-store';

dotenv.config();

// ─── Startup Validation ───────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
  console.warn(
    '\n⚠️  [StockAI] JWT_SECRET is not set or too short.\n' +
    '   Users will be logged out on every server restart.\n' +
    '   For production: generate with:\n' +
    '   node -e "console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))"\n' +
    '   and add JWT_SECRET=<result> to your .env and Vercel env vars.\n'
  );
}

// ─── Initialize Database Connection ──────────────────────────────────────────
// This is async but we don't await at module level — requests will use
// in-memory fallback until DB is ready (usually < 1s)
initDb().then(async () => {
  if (isDbAvailable()) {
    console.log('[StockAI] Database ready — seeding admin users...');
    await seedAdminUsers();
    console.log('[StockAI] Admin seed complete.');
    // Load persisted API keys from DB into memory pool
    await ApiKeyManager.loadFromDb();
    console.log('[StockAI] API key pool restored from database.');
  }
  // Seed API key pool from environment variables (adds ENV keys as fallback)
  ApiKeyManager.seedFromEnvironment();
}).catch(err => {
  console.error('[StockAI] DB init error:', err?.message);
  // Still seed API keys even if DB fails
  ApiKeyManager.seedFromEnvironment();
});

// ─── Background Auto Health Monitor ──────────────────────────────────────────
setInterval(async () => {
  try {
    if (!isDbAvailable()) return;
    const { getDb } = await import('./src/core/db/client');
    const db = await getDb();
    if (db) {
      // Auto-recover user API keys that failed (e.g. rate limit cooldown)
      const res = await db.userApiKey.updateMany({
        where: {
          OR: [
            { isHealthy: false },
            { rateLimitStatus: 'limited' },
            { consecutiveFails: { gt: 0 } }
          ],
          // Only recover if last failure was more than 1 minute ago
          lastFailureAt: { lt: new Date(Date.now() - 60000) }
        },
        data: {
          isHealthy: true,
          rateLimitStatus: 'ok',
          consecutiveFails: 0,
          lastErrorMessage: 'Auto-recovered by Health Monitor'
        }
      });
      if (res.count > 0) {
        console.log(`[HealthMonitor] Auto-recovered ${res.count} User API Key(s).`);
      }
    }
  } catch (err: any) {
    console.error('[HealthMonitor] Auto-recovery failed:', err?.message);
  }
}, 60000); // Runs every 60 seconds

// ─── Seed Admin Users to Database ────────────────────────────────────────────
async function seedAdminUsers() {
  const ADMIN_EMAILS = [
    { email: 'fahadhussain0282@gmail.com', fullName: 'Fahad Hussain',      passwordHash: 'legacy:admin_seed_1', plan: '1 Month Plan', days: 30,  price: 300 },
    { email: 'adobeicon99@gmail.com',      fullName: 'Adobe Icon Studio',  passwordHash: 'legacy:admin_seed_2', plan: '6 Months Plan', days: 180, price: 2000 },
    { email: 'admin@stockai.com',          fullName: 'StockAI Admin',      passwordHash: 'legacy:admin_seed_3', plan: '1 Month Plan', days: 30,  price: 300 },
  ];
  for (const a of ADMIN_EMAILS) {
    try {
      const existing = await userStore.findUserByEmail(a.email);
      const now = new Date().toISOString();
      if (!existing) {
        await userStore.createUser({
          id: `usr_admin_${a.email.split('@')[0].replace(/[^a-z0-9]/g, '')}`,
          fullName: a.fullName,
          email: a.email,
          passwordHash: a.passwordHash,
          provider: 'local',
          role: 'admin',
          status: 'active',
          subscription: {
            planId: a.days >= 180 ? 'plan_6m' : 'plan_1m',
            planName: a.plan,
            price: a.price,
            durationDays: a.days,
            activatedAt: now,
            expiresAt: new Date(Date.now() + a.days * 86400000).toISOString(),
            isActive: true,
            isExpired: false,
            deviceId: 'dev_admin'
          },
          activeDeviceId: 'dev_admin',
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          totalGenerations: 0,
          totalPrompts: 0,
          totalCsvExports: 0
        });
        console.log(`[StockAI] Admin seeded: ${a.email}`);
      } else {
        const { getDb } = await import('./src/core/db/client');
        const db = await getDb();
        if (db) {
          await db.user.update({
            where: { email: a.email },
            data: { role: 'admin', status: 'active' }
          });
          console.log(`[StockAI] Admin updated to active: ${a.email}`);
        }
      }
    } catch (err: any) {
      // Ignore duplicate — admin already exists in DB
      if (!err?.message?.includes('already exists')) {
        console.warn(`[StockAI] Admin seed warning (${a.email}):`, err?.message);
      }
    }
  }
}

// ─── Seed Enterprise API Key Pool from Environment Variables ─────────────────
// NOTE: Also called above after DB init — this is the synchronous fallback
// for cases where the server starts before DB init completes

// ─── Global Stability: Unhandled Rejections + Exceptions ─────────────────────
process.on('unhandledRejection', (reason: any) => {
  console.error('[StockAI] Unhandled Promise Rejection:', reason?.message || reason);
  // Do NOT exit — log and continue; process manager handles restarts
});

process.on('uncaughtException', (err: Error) => {
  console.error('[StockAI] Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});

const app = express();
app.set('trust proxy', 1); // Trust Vercel proxy for rate-limit X-Forwarded-For
const PORT = Number(process.env.PORT || 3002);
const SERVER_START_TIME = Date.now();

// ─── Security: Helmet headers (CSP disabled for Vite inline styles) ───────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ─── Request Timeout: 30s hard limit ──────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out. Please try again.', code: 'REQUEST_TIMEOUT' });
    }
  });
  next();
});

// ─── Rate Limiting: Auth routes (15 attempts per 15 min per IP) ───────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── Rate Limiting: General API (300 requests per 15 min per IP) ─────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/admin')
});
app.use('/api', generalLimiter);

// ─── Maintenance Mode Middleware ──────────────────────────────────────────────
const maintenanceCheck = (req: Request, res: Response, next: NextFunction) => {
  if (systemSettingsStore.maintenanceMode) {
    return res.status(503).json({
      error: systemSettingsStore.maintenanceMessage || 'StockAI is currently under maintenance. Please try again shortly.',
      code: 'MAINTENANCE_MODE'
    });
  }
  next();
};
app.use('/api/generate-metadata', maintenanceCheck);
app.use('/api/generate-prompt', maintenanceCheck);

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle invalid JSON gracefully instead of crashing
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[StockAI] Unhandled Express Error: Invalid JSON', err.message);
    return res.status(400).json({ error: 'Invalid JSON payload', code: 'INVALID_JSON' });
  }
  next(err);
});

// ─── Health Check API ─────────────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  const uptimeMs = Date.now() - SERVER_START_TIME;
  const mem = process.memoryUsage();

  function formatUptime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  res.json({
    status: 'ok',
    application: 'StockAI v3.0',
    uptime: Math.floor(uptimeMs / 1000),
    uptimeFormatted: formatUptime(uptimeMs),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`
    },
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      xai: Boolean(process.env.XAI_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      together: Boolean(process.env.TOGETHER_API_KEY)
    },
    timestamp: new Date().toISOString()
  });
});

// ─── Register Module Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/user/keys', apiKeysRouter);
app.use('/api/user', userRouter);
app.use('/api', aiRouter);
app.use('/api', teamRouter);
app.use('/api', billingRouter);
app.use('/api/admin', adminRouter);

// ─── Global Express Error Handler ────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[StockAI] Unhandled Express Error:', err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'An unexpected server error occurred. Please try again.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ─── Catch-all for API Routes (prevents 504 timeouts on Vercel) ───────────
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Vite Middleware for development vs Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const configuredProviders = [
    process.env.GEMINI_API_KEY && 'Gemini',
    process.env.OPENAI_API_KEY && 'OpenAI',
    process.env.ANTHROPIC_API_KEY && 'Claude',
    process.env.GROQ_API_KEY && 'Groq',
    process.env.XAI_API_KEY && 'xAI',
    process.env.OPENROUTER_API_KEY && 'OpenRouter',
    process.env.MISTRAL_API_KEY && 'Mistral',
    process.env.DEEPSEEK_API_KEY && 'DeepSeek',
    process.env.TOGETHER_API_KEY && 'Together'
  ].filter(Boolean).join(', ');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✦ StockAI v3.0 — Enterprise Stock Metadata Engine`);
    console.log(`  Server:     http://0.0.0.0:${PORT}`);
    console.log(`  Node:       ${process.version}`);
    console.log(`  Providers:  ${configuredProviders || 'None configured'}`);
    console.log(`  Security:   Helmet + Rate Limiting + Request Timeout\n`);
  });
}

// Export app for Vercel Serverless Functions
export default app;

// Only start the standalone server if NOT running on Vercel
if (!process.env.VERCEL) {
  startServer();
}
