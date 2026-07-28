import { Router, Request, Response } from 'express';
import { AuthService } from './auth-service';
import { AuthMiddleware } from './auth-middleware';

const router = Router();

// Signup Route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Collect device fingerprint if present, else fallback
    const deviceFingerprint = req.body.deviceFingerprint || {
      userAgent: req.headers['user-agent'],
      platform: 'unknown'
    };
    
    const result = await AuthService.signup(req.body, JSON.stringify(deviceFingerprint));
    
    return res.json(result);
  } catch (err: any) {
    // Standardized error response, never expose internal DB errors
    return res.status(400).json({ error: err.message || 'Signup failed.' });
  }
});

// Login Route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Login failed.' });
  }
});

// Google Login Route
router.post('/google', async (req: Request, res: Response) => {
  try {
    if (!req.body.idToken) {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }
    const result = await AuthService.loginWithGoogle(req.body.idToken);
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Google authentication failed.' });
  }
});

// Get Current User (Me) Route
router.get('/me', AuthMiddleware.authenticate, (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  // Return sanitized user object (e.g., omitting passwordHash)
  const { passwordHash, ...safeUser } = req.auth.user;
  return res.json({ user: safeUser });
});

// Logout Route
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

export const authRouter = router;
