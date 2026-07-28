import { Invitation, Role } from './types';
import { invitationStore, organizationStore, auditStore } from './store';
import { generateId, generateInviteToken, emitEvent } from './utils';
import { validateEmail, validateRole } from './validators';
import { TEAMS_CONSTANTS, QUOTAS } from './constants';
import { PermissionService } from './permission-service';

export class InvitationService {
  public static async sendInvite(orgId: string, teamId: string | undefined, email: string, role: Role, inviterId: string): Promise<{ invitation?: Invitation, errors?: string[] }> {
    if (!validateEmail(email)) return { errors: ['Invalid email format'] };
    if (!validateRole(role)) return { errors: ['Invalid role'] };

    if (!(await PermissionService.canInviteMember(orgId, teamId, inviterId))) {
      return { errors: ['Unauthorized to invite members'] };
    }

    const org = await organizationStore.findById(orgId);
    if (!org) return { errors: ['Organization not found'] };

    const activeInvites = (await invitationStore.findByOrgId(orgId)).filter(i => i.status === 'PENDING');
    if (activeInvites.length >= QUOTAS[org.plan].maxPendingInvites) {
      return { errors: [`Maximum pending invitations reached for your ${org.plan} plan`] };
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + TEAMS_CONSTANTS.INVITE_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString();

    const invitation: Invitation = {
      id: generateId('inv'),
      orgId,
      teamId,
      email,
      role,
      token,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date().toISOString(),
      createdBy: inviterId
    };

    await invitationStore.create(invitation);

    await auditStore.create({
      id: generateId('audit'),
      actor: inviterId,
      action: 'INVITE_SENT',
      resource: 'Invitation',
      resourceId: invitation.id,
      orgId,
      teamId,
      timestamp: new Date().toISOString(),
      metadata: { email, role }
    });

    // In a real app, integrate with NotificationService here
    // e.g. NotificationService.sendEmail(email, template, token)
    emitEvent('InviteSent', { invitationId: invitation.id, email, token });

    return { invitation };
  }
}
