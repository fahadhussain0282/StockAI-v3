/**
 * StockAI v3.0 Enterprise — Persistent User Store
 *
 * Architecture:
 *  - PRIMARY: PostgreSQL via Prisma (survives restarts, cold starts, scaling)
 *  - FALLBACK: In-memory Map<> (when DATABASE_URL is not configured)
 *
 * The public interface is identical to the original UserStoreImpl,
 * so NO other files need to be changed when switching between storage backends.
 *
 * When DATABASE_URL is set: all data persists permanently.
 * When DATABASE_URL is not set: falls back to in-memory (data lost on restart).
 */

import { UserRecord, SessionRecord, AuditLog } from './types';
import { getDb, isDbAvailable } from '../db/client';

// ─── In-Memory Fallback Store ──────────────────────────────────────────────────

class InMemoryFallback {
  private users: Map<string, UserRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private auditLogs: AuditLog[] = [];
  private resetTokens: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor() { this.seedAdmins(); }

  private seedAdmins() {
    const adminSubscription = (planName: string, durationDays: number) => ({
      planId: durationDays >= 180 ? 'plan_6m' : 'plan_1m',
      planName,
      price: durationDays >= 180 ? 2000 : 300,
      durationDays,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
      isActive: true,
      isExpired: false,
      deviceId: 'dev_admin'
    });

    this.users.set('usr_admin_1', {
      id: 'usr_admin_1', fullName: 'Fahad Hussain',
      email: 'fahadhussain0282@gmail.com', passwordHash: 'legacy:admin_seed_1',
      provider: 'local', role: 'admin', status: 'active',
      subscription: adminSubscription('1 Month Plan', 30),
      activeDeviceId: 'dev_admin_01',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 124, totalPrompts: 38, totalCsvExports: 21
    });

    this.users.set('usr_admin_2', {
      id: 'usr_admin_2', fullName: 'Adobe Icon Studio',
      email: 'adobeicon99@gmail.com', passwordHash: 'legacy:admin_seed_2',
      provider: 'local', role: 'admin', status: 'active',
      subscription: adminSubscription('6 Months Plan', 180),
      activeDeviceId: 'dev_admin_02',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 532, totalPrompts: 147, totalCsvExports: 89
    });
  }

  async findUserById(id: string) { return this.users.get(id) || null; }
  async findUserByEmail(email: string) {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }
  async getAllUsers() { return Array.from(this.users.values()); }
  async createUser(user: UserRecord) {
    if (await this.findUserByEmail(user.email)) throw new Error('User with this email already exists.');
    this.users.set(user.id, user);
  }
  async updateUser(id: string, updates: Partial<UserRecord>) {
    const u = this.users.get(id);
    if (u) this.users.set(id, { ...u, ...updates });
  }
  async deleteUser(id: string) { this.users.delete(id); }
  async incrementGeneration(userId: string) {
    const u = this.users.get(userId);
    if (u) this.users.set(userId, { ...u, totalGenerations: (u.totalGenerations || 0) + 1 });
  }
  async incrementPrompt(userId: string) {
    const u = this.users.get(userId);
    if (u) this.users.set(userId, { ...u, totalPrompts: (u.totalPrompts || 0) + 1 });
  }
  async incrementCsvExport(userId: string) {
    const u = this.users.get(userId);
    if (u) this.users.set(userId, { ...u, totalCsvExports: (u.totalCsvExports || 0) + 1 });
  }
  async findSessionByToken(token: string) { return this.sessions.get(token) || null; }
  async findSessionsByUserId(userId: string) {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }
  async createSession(session: SessionRecord) { this.sessions.set(session.token, session); }
  async deleteSession(token: string) { this.sessions.delete(token); }
  async deleteSessionsByUserId(userId: string) {
    for (const [tok, s] of this.sessions.entries()) {
      if (s.userId === userId) this.sessions.delete(tok);
    }
  }
  async getActiveSessionsCount() { return this.sessions.size; }
  async createResetToken(userId: string, token: string) {
    this.resetTokens.set(token, { userId, expiresAt: Date.now() + 60 * 60 * 1000 });
  }
  async validateResetToken(token: string) {
    const entry = this.resetTokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) { this.resetTokens.delete(token); return null; }
    return entry.userId;
  }
  async deleteResetToken(token: string) { this.resetTokens.delete(token); }
  async logAudit(log: AuditLog) { this.auditLogs.unshift(log); if (this.auditLogs.length > 500) this.auditLogs.length = 500; }
  async getAllAuditLogs() { return [...this.auditLogs]; }
}

