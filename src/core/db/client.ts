/**
 * StockAI v3.0 Enterprise — Prisma Database Client
 *
 * Configured for Supabase PostgreSQL using @prisma/adapter-pg.
 * Uses a connection pool so serverless functions share connections.
 *
 * Priority:
 *  1. DATABASE_URL set → PostgreSQL via pg pool (production)
 *  2. DATABASE_URL not set → logs warning, falls back to in-memory store
 *
 * Usage:
 *   import { getDb, isDbAvailable, initDb } from './client'
 *
 *   // In route handlers — always use requireDb() for safety:
 *   const db = await requireDb(res); // returns db or sends 503 and returns null
 */

import { PrismaClient } from '@prisma/client';
import type { Response } from 'express';

// ─── State ─────────────────────────────────────────────────────────────────────

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
    console.warn(
      '\n⚠️  [StockAI DB] DATABASE_URL is not set.\n' +
      '   Production requires a Supabase PostgreSQL connection string.\n' +
      '   Add DATABASE_URL to your Vercel environment variables.\n' +
      '   Falling back to in-memory store (data will be lost on restart).\n'
    );
    _dbAvailable = false;
    _initPromise = null;
    return;
  }

  try {
    const { Pool } = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');

    // Strip sslmode from URL — we configure SSL via pool options
    const rawUrl = new URL(DATABASE_URL);
    rawUrl.searchParams.delete('sslmode');
    const connectionString = rawUrl.toString();

    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false  // Required for Supabase PgBouncer pooler SSL
      },
      max: 3,                         // Low pool size for Vercel serverless (each fn has its own)
      idleTimeoutMillis: 10000,       // 10s idle before closing (Vercel freeze)
      connectionTimeoutMillis: 10000, // 10s timeout (allows for cold-start latency)
      keepAlive: false,               // Disable keepAlive for serverless — connections are ephemeral
      allowExitOnIdle: true,
    });

    const adapter = new PrismaPg(pool);

    const client = new PrismaClient({
      adapter,
      log: ['error'],
    });

    // Test connection with retry (Vercel cold starts can have high latency)
    let lastErr: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await client.$queryRaw`SELECT 1`;
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        if (attempt < 3) {
          console.warn(`[StockAI DB] Connection attempt ${attempt}/3 failed — retrying in ${500 * attempt}ms... (${err?.message})`);
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
    }

    if (lastErr) throw lastErr;

    _db = client;
    _dbAvailable = true;

    console.log('[StockAI DB] ✅ Supabase PostgreSQL connected successfully');
  } catch (err: any) {
    console.error('[StockAI DB] ❌ Database connection FAILED:', err?.message);
    console.error('[StockAI DB]    DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 40) + '...');
    console.error('[StockAI DB]    Falling back to in-memory store. Set DATABASE_URL in Vercel env vars.');
    _db = null;
    _dbAvailable = false;
    _initPromise = null; // Allow retry on next cold start
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
