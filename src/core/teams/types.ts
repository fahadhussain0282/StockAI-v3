export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER' | 'GUEST';

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  teamId: string;
  orgId: string;
  name: string;
  type: 'SEO' | 'ASSET' | 'PROMPT' | 'SHARED' | 'CUSTOM';
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  orgId: string;
  teamId?: string; // Optional if Org-level only
  userId: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
}

export interface Invitation {
  id: string;
  orgId: string;
  teamId?: string;
  email: string;
  role: Role;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  orgId: string;
  teamId?: string;
  timestamp: string;
  metadata?: any;
}