// ─── Helper: Convert Prisma User Row → UserRecord ────────────────────────────

function prismaUserToRecord(row: any): UserRecord {
  const sub = row.subscription;
  const now = new Date().toISOString();
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    passwordHash: row.passwordHash ?? undefined,
    googleId: row.googleId ?? undefined,
    avatar: row.avatar ?? undefined,
    provider: (row.provider || 'local') as 'local' | 'google',
    role: row.role as any,
    status: row.status as any,
    subscription: sub ? {
      planId: sub.planId,
      planName: sub.planName,
      price: sub.price,
      durationDays: sub.durationDays,
      activatedAt: sub.activatedAt?.toISOString() ?? now,
      expiresAt: sub.expiresAt?.toISOString() ?? now,
      isActive: sub.isActive,
      isExpired: sub.isExpired,
      deviceId: sub.deviceId ?? ''
    } : {
      // No subscription record — grant a 7-day free trial automatically
      planId: 'plan_trial', planName: '7-Day Free Trial', price: 0, durationDays: 7,
      activatedAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      isActive: true, isExpired: false, deviceId: ''
    },
    activeDeviceId: row.activeDeviceId ?? '',
    createdAt: row.createdAt?.toISOString() ?? now,
    updatedAt: row.updatedAt?.toISOString() ?? now,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? now,
    totalGenerations: row.totalGenerations ?? 0,
    totalPrompts: row.totalPrompts ?? 0,
    totalCsvExports: row.totalCsvExports ?? 0,
  };
}

function prismaSessionToRecord(row: any): SessionRecord {
  return {
    userId: row.userId,
    deviceId: row.deviceId,
    token: row.token,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? new Date().toISOString(),
  };
}

// ─── Prisma-backed UserStore ───────────────────────────────────────────────────

class UserStoreImpl {
  private fallback = new InMemoryFallback();

  private get db() { return getDb(); }
  private get useDb() { return isDbAvailable(); }

  // ── Users ──────────────────────────────────────────────────────────────────

