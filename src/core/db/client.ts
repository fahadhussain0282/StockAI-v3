/**
 * StockAI v3.0 Enterprise — Prisma Database Client
 *
 * Configured for Supabase PostgreSQL using @prisma/adapter-pg.
 * Uses a connection pool so serverless functions share connections.
 *
 * Priority:
 *  1. DATABASE_URL set → PostgreSQL via pg pool (production)
 *  2. DATABASE_URL not set → throws clear error (no silent in-memory fallback in production)
 *
 * Usage:
 *   import { getDb, isDbAvailable, initDb } from './client'
 *
 *   // In route handlers — always use requireDb() for safety:
 *   const db = await requireDb(res); // returns db or sends 503 and returns null
 */

import { PrismaClient } from '@prisma/client';
import type { Response } from 'express';

// ─── Singleton ─────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let _db: PrismaClient | null = null;
let _dbAvailable = false;
let _initPromise: Promise<void> | null = null;

/**
 * Initializes the database client.
 * Safe to call multiple times — only initializes once (singleton).
 * Returns a promise — awaiting ensures DB is ready before first request.
 */
export async function initDb(): Promise<void> {
  // Return existing promise if initialization already in progress
  if (_initPromise) return _initPromise;
  if (_db !== null) return;

  _initPromise = _doInitDb();
  return _initPromise;
}

async function _doInitDb(): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL || DATABASE_URL.trim().length === 0) {
    const msg =
      '\n⚠️  [StockAI DB] DATABASE_URL is not set.\n' +
      '   Production requires a Supabase PostgreSQL connection string.\n' +
      '   Add DATABASE_URL to your Vercel environment variables.\n';
    console.warn(msg);
    _dbAvailable = false;
    _initPromise = null;
    return;
  }

  try {
    // Reuse singleton in development (prevents connection exhaustion during hot reload)
    if (global.__prisma) {
      _db = global.__prisma;
      _dbAvailable = true;
      console.log('[StockAI DB] Reusing existing Prisma client (hot-reload)');
      return;
    }

    // Parse URL to strip sslmode (we configure ssl via pg pool options)
    const parsedUrl = new URL(DATABASE_URL);
    parsedUrl.searchParams.delete('sslmode');

    const { Pool } = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');

    const pool = new Pool({
      connectionString: parsedUrl.toString(),
      ssl: {
        rejectUnauthorized: false  // Required for Supabase PgBouncer pooler SSL
      },
      max: process.env.NODE_ENV === 'production' ? 3 : 10,
      idleTimeoutMillis: 1000,        // Close idle connections quickly (Vercel freeze)
      connectionTimeoutMillis: 8000,  // 8s timeout (was 5s — too short for cold starts)
      keepAlive: true,
      allowExitOnIdle: true,
    });

    const adapter = new PrismaPg(pool);

    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    // Test connection with retry (Vercel cold starts can be slow)
    let lastErr: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await client.$queryRaw`SELECT 1`;
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        if (attempt < 3) {
          console.warn(`[StockAI DB] Connection attempt ${attempt} failed, retrying... ${err?.message}`);
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
    }

    if (lastErr) throw lastErr;

    _db = client;
    _dbAvailable = true;

    if (process.env.NODE_ENV !== 'production') {
      global.__prisma = client;
    }

    console.log('[StockAI DB] ✅ Supabase PostgreSQL connected successfully');
  } catch (err: any) {
    console.error('[StockAI DB] ❌ Database connection failed:', err?.message);
    _db = null;
    _dbAvailable = false;
    _initPromise = null; // Allow retry on next request
  }
}

/**
 * Returns the Prisma client synchronously, or null if not available.
 * Use requireDb() in route handlers for automatic error responses.
 */
export function getDb(): PrismaClient | null {
  return _db;
}

/**
 * Returns the Prisma client, initializing if needed.
 * Awaitable — use in route handlers that need DB.
 */
export async function getDbAsync(): Promise<PrismaClient | null> {
  if (!_db) await initDb();
  return _db;
}

/**
 * Route handler helper — gets DB or sends 503 response.
 * Returns PrismaClient if available, null if 503 was sent.
 *
 * Usage:
 *   const db = await requireDb(res);
 *   if (!db) return; // 503 already sent
 */
export async function requireDb(res: Response): Promise<PrismaClient | null> {
  const db = await getDbAsync();
  if (!db) {
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Database is currently unavailable. Please try again in a moment.',
        code: 'DB_UNAVAILABLE'
      });
    }
    return null;
  }
  return db;
}

/**
 * Returns true if PostgreSQL is connected and available.
 */
export function isDbAvailable(): boolean {
  return _dbAvailable && _db !== null;
}

/**
 * Disconnects the Prisma client. Call on server shutdown.
 */
export async function disconnectDb(): Promise<void> {
  if (_db) {
    await _db.$disconnect();
    _db = null;
    _dbAvailable = false;
    _initPromise = null;
  }
}

// Convenience export — may be null if DB not available
export { _db as db };
