import { Router, Request, Response } from 'express';
import { AuthService } from './auth-service';
import { AuthMiddleware } from './auth-middleware';
import { userStore } from './user-store';
import { PasswordService } from './password-service';
import crypto from 'crypto';

const router = Router();

// ─── Request Logger (Step 5 — Server Logging) ────────────────────────────────
function logRequest(label: string, data?: any) {
  const ts = new Date().toISOString();
  console.log(`\n[StockAI Auth][${ts}] ▶ ${label}`);
  if (data !== undefined) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

// ─── Signup Route ─────────────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  logRequest('POST /api/auth/signup', {
    email: req.body.email,
    fullName: req.body.fullName,
    termsAccepted: req.body.termsAccepted,
    hasPassword: Boolean(req.body.password),
    hasConfirmPassword: Boolean(req.body.confirmPassword)
  });

  try {
    const deviceFingerprint = req.body.deviceFingerprint || {
      userAgent: req.headers['user-agent'],
      platform: 'unknown'
    };

    const clientDeviceId = req.headers['x-device-id'] as string | undefined;

    logRequest('Signup — Hashing password...');
    const result = await AuthService.signup(req.body, JSON.stringify(deviceFingerprint), clientDeviceId);
    logRequest('Signup — SUCCESS', { userId: result.user.id, email: result.user.email });
    return res.json(result);
  } catch (err: any) {
    console.error('[StockAI Auth] Signup ERROR:', err.message);
    console.error('[StockAI Auth] Stack:', err.stack);
    return res.status(400).json({ error: err.message || 'Signup failed.' });
  }
});

// ─── Login Route ──────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  logRequest('POST /api/auth/login', { email: req.body.email, hasPassword: Boolean(req.body.password) });

  try {
    const clientDeviceId = req.headers['x-device-id'] as string | undefined;
    const result = await AuthService.login(req.body, clientDeviceId);
    logRequest('Login — SUCCESS', { userId: result.user.id });
    return res.json(result);
  } catch (err: any) {
    console.error('[StockAI Auth] Login ERROR:', err.message);
    return res.status(401).json({ error: err.message || 'Login failed.' });
  }
});

// ─── Google Login Route ───────────────────────────────────────────────────────
router.post('/google', async (req: Request, res: Response) => {
  logRequest('POST /api/auth/google', {
    hasIdToken: Boolean(req.body.idToken),
    idTokenLength: req.body.idToken?.length,
    GOOGLE_CLIENT_ID_SET: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET_SET: Boolean(process.env.GOOGLE_CLIENT_SECRET)
  });

  try {
    if (!req.body.idToken) {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('[StockAI Auth] CRITICAL: GOOGLE_CLIENT_ID environment variable is NOT SET on the server.');
      console.error('[StockAI Auth] Add GOOGLE_CLIENT_ID to your .env file and to Vercel Environment Variables.');
      return res.status(503).json({
        error: 'Google OAuth is not configured on this server. The administrator must set GOOGLE_CLIENT_ID.'
      });
    }

    const clientDeviceId = req.headers['x-device-id'] as string | undefined;
    const result = await AuthService.loginWithGoogle(req.body.idToken, clientDeviceId);
    logRequest('Google Login — SUCCESS', { userId: result.user.id, email: result.user.email });
    return res.json(result);
  } catch (err: any) {
    console.error('[StockAI Auth] Google Login ERROR:', err.message);
    console.error('[StockAI Auth] Stack:', err.stack);
    return res.status(401).json({ error: err.message || 'Google authentication failed.' });
  }
});

// ─── Get Current User (Me) Route ──────────────────────────────────────────────
router.get('/me', AuthMiddleware.authenticate, (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const { passwordHash, ...safeUser } = req.auth.user;
  return res.json({ user: safeUser });
});

// ─── Logout Route ─────────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { SessionService } = await import('./session-service');
      await SessionService.terminateSession(token);
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Logout failed.' });
  }
});

// ─── Forgot Password Route ────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await userStore.findUserByEmail(cleanEmail);

    // Security: always return success even if email not found (prevents email enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: 'If this email exists in our system, password reset instructions have been sent.'
      });
    }

    // Generate a cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await userStore.createResetToken(user.id, resetToken);

    // In production: send email via SendGrid/SES/Nodemailer
    // For now: log to console for admin review
    console.log(`[StockAI] Password Reset Token for ${cleanEmail}: ${resetToken}`);
    console.log(`[StockAI] Reset URL: ${process.env.APP_URL || 'https://stockai.vercel.app'}/reset-password?token=${resetToken}`);

    return res.json({
      success: true,
      message: 'If this email exists in our system, password reset instructions have been sent.',
      // Only expose token in development for testing
      ...(process.env.NODE_ENV !== 'production' && { devResetToken: resetToken })
    });
  } catch (err: any) {
    console.error('[StockAI] Forgot password error:', err);
    return res.status(500).json({ error: 'Password reset request failed. Please try again.' });
  }
});

// ─── Reset Password Route ─────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'A valid reset token is required.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const userId = await userStore.validateResetToken(token);
    if (!userId) {
      return res.status(400).json({ error: 'This reset link has expired or is invalid. Please request a new one.' });
    }

    const pwValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    const newHash = await PasswordService.hashPassword(newPassword);
    await userStore.updateUser(userId, {
      passwordHash: newHash,
      updatedAt: new Date().toISOString()
    });
    await userStore.deleteResetToken(token);

    // Invalidate all sessions for security after password reset
    await userStore.deleteSessionsByUserId(userId);

    return res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (err: any) {
    console.error('[StockAI] Reset password error:', err);
    return res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
});

// ─── Dev-Only Admin Token (DISABLED in production) ────────────────────────────
// Provides a pre-authenticated admin token for automated testing and CI.
// Returns 403 in any production environment.
router.post('/dev-admin-token', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production.' });
  }
  const secret = process.env.DEV_TEST_SECRET || 'stockai-dev-test-2024';
  const provided = req.headers['x-dev-secret'] || req.body?.devSecret;
  if (provided !== secret) {
    return res.status(401).json({ error: 'Invalid dev secret.' });
  }
  try {
    // Find the seeded admin user
    const adminEmail = req.body?.email || 'adobeicon99@gmail.com';
    const user = await userStore.findUserByEmail(adminEmail);
    if (!user || user.role !== 'admin') {
      return res.status(404).json({ error: `Admin user "${adminEmail}" not found in store.` });
    }
    const { SessionService } = await import('./session-service');
    const token = await SessionService.createSession(user.id, 'stress-test-device');
    console.log(`[DEV] Admin token issued for "${user.email}" (stress testing)`);
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export const authRouter = router;

