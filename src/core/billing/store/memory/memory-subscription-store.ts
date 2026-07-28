import { Subscription } from '../../types';
import { SubscriptionRepository } from '../subscription-repository';

export class MemorySubscriptionStore implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  async create(subscription: Subscription): Promise<Subscription> {
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptions.get(id) || null;
  }

  async findByOrgId(orgId: string): Promise<Subscription | null> {
    const subs = Array.from(this.subscriptions.values());
    // Return the most recent/active one
    return subs.find(s => s.orgId === orgId && (s.status === 'ACTIVE' || s.status === 'TRIALING')) || 
           subs.find(s => s.orgId === orgId) || null;
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    const sub = await this.findById(id);
    if (!sub) return null;
    const updated = { ...sub, ...data, updatedAt: new Date().toISOString() };
    this.subscriptions.set(id, updated);
    return updated;
  }
}

export const subscriptionStore = new MemorySubscriptionStore();
