import { UserRecord, SessionRecord, AuditLog } from './types';

// In-Memory implementation mimicking a future DB client (Prisma/TypeORM)
class UserStoreImpl {
  private users: Map<string, UserRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  // Users
  public async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  public async getAllUsers(): Promise<UserRecord[]> {
    return Array.from(this.users.values());
  }

  public async getAllAuditLogs(): Promise<AuditLog[]> {
    return [...this.auditLogs];
  }

  public async getActiveSessionsCount(): Promise<number> {
    return this.sessions.size;
  }

  public async createUser(user: UserRecord): Promise<void> {
    if (await this.findUserByEmail(user.email)) {
      throw new Error('User with this email already exists.');
    }
    this.users.set(user.id, user);
  }

  public async updateUser(id: string, updates: Partial<UserRecord>): Promise<void> {
    const user = await this.findUserById(id);
    if (user) {
      this.users.set(id, { ...user, ...updates });
    }
  }

  // Sessions
  public async findSessionByToken(token: string): Promise<SessionRecord | null> {
    return this.sessions.get(token) || null;
  }

  public async findSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    const userSessions: SessionRecord[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  public async createSession(session: SessionRecord): Promise<void> {
    this.sessions.set(session.token, session);
  }

  public async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  public async deleteSessionsByUserId(userId: string): Promise<void> {
    const tokensToDelete: string[] = [];
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        tokensToDelete.push(token);
      }
    }
    tokensToDelete.forEach(token => this.sessions.delete(token));
  }

  // Audit
  public async logAudit(log: AuditLog): Promise<void> {
    this.auditLogs.unshift(log);
  }

  // Seeding
  private seedInitialData() {
    this.users.set('usr_admin_1', {
      id: 'usr_admin_1',
      fullName: 'Fahad Hussain',
      email: 'fahadhussain0282@gmail.com',
      passwordHash: 'admin123',
      role: 'admin',
      status: 'active',
      subscription: {
        planId: 'plan_1m',
        planName: '1 Month Plan',
        price: 300,
        durationDays: 30,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        isActive: true,
        isExpired: false,
        deviceId: 'dev_admin_01'
      },
      activeDeviceId: 'dev_admin_01',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 124
    });

    this.users.set('usr_admin_2', {
      id: 'usr_admin_2',
      fullName: 'Adobe Icon Studio',
      email: 'adobeicon99@gmail.com',
      passwordHash: 'admin123',
      role: 'admin',
      status: 'active',
      subscription: {
        planId: 'plan_6m',
        planName: '6 Months Plan',
        price: 2000,
        durationDays: 180,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
        isActive: true,
        isExpired: false,
        deviceId: 'dev_admin_02'
      },
      activeDeviceId: 'dev_admin_02',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 532
    });

    this.auditLogs.push({
      id: 'audit_1',
      timestamp: new Date().toISOString(),
      adminEmail: 'fahadhussain0282@gmail.com',
      action: 'SYSTEM_BOOT',
      targetUser: 'SYSTEM',
      details: 'Enterprise Authentication Architecture initialized.'
    });
  }
}

// Export a singleton instance representing the DB connection
export const userStore = new UserStoreImpl();
