import { Invitation } from '../../types';
import { InvitationRepository } from '../invitation-repository';

export class MemoryInvitationStore implements InvitationRepository {
  private invitations: Map<string, Invitation> = new Map();

  async create(invitation: Invitation): Promise<Invitation> {
    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const invs = Array.from(this.invitations.values());
    return invs.find(i => i.token === token) || null;
  }

  async findByOrgId(orgId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter(i => i.orgId === orgId);
  }

  async updateStatus(id: string, status: Invitation['status']): Promise<Invitation | null> {
    const invitation = this.invitations.get(id);
    if (!invitation) return null;
    const updated: Invitation = { ...invitation, status };
    this.invitations.set(id, updated);
    return updated;
  }
}

export const invitationStore = new MemoryInvitationStore();
