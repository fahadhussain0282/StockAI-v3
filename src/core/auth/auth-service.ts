import { userStore } from './user-store';
import { PasswordService } from './password-service';
import { SessionService } from './session-service';
import { AuthValidators } from './validators';
import { OAuth2Client } from 'google-auth-library';
import { UserRecord } from './types';
export class AuthService {
  // Configured in server.ts originally, but should live in auth configuration
  private static readonly IMMUTABLE_ADMIN_EMAILS = [
    'adobeicon99@gmail.com',
    'fahadhussain0282@gmail.com'
  ];

  private static getGoogleClient(): OAuth2Client {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Google OAuth is not configured on the server. Missing GOOGLE_CLIENT_ID.');
    }
    return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  }

  public static async signup(payload: any, deviceFingerprint: string, clientDeviceId?: string): Promise<{ user: UserRecord; token: string }> {
    const { fullName, email, password, confirmPassword, termsAccepted } = payload;

    if (!termsAccepted) throw new Error('You must accept the Terms of Service.');
    if (password !== confirmPassword) throw new Error('Passwords do not match.');
    
    const emailValidation = AuthValidators.validateEmail(email);
    if (!emailValidation.valid) throw new Error(emailValidation.error);
    const cleanEmail = emailValidation.cleanEmail;

    const pwValidation = PasswordService.validatePasswordStrength(password);
    if (!pwValidation.valid) throw new Error(pwValidation.error);

    const existing = await userStore.findUserByEmail(cleanEmail);
    if (existing) throw new Error('An account with this email address already exists.');

    const isAdminEmail = this.IMMUTABLE_ADMIN_EMAILS.includes(cleanEmail);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const deviceId = clientDeviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const passwordHash = await PasswordService.hashPassword(password);

    const newUser: UserRecord = {
      id: userId,
      fullName: AuthValidators.sanitizeInput(fullName || 'Contributor'),
      email: cleanEmail,
      passwordHash,
      provider: 'local',
      role: isAdminEmail ? 'admin' : 'contributor',
      status: isAdminEmail ? 'active' : 'pending_activation',
      subscription: {
        planId: 'plan_1m',
        planName: '1 Month Plan',
        price: 300,
        durationDays: 30,
        activatedAt: new Date().toISOString(),
        expiresAt: isAdminEmail ? new Date(Date.now() + 30 * 86400000).toISOString() : new Date().toISOString(),
        isActive: isAdminEmail,
        isExpired: !isAdminEmail,
        deviceId
      },
      activeDeviceId: deviceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 0,
      totalPrompts: 0,
      totalCsvExports: 0
    };

    await userStore.createUser(newUser);
    
    const token = await SessionService.createSession(userId, deviceId);

    return { user: newUser, token };
  }

  public static async login(payload: any, clientDeviceId?: string): Promise<{ user: UserRecord; token: string }> {
    const { email, password } = payload;
    
    const emailValidation = AuthValidators.validateEmail(email);
    if (!emailValidation.valid) throw new Error('Email and password are required.');
    
    const cleanEmail = emailValidation.cleanEmail;

    const user = await userStore.findUserByEmail(cleanEmail);
    if (!user) throw new Error('Invalid email address or password.');

    const isMatch = await PasswordService.verifyPassword(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid email address or password.');

    // Generate new session (this invalidates old sessions automatically via SessionService)
    const newDeviceId = clientDeviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const token = await SessionService.createSession(user.id, newDeviceId);

    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    await userStore.updateUser(user.id, { lastLoginAt: user.lastLoginAt, updatedAt: user.updatedAt });

    return { user, token };
  }

  public static async loginWithGoogle(idToken: string, clientDeviceId?: string): Promise<{ user: UserRecord; token: string }> {
    const client = this.getGoogleClient();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Invalid Google token payload.');

    const cleanEmail = payload.email.toLowerCase().trim();
    let user = await userStore.findUserByEmail(cleanEmail);

    const isAdminEmail = this.IMMUTABLE_ADMIN_EMAILS.includes(cleanEmail);
    const newDeviceId = clientDeviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (!user) {
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      user = {
        id: userId,
        fullName: payload.name || 'Google Contributor',
        email: cleanEmail,
        googleId: payload.sub,
        avatar: payload.picture,
        provider: 'google',
        role: isAdminEmail ? 'admin' : 'contributor',
        status: 'active', // Auto-activate Google users
        subscription: {
          planId: 'plan_1m',
          planName: '1 Month Plan',
          price: 300,
          durationDays: 30,
          activatedAt: new Date().toISOString(),
          expiresAt: isAdminEmail ? new Date(Date.now() + 30 * 86400000).toISOString() : new Date().toISOString(),
          isActive: isAdminEmail,
          isExpired: !isAdminEmail,
          deviceId: newDeviceId
        },
        activeDeviceId: newDeviceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        totalGenerations: 0,
        totalPrompts: 0,
        totalCsvExports: 0
      };

      await userStore.createUser(user);
    } else {
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      user.googleId = payload.sub;
      if (payload.picture && !user.avatar) user.avatar = payload.picture;
      await userStore.updateUser(user.id, { 
        lastLoginAt: user.lastLoginAt, 
        updatedAt: user.updatedAt,
        googleId: user.googleId,
        avatar: user.avatar
      });
    }

    const token = await SessionService.createSession(user.id, newDeviceId);
    return { user, token };
  }
}
