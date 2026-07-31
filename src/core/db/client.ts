/**
 * StockAI v3.0 Enterprise — Prisma Database Client
 *
 * Configured for Supabase PostgreSQL using @prisma/adapter-pg.
 * Uses a connection pool so serverless functions share connections.
 *
 * Priority:
 *  1. DATABASE_URL set → PostgreSQL via pg pool (production)
 *  2. DATABASE_URL not set → in-memory fallback (development without DB)
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

  // Use DATABASE_URL (port 6543 IPv4 pooler) to avoid Vercel IPv6 outbound timeouts.
  // The pg adapter with rejectUnauthorized: false handles the pooler's self-signed cert.
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL || DATABASE_URL.trim().length === 0) {
    console.warn(
      '\n⚠️  [StockAI DB] DATABASE_URL is not set.\n' +
      '   The application will use an in-memory fallback store.\n' +
      '   Data will NOT persist across server restarts.\n' +
      '   For production: add DATABASE_URL to .env (Supabase PostgreSQL connection string)\n'
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
    
    // Parse URL to strip sslmode which overrides pg pool ssl config
    const parsedUrl = new URL(DATABASE_URL);
    parsedUrl.searchParams.delete('sslmode');
    parsedUrl.searchParams.delete('pgbouncer');
    parsedUrl.searchParams.delete('connection_limit');
    
    // ─── pg Pool + @prisma/adapter-pg (Supabase/standard PostgreSQL) ──────────
    const { Pool } = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');

    const pool = new Pool({
      connectionString: parsedUrl.toString(),
      ssl: {
        // Supabase requires SSL; rejectUnauthorized: false for self-signed certs
        rejectUnauthorized: false
      },
      max: process.env.NODE_ENV === 'production' ? 3 : 10, // Limit for serverless
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
    });

    const adapter = new PrismaPg(pool);

    const client = new PrismaClient({
      adapter,
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

    console.log('[StockAI DB] ✅ Supabase PostgreSQL connected successfully');
  } catch (err: any) {
    console.error('[StockAI DB] ❌ Database connection failed:', err?.message);
    console.warn('[StockAI DB] Falling back to in-memory store. Check DATABASE_URL and Supabase network settings.');
    _db = null;
    _dbAvailable = false;
  }
}

/**
 * Returns the Prisma client instance (or null if DB not available).
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
