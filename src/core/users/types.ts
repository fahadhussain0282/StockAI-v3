export interface UserProfile {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  country: string;
  timezone: string;
  language: string;
  company: string;
  website: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  profileVisibility: 'public' | 'private' | 'team';
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  defaultMarketplace: string;
  defaultAiProvider: string;
  defaultExportFormat: string;
  notifications: {
    emailAlerts: boolean;
    inAppAlerts: boolean;
    marketingEmails: boolean;
  };
  dashboardLayout: any;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  metadata?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivitySummary {
  lastLogin: string | null;
  totalUploads: number;
  totalExports: number;
  totalPromptsGenerated: number;
  totalBenchmarkRuns: number;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AvatarUploadResult {
  url: string;
  size: number;
  format: string;
}
