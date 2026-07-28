import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../auth/auth-middleware';
import { ProfileService } from './profile-service';
import { PreferencesService } from './preferences-service';
import { ActivityService } from './activity-service';
import { AvatarService } from './avatar-service';
import { AccountService } from './account-service';
import { NotificationService } from './notification-service';

export const userRouter = Router();

// Apply auth middleware to all user routes
userRouter.use(AuthMiddleware.authenticate);

// Profile
userRouter.get('/profile', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const profile = await ProfileService.getProfile(userId);
  res.json({ profile });
});

userRouter.put('/profile', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const result = await ProfileService.updateProfile(userId, req.body);
  if (result.errors) {
    return res.status(400).json({ errors: result.errors });
  }
  res.json({ profile: result.profile });
});

// Preferences
userRouter.get('/preferences', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const preferences = await PreferencesService.getPreferences(userId);
  res.json({ preferences });
});

userRouter.put('/preferences', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const result = await PreferencesService.updatePreferences(userId, req.body);
  if (result.errors) {
    return res.status(400).json({ errors: result.errors });
  }
  res.json({ preferences: result.preferences });
});

// Activity
userRouter.get('/activity', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const activities = await ActivityService.getRecentActivity(userId);
  const summary = await ActivityService.getSummary(userId);
  res.json({ activities, summary });
});

// Notifications
userRouter.get('/notifications', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const unreadOnly = req.query.unread === 'true';
  const notifications = await NotificationService.getNotifications(userId, unreadOnly);
  res.json({ notifications });
});

userRouter.post('/notifications/:id/read', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  await NotificationService.markAsRead(userId, req.params.id);
  res.json({ success: true });
});

// Avatar
userRouter.post('/avatar', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { fileData, mimeType, sizeBytes } = req.body;
  if (!fileData || !mimeType || !sizeBytes) {
    return res.status(400).json({ error: 'Missing avatar data payload' });
  }
  const result = await AvatarService.uploadAvatar(userId, fileData, mimeType, sizeBytes);
  if (result.errors) {
    return res.status(400).json({ errors: result.errors });
  }
  res.json({ avatar: result.result });
});

userRouter.delete('/avatar', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  await AvatarService.removeAvatar(userId);
  res.json({ success: true });
});

// Account Settings
userRouter.post('/account/email', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: 'Missing new email' });
  const result = await AccountService.changeEmail(userId, newEmail);
  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }
  res.json({ success: true });
});

userRouter.post('/account/password', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Missing new password' });
  const result = await AccountService.changePassword(userId, newPassword);
  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }
  res.json({ success: true });
});

userRouter.delete('/account', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const result = await AccountService.deactivateAccount(userId);
  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }
  res.json({ success: true, message: 'Account deactivated.' });
});
