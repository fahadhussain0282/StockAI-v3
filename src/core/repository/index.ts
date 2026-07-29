/**
 * StockAI Enterprise Repository Layer
 *
 * Separates business logic from storage implementation.
 * Current: wraps in-memory stores.
 * Future: swap MemoryUserRepository → PrismaUserRepository etc.
 *
 * All business logic should depend on these interfaces, NOT on store
 * implementations directly. This enables database migration with minimal changes.
 */

import { UserRecord } from '../auth/types';

// ── User Repository ───────────────────────────────────────────────────────────

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: UserRecord): Promise<UserRecord>;
  update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null>;
  delete(id: string): Promise<boolean>;
  listAll(): Promise<UserRecord[]>;
  count(): Promise<number>;
  incrementGeneration(id: string): Promise<void>;
  incrementPrompt(id: string): Promise<void>;
  incrementCsvExport(id: string): Promise<void>;
}

// ── Plan Repository ───────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  isCustom: boolean;
  features: string[];
  createdAt: string;
}

export interface IPlanRepository {
  findById(id: string): Promise<Plan | null>;
  listAll(): Promise<Plan[]>;
  create(plan: Omit<Plan, 'id' | 'createdAt'>): Promise<Plan>;
  delete(id: string): Promise<boolean>;
}

// ── Audit Repository ──────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  action: string;
  targetUser?: string;
  performedBy: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface IAuditRepository {
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
  listRecent(limit?: number): Promise<AuditLogEntry[]>;
  listByUser(userId: string, limit?: number): Promise<AuditLogEntry[]>;
}

// ── Memory implementations (wrapping existing stores) ─────────────────────────

export class MemoryUserRepository implements IUserRepository {
  private store: any;

  constructor(userStore: any) {
    this.store = userStore;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.store.findUserById?.(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.store.findUserByEmail?.(email) ?? null;
  }

  async create(user: UserRecord): Promise<UserRecord> {
    await this.store.createUser(user);
    return user;
  }

  async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    return this.store.updateUser?.(id, updates) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.deleteUser?.(id) ?? false;
  }

  async listAll(): Promise<UserRecord[]> {
    return this.store.getAllUsers?.() ?? [];
  }

  async count(): Promise<number> {
    const users = await this.listAll();
    return users.length;
  }

  async incrementGeneration(id: string): Promise<void> {
    await this.store.incrementGeneration?.(id);
  }

  async incrementPrompt(id: string): Promise<void> {
    await this.store.incrementPrompt?.(id);
  }

  async incrementCsvExport(id: string): Promise<void> {
    await this.store.incrementCsvExport?.(id);
  }
}

// ── In-memory Audit Log ───────────────────────────────────────────────────────

class MemoryAuditRepository implements IAuditRepository {
  private logs: AuditLogEntry[] = [];
  private readonly MAX_ENTRIES = 500;

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    this.logs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
    if (this.logs.length > this.MAX_ENTRIES) {
      this.logs = this.logs.slice(0, this.MAX_ENTRIES);
    }
  }

  async listRecent(limit = 50): Promise<AuditLogEntry[]> {
    return this.logs.slice(0, limit);
  }

  async listByUser(userId: string, limit = 20): Promise<AuditLogEntry[]> {
    return this.logs.filter(l => l.targetUser === userId || l.performedBy === userId).slice(0, limit);
  }
}

export const AuditRepository = new MemoryAuditRepository();
