import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { authRouter } from './src/core/auth';
import { userRouter } from './src/core/users';
import { teamRouter } from './src/core/teams';
import { billingRouter } from './src/core/billing';
import { adminRouter } from './src/routes/admin-routes';
import { aiRouter } from './src/routes/ai-routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3002);

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check API
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    geminiConfigured: hasKey,
    timestamp: new Date().toISOString()
  });
});

// Register Module Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api', aiRouter);
app.use('/api', teamRouter);
app.use('/api', billingRouter);
app.use('/api/admin', adminRouter);

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StockAI Server listening on http://0.0.0.0:${PORT}`);
    console.log('Enterprise Authentication & Access Control Active.');
  });
}

// Export app for Vercel Serverless Functions
export default app;

// Only start the standalone server if NOT running on Vercel
if (!process.env.VERCEL) {
  startServer();
}