  public async findUserById(id: string): Promise<UserRecord | null> {
    if (!this.useDb) return this.fallback.findUserById(id);
    try {
      const row = await this.db!.user.findUnique({
        where: { id },
        include: { subscription: true }
      });
      return row ? prismaUserToRecord(row) : null;
    } catch (e: any) {
      // If DB connection was terminated (stale Vercel pool), try to re-init and retry once
      const isConnErr = e?.message?.includes('Connection terminated') || e?.message?.includes('connection') || e?.code === 'ECONNRESET';
      if (isConnErr) {
        console.warn('[UserStore] findUserById: DB connection lost — reinitializing...');
        try {
          const { resetDb } = await import('../db/client');
          await resetDb();
          const row = await this.db!.user.findUnique({
            where: { id },
            include: { subscription: true }
          });
          return row ? prismaUserToRecord(row) : null;
        } catch (retryErr: any) {
          console.error('[UserStore] findUserById retry failed:', retryErr?.message);
          // Fall back to in-memory if DB still unavailable
          return this.fallback.findUserById(id);
        }
      }
      console.error('[UserStore] findUserById error:', e); return null;
    }
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (!this.useDb) return this.fallback.findUserByEmail(email);
    try {
      const row = await this.db!.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { subscription: true }
      });
      return row ? prismaUserToRecord(row) : null;
    } catch (e) {
      console.error('[UserStore] findUserByEmail error:', e); return null;
    }
  }

  public async getAllUsers(): Promise<UserRecord[]> {
    if (!this.useDb) return this.fallback.getAllUsers();
    try {
      const rows = await this.db!.user.findMany({
        include: { subscription: true },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map(prismaUserToRecord);
    } catch (e) {
      console.error('[UserStore] getAllUsers error:', e); return [];
    }
  }

  public async createUser(user: UserRecord): Promise<void> {
    if (!this.useDb) return this.fallback.createUser(user);
    try {
      const { subscription, ...rest } = user;
      await this.db!.user.create({
        data: {
          id: rest.id,
          fullName: rest.fullName,
          email: rest.email.toLowerCase(),
          passwordHash: rest.passwordHash ?? null,
          googleId: rest.googleId ?? null,
          avatar: rest.avatar ?? null,
          provider: rest.provider,
          role: rest.role,
          status: rest.status,
          activeDeviceId: rest.activeDeviceId ?? null,
          lastLoginAt: rest.lastLoginAt ? new Date(rest.lastLoginAt) : null,
          totalGenerations: rest.totalGenerations ?? 0,
          totalPrompts: rest.totalPrompts ?? 0,
          totalCsvExports: rest.totalCsvExports ?? 0,
          subscription: {
            create: {
              planId: subscription.planId,
              planName: subscription.planName,
              price: subscription.price,
              durationDays: subscription.durationDays,
              activatedAt: new Date(subscription.activatedAt),
              expiresAt: new Date(subscription.expiresAt),
              isActive: subscription.isActive,
              isExpired: subscription.isExpired,
              deviceId: subscription.deviceId ?? null,
            }
          }
        }
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new Error('User with this email already exists.');
      throw e;
    }
  }

  public async updateUser(id: string, updates: Partial<UserRecord>): Promise<void> {
    if (!this.useDb) return this.fallback.updateUser(id, updates);
    try {
      const { subscription, ...rest } = updates as any;
      const data: any = {};
      if (rest.fullName !== undefined) data.fullName = rest.fullName;
      if (rest.passwordHash !== undefined) data.passwordHash = rest.passwordHash;
      if (rest.role !== undefined) data.role = rest.role;
      if (rest.status !== undefined) data.status = rest.status;
      if (rest.activeDeviceId !== undefined) data.activeDeviceId = rest.activeDeviceId;
      if (rest.lastLoginAt !== undefined) data.lastLoginAt = rest.lastLoginAt ? new Date(rest.lastLoginAt) : null;
      if (rest.avatar !== undefined) data.avatar = rest.avatar;
      if (rest.totalGenerations !== undefined) data.totalGenerations = rest.totalGenerations;
      if (rest.totalPrompts !== undefined) data.totalPrompts = rest.totalPrompts;
      if (rest.totalCsvExports !== undefined) data.totalCsvExports = rest.totalCsvExports;

      if (Object.keys(data).length > 0) {
        await this.db!.user.update({ where: { id }, data });
      }

      if (subscription) {
        await this.db!.subscription.upsert({
          where: { userId: id },
          update: {
            planId: subscription.planId,
            planName: subscription.planName,
            price: subscription.price,
            durationDays: subscription.durationDays,
            activatedAt: new Date(subscription.activatedAt),
            expiresAt: new Date(subscription.expiresAt),
            isActive: subscription.isActive,
            isExpired: subscription.isExpired,
            deviceId: subscription.deviceId ?? null,
          },
          create: {
            userId: id,
            planId: subscription.planId,
            planName: subscription.planName,
            price: subscription.price,
            durationDays: subscription.durationDays,
            activatedAt: new Date(subscription.activatedAt),
            expiresAt: new Date(subscription.expiresAt),
            isActive: subscription.isActive,
            isExpired: subscription.isExpired,
            deviceId: subscription.deviceId ?? null,
          }
        });
      }
    } catch (e) {
      console.error('[UserStore] updateUser error:', e);
    }
  }

  public async deleteUser(id: string): Promise<void> {
    if (!this.useDb) return this.fallback.deleteUser(id);
    try {
      await this.db!.user.delete({ where: { id } });
    } catch (e) { console.error('[UserStore] deleteUser error:', e); }
  }

  // ── Usage Counters ─────────────────────────────────────────────────────────

  public async incrementGeneration(userId: string): Promise<void> {
    if (!this.useDb) return this.fallback.incrementGeneration(userId);
    try {
      await this.db!.user.update({ where: { id: userId }, data: { totalGenerations: { increment: 1 } } });
    } catch (e) { console.error('[UserStore] incrementGeneration error:', e); }
  }

  public async incrementPrompt(userId: string): Promise<void> {
    if (!this.useDb) return this.fallback.incrementPrompt(userId);
    try {
      await this.db!.user.update({ where: { id: userId }, data: { totalPrompts: { increment: 1 } } });
    } catch (e) { console.error('[UserStore] incrementPrompt error:', e); }
  }

  public async incrementCsvExport(userId: string): Promise<void> {
    if (!this.useDb) return this.fallback.incrementCsvExport(userId);
    try {
      await this.db!.user.update({ where: { id: userId }, data: { totalCsvExports: { increment: 1 } } });
    } catch (e) { console.error('[UserStore] incrementCsvExport error:', e); }
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  public async findSessionByToken(token: string): Promise<SessionRecord | null> {
    if (!this.useDb) return this.fallback.findSessionByToken(token);
    try {
      const row = await this.db!.session.findUnique({ where: { token } });
      if (!row) return null;
      if (row.isRevoked) return null;
      if (new Date(row.expiresAt).getTime() < Date.now()) {
        await this.db!.session.delete({ where: { token } }).catch(() => {});
        return null;
      }
      return prismaSessionToRecord(row);
    } catch (e) { console.error('[UserStore] findSessionByToken error:', e); return null; }
  }

  public async findSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    if (!this.useDb) return this.fallback.findSessionsByUserId(userId);
    try {
      const rows = await this.db!.session.findMany({ where: { userId, isRevoked: false } });
      return rows.map(prismaSessionToRecord);
    } catch (e) { console.error('[UserStore] findSessionsByUserId error:', e); return []; }
  }

  public async createSession(session: SessionRecord): Promise<void> {
    if (!this.useDb) return this.fallback.createSession(session);
    try {
      await this.db!.session.create({
        data: {
          userId: session.userId,
          deviceId: session.deviceId,
          token: session.token,
          createdAt: new Date(session.createdAt),
          expiresAt: new Date(session.expiresAt),
        }
      });
    } catch (e) { console.error('[UserStore] createSession error:', e); }
  }

  public async deleteSession(token: string): Promise<void> {
    if (!this.useDb) return this.fallback.deleteSession(token);
    try {
      await this.db!.session.updateMany({
        where: { token },
        data: { isRevoked: true }
      });
    } catch (e) { console.error('[UserStore] deleteSession error:', e); }
  }

  public async deleteSessionsByUserId(userId: string): Promise<void> {
    if (!this.useDb) return this.fallback.deleteSessionsByUserId(userId);
    try {
      await this.db!.session.updateMany({
        where: { userId },
        data: { isRevoked: true }
      });
    } catch (e) { console.error('[UserStore] deleteSessionsByUserId error:', e); }
  }

  public async getActiveSessionsCount(): Promise<number> {
    if (!this.useDb) return this.fallback.getActiveSessionsCount();
    try {
      return await this.db!.session.count({
        where: { isRevoked: false, expiresAt: { gt: new Date() } }
      });
    } catch (e) { console.error('[UserStore] getActiveSessionsCount error:', e); return 0; }
  }

  // ── Password Reset Tokens ──────────────────────────────────────────────────

  public async createResetToken(userId: string, token: string): Promise<void> {
    if (!this.useDb) return this.fallback.createResetToken(userId, token);
    try {
      await this.db!.passwordResetToken.create({
        data: { userId, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
      });
    } catch (e) { console.error('[UserStore] createResetToken error:', e); }
  }

  public async validateResetToken(token: string): Promise<string | null> {
    if (!this.useDb) return this.fallback.validateResetToken(token);
    try {
      const row = await this.db!.passwordResetToken.findUnique({ where: { token } });
      if (!row || row.used) return null;
      if (new Date(row.expiresAt).getTime() < Date.now()) {
        await this.db!.passwordResetToken.delete({ where: { token } }).catch(() => {});
        return null;
      }
      return row.userId;
    } catch (e) { console.error('[UserStore] validateResetToken error:', e); return null; }
  }

  public async deleteResetToken(token: string): Promise<void> {
    if (!this.useDb) return this.fallback.deleteResetToken(token);
    try {
      await this.db!.passwordResetToken.update({ where: { token }, data: { used: true } });
    } catch (e) { console.error('[UserStore] deleteResetToken error:', e); }
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  public async logAudit(log: AuditLog): Promise<void> {
    if (!this.useDb) return this.fallback.logAudit(log);
    try {
      await this.db!.auditLog.create({
        data: {
          adminEmail: log.adminEmail,
          action: log.action,
          targetUser: log.targetUser,
          details: log.details,
        }
      });
    } catch (e) { console.error('[UserStore] logAudit error:', e); }
  }

  public async getAllAuditLogs(): Promise<AuditLog[]> {
    if (!this.useDb) return this.fallback.getAllAuditLogs();
    try {
      const rows = await this.db!.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500
      });
      return rows.map(r => ({
        id: r.id,
        timestamp: r.createdAt.toISOString(),
        adminEmail: r.adminEmail,
        action: r.action,
        targetUser: r.targetUser,
        details: r.details,
      }));
    } catch (e) { console.error('[UserStore] getAllAuditLogs error:', e); return []; }
  }

  // ── Admin Dashboard Stats ──────────────────────────────────────────────────

  public async getDashboardStats(): Promise<{
    total: number;
    active: number;
    paid: number;
    free: number;
    expired: number;
    suspended: number;
    todaySignups: number;
    totalGenerations: number;
    totalPrompts: number;
  }> {
    if (!this.useDb) {
      const users = await this.fallback.getAllUsers();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        paid: users.filter(u => u.subscription?.isActive).length,
        free: users.filter(u => !u.subscription?.isActive).length,
        expired: users.filter(u => u.status === 'expired' || u.subscription?.isExpired).length,
        suspended: users.filter(u => u.status === 'suspended').length,
        todaySignups: users.filter(u => new Date(u.createdAt) >= todayStart).length,
        totalGenerations: users.reduce((s, u) => s + (u.totalGenerations || 0), 0),
        totalPrompts: users.reduce((s, u) => s + (u.totalPrompts || 0), 0),
      };
    }
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const [
        total, active, paid, suspended, todaySignups,
        genSum, promptSum
      ] = await Promise.all([
        this.db!.user.count(),
        this.db!.user.count({ where: { status: 'active' } }),
        this.db!.subscription.count({ where: { isActive: true } }),
        this.db!.user.count({ where: { status: 'suspended' } }),
        this.db!.user.count({ where: { createdAt: { gte: todayStart } } }),
        this.db!.user.aggregate({ _sum: { totalGenerations: true } }),
        this.db!.user.aggregate({ _sum: { totalPrompts: true } }),
      ]);
      const expired = await this.db!.subscription.count({ where: { isExpired: true, isActive: false } });
      return {
        total, active, paid, free: total - paid, expired, suspended,
        todaySignups,
        totalGenerations: genSum._sum.totalGenerations ?? 0,
        totalPrompts: promptSum._sum.totalPrompts ?? 0,
      };
    } catch (e) {
      console.error('[UserStore] getDashboardStats error:', e);
      return { total: 0, active: 0, paid: 0, free: 0, expired: 0, suspended: 0, todaySignups: 0, totalGenerations: 0, totalPrompts: 0 };
    }
  }

  public async searchUsers(opts: {
    query?: string;
    status?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'totalGenerations';
    sortDir?: 'asc' | 'desc';
  }): Promise<{ users: UserRecord[]; total: number; pages: number }> {
    const { query = '', status, role, isActive, page = 1, limit = 20,
      sortBy = 'createdAt', sortDir = 'desc' } = opts;

    if (!this.useDb) {
      let users = await this.fallback.getAllUsers();
      if (query) {
        const q = query.toLowerCase();
        users = users.filter(u => u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));
      }
      if (status) users = users.filter(u => u.status === status);
      if (role) users = users.filter(u => u.role === role);
      if (isActive !== undefined) users = users.filter(u => u.subscription?.isActive === isActive);
      const total = users.length;
      const pages = Math.ceil(total / limit);
      const paged = users.slice((page - 1) * limit, page * limit);
      return { users: paged, total, pages };
    }

    try {
      const where: any = {};
      if (query) {
        where.OR = [
          { email: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } }
        ];
      }
      if (status) where.status = status;
      if (role) where.role = role;
      if (isActive !== undefined) where.subscription = { isActive };

      const [rows, total] = await Promise.all([
        this.db!.user.findMany({
          where,
          include: { subscription: true },
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db!.user.count({ where })
      ]);

      return {
        users: rows.map(prismaUserToRecord),
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (e) {
      console.error('[UserStore] searchUsers error:', e);
      return { users: [], total: 0, pages: 0 };
    }
  }
}

// Export a singleton instance representing the DB connection
export const userStore = new UserStoreImpl();
