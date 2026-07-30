import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './src/core/auth';
import { userRouter } from './src/core/users';
import { teamRouter } from './src/core/teams';
import { billingRouter } from './src/core/billing';
import { adminRouter, systemSettingsStore } from './src/routes/admin-routes';
import { aiRouter } from './src/routes/ai-routes';
import { ApiKeyManager } from './src/core/ai/api-key-manager';

dotenv.config();

// ─── Seed Enterprise API Key Pool from Environment Variables ─────────────────
// This runs before any request, ensuring all ENV keys are in the pool at startup
ApiKeyManager.seedFromEnvironment();

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
      xai: Boolean(process.env.XAI_API_KEY)
    },
    timestamp: new Date().toISOString()
  });
});

// ─── Register Module Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRouter);
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
    process.env.XAI_API_KEY && 'xAI'
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
