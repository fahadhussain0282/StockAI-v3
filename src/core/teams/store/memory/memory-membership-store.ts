import { Membership, Role } from '../../types';
import { MembershipRepository } from '../membership-repository';

export class MemoryMembershipStore implements MembershipRepository {
  private memberships: Map<string, Membership> = new Map();

  async create(membership: Membership): Promise<Membership> {
    this.memberships.set(membership.id, membership);
    return membership;
  }

  async findByUserId(userId: string): Promise<Membership[]> {
    return Array.from(this.memberships.values()).filter(m => m.userId === userId);
  }

  async findByOrgAndUser(orgId: string, userId: string): Promise<Membership | null> {
    const mems = Array.from(this.memberships.values());
    return mems.find(m => m.orgId === orgId && m.userId === userId && !m.teamId) || null;
  }

  async findByTeamAndUser(teamId: string, userId: string): Promise<Membership | null> {
    const mems = Array.from(this.memberships.values());
    return mems.find(m => m.teamId === teamId && m.userId === userId) || null;
  }

  async updateRole(id: string, role: Role): Promise<Membership | null> {
    const membership = this.memberships.get(id);
    if (!membership) return null;
    const updated = { ...membership, role };
    this.memberships.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.memberships.delete(id);
  }
}

export const membershipStore = new MemoryMembershipStore();
