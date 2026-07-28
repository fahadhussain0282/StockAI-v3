import { Membership } from './types';
import { membershipStore, invitationStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';

export class MembershipService {
  public static async acceptInvite(token: string, userId: string): Promise<{ membership?: Membership, errors?: string[] }> {
    const invite = await invitationStore.findByToken(token);
    
    if (!invite) return { errors: ['Invalid or expired invitation token'] };
    if (invite.status !== 'PENDING') return { errors: ['Invitation is no longer valid'] };
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      await invitationStore.updateStatus(invite.id, 'EXPIRED');
      return { errors: ['Invitation has expired'] };
    }

    // Check if user is already a member
    if (invite.teamId) {
      const existing = await membershipStore.findByTeamAndUser(invite.teamId, userId);
      if (existing) return { errors: ['Already a member of this team'] };
    } else {
      const existing = await membershipStore.findByOrgAndUser(invite.orgId, userId);
      if (existing) return { errors: ['Already a member of this organization'] };
    }

    const membership: Membership = {
      id: generateId('mem'),
      orgId: invite.orgId,
      teamId: invite.teamId,
      userId,
      role: invite.role,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString()
    };

    await membershipStore.create(membership);
    await invitationStore.updateStatus(invite.id, 'ACCEPTED');

    await auditStore.create({
      id: generateId('audit'),
      actor: userId,
      action: 'INVITE_ACCEPTED',
      resource: 'Membership',
      resourceId: membership.id,
      orgId: invite.orgId,
      teamId: invite.teamId,
      timestamp: new Date().toISOString()
    });

    emitEvent('InviteAccepted', { invitationId: invite.id, membershipId: membership.id, userId });

    return { membership };
  }

  public static async removeMember(membershipId: string, actorId: string): Promise<{ success: boolean, errors?: string[] }> {
    // Basic implementation: would require PermissionService to check if actorId can remove this user
    await membershipStore.remove(membershipId);
    
    emitEvent('MemberRemoved', { membershipId, removedBy: actorId });

    return { success: true };
  }
}
