import { Subscription } from '../types';

export interface SubscriptionRepository {
  create(subscription: Subscription): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  findByOrgId(orgId: string): Promise<Subscription | null>; // Assuming 1 active sub per org
  update(id: string, data: Partial<Subscription>): Promise<Subscription | null>;
}
