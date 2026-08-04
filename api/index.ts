/**
 * StockAI v3.0 Enterprise — Vercel Serverless Entry Point
 *
 * This file is the serverless function handler for Vercel.
 * It MUST initialize the database before any request is handled,
 * because Vercel cold starts can skip module-level async code.
 *
 * Architecture:
 *   Vercel → api/index.ts → server.ts (Express app) → routes
 *
 * The initDb() call here ensures the DB is ready on every cold start.
 */

import type { Request, Response } from 'express';
import { initDb } from '../src/core/db/client';

// Import the Express app from server.ts
import app from '../server';

// Track initialization state
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

/**
 * Ensure database is initialized exactly once per cold start.
 * Concurrent requests will wait for the same initialization.
 */
async function ensureDbReady(): Promise<void> {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = initDb().then(() => {
      dbInitialized = true;
    }).catch((err) => {
      console.error('[Vercel Handler] DB init error:', err?.message);
      dbInitPromise = null; // Allow retry
    });
  }
  return dbInitPromise;
}

/**
 * Vercel serverless handler — wraps the Express app with DB initialization.
 */
export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    await ensureDbReady();
  } catch (err: any) {
    console.error('[Vercel Handler] Failed to initialize DB:', err?.message);
    // Continue — routes will return 503 if DB is truly unavailable
  }

  // Delegate to the Express app
  return new Promise((resolve) => {
    app(req, res, (err: any) => {
      if (err) {
        console.error('[Vercel Handler] Unhandled Express Error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal Server Error (Vercel Handler)' });
        }
      }
      resolve();
    });
    res.on('finish', resolve);
    res.on('close', resolve);
  });
}
