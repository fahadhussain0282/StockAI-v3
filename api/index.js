/**
 * StockAI v3.0 — Vercel Serverless Entry Point
 *
 * This file is the API handler for Vercel serverless functions.
 * It imports the Express app from server.ts (compiled to server.cjs).
 *
 * Vercel builds this project via:
 *   npm run build → vite build + esbuild server.ts → dist/server.cjs
 *
 * The rewrite rule in vercel.json routes all /api/* requests here.
 */

// Import the compiled Express app from the build output.
// The build script (package.json) produces dist/server.cjs via esbuild.
import app from '../dist/server.cjs';

export default app;
