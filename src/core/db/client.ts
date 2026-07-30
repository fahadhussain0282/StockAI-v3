/**
 * StockAI v3.0 Enterprise — Prisma Database Client
 *
 * Provides a singleton PrismaClient instance configured for:
 *  - Neon serverless (WebSocket-based HTTP transport for Vercel)
 *  - Standard PostgreSQL (local dev, traditional hosting)
 *  - Graceful degradation when DATABASE_URL is not configured
 *
 * Usage: import { db, isDbAvailable } from './client'
 */

import { PrismaClient } from '@prisma/client';

// ─── Singleton pattern (required for hot-reload environments) ─────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let _db: PrismaClient | null = null;
let _dbAvailable = false;

/**
 * Initializes the database client.
 * Safe to call multiple times — only initializes once (singleton).
 */
export async function initDb(): Promise<void> {
  if (_db !== null) return;

  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL || DATABASE_URL.trim().length === 0) {
    console.warn(
      '\n⚠️  [StockAI DB] DATABASE_URL is not set.\n' +
      '   The application will use an in-memory fallback store.\n' +
      '   Data will NOT persist across server restarts.\n' +
      '   For production: add DATABASE_URL to .env (PostgreSQL/Neon connection string)\n'
    );
    _dbAvailable = false;
    return;
  }

  try {
    // Use the global singleton in development (prevents connection exhaustion during hot reload)
    if (global.__prisma) {
      _db = global.__prisma;
      _dbAvailable = true;
      console.log('[StockAI DB] Reusing existing Prisma client (hot-reload)');
      return;
    }

    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
    });

    // Test connection
    await client.$connect();
    await client.$queryRaw`SELECT 1`;

    _db = client;
    _dbAvailable = true;

    if (process.env.NODE_ENV !== 'production') {
      global.__prisma = client;
    }

    console.log('[StockAI DB] ✅ PostgreSQL connected successfully');
  } catch (err: any) {
    console.error('[StockAI DB] ❌ Database connection failed:', err?.message);
    console.warn('[StockAI DB] Falling back to in-memory store. Check DATABASE_URL.');
    _db = null;
    _dbAvailable = false;
  }
}

/**
 * Returns the Prisma client instance (or null if DB not available).
 * Always check `isDbAvailable()` before using.
 */
export function getDb(): PrismaClient | null {
  return _db;
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
  }
}

// Convenience export — may be null if DB not available
export { _db as db };
