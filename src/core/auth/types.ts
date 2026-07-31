export type Role = 'guest' | 'contributor' | 'admin' | 'team_owner' | 'team_member' | 'viewer' | 'moderator';

export type UserStatus = 'pending_activation' | 'active' | 'expired' | 'suspended' | 'blocked';

export interface UserSubscription {
  planId: string;
  planName: string;
  price: number;
  durationDays: number;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
  isExpired: boolean;
  deviceId: string;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string; // Optional for Google OAuth users
  googleId?: string;
  avatar?: string;
  provider: 'local' | 'google';
  role: Role;
  status: UserStatus;
  subscription: UserSubscription;
  activeDeviceId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  totalGenerations: number;
  totalPrompts: number;
  totalCsvExports: number;
}

export interface SessionRecord {
  userId: string;
  deviceId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUser: string;
  details: string;
}

export interface AuthContext {
  user: UserRecord;
  sessionToken: string;
}
