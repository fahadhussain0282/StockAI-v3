import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session-service';
import { PermissionService } from './permission-service';
import { Role } from './types';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: any;
        sessionToken: string;
      };
    }
  }
}

export class AuthMiddleware {
  /**
   * Basic Authentication Middleware
   * Validates the bearer token and injects the user into the request.
   */
  public static async authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const deviceHeader = (req.headers['x-device-id'] as string) || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    }

    const token = authHeader.substring(7);
    
    try {
      const auth = await SessionService.validateSession(token, deviceHeader);
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session.' });
      }

      req.auth = auth;
      next();
    } catch (err) {
      console.error('Auth Middleware Error:', err);
      return res.status(500).json({ error: 'Internal Server Error during authentication.' });
    }
  }

  /**
   * Role-Based Authorization Middleware Factory
   */
  public static requireRole(requiredRole: Role) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth) {
        return res.status(401).json({ error: 'Unauthorized: Must be authenticated.' });
      }

      // We handle specific admin logic check here via PermissionService
      if (requiredRole === 'admin' && !PermissionService.canAccessAdminPanel(req.auth.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
      }

      next();
    };
  }
}
