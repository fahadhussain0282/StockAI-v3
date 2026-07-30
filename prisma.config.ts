/**
 * StockAI v3.0 — Prisma Configuration (Prisma v7)
 *
 * In Prisma v7, connection URLs moved FROM schema.prisma TO this file.
 * - CLI (migrate, db push, studio): reads datasource.url from this config
 * - PrismaClient runtime: must use a driver adapter (see src/core/db/client.ts)
 *
 * Database: Supabase PostgreSQL
 * Docs: https://pris.ly/d/config-datasource
 */

import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// DIRECT_URL is used for migrations (bypasses connection pooler).
// For local dev, both URLs are the same direct Supabase connection.
// For Vercel production: DATABASE_URL = Session Pooler, DIRECT_URL = Direct connection
const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!DIRECT_URL) {
  console.warn('[Prisma Config] DIRECT_URL / DATABASE_URL is not set. CLI operations will fail.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: DIRECT_URL!,
  },
});
