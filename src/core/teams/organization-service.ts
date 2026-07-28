import { Organization } from './types';
import { organizationStore, membershipStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';
import { validateName } from './validators';
import { QUOTAS } from './constants';
import { PermissionService } from './permission-service';

export class OrganizationService {
  public static async createOrganization(name: string, ownerId: string, plan: Organization['plan'] = 'FREE'): Promise<{ org?: Organization, errors?: string[] }> {
    if (!validateName(name)) return { errors: ['Invalid organization name'] };

    // Check user org limits (mock check, assumes 1 user = 1 primary org for now, normally would count memberships where role=OWNER)
    const mems = await membershipStore.findByUserId(ownerId);
    const ownerOrgs = mems.filter(m => m.role === 'OWNER');
    // Assuming FREE tier maxOrgs for user checking
    if (ownerOrgs.length >= QUOTAS.FREE.maxOrganizations) {
      return { errors: ['Maximum organization limit reached for your plan'] };
    }

    const org: Organization = {
      id: generateId('org'),
      name,
      ownerId,
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await organizationStore.create(org);
    
    // Automatically create OWNER membership
    await membershipStore.create({
      id: generateId('mem'),
      orgId: org.id,
      userId: ownerId,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString()
    });

    await auditStore.create({
      id: generateId('audit'),
      actor: ownerId,
      action: 'ORGANIZATION_CREATED',
      resource: 'Organization',
      resourceId: org.id,
      orgId: org.id,
      timestamp: new Date().toISOString()
    });

    emitEvent('OrganizationCreated', { orgId: org.id, ownerId });

    return { org };
  }

  public static async getOrganization(id: string): Promise<Organization | null> {
    return organizationStore.findById(id);
  }

  public static async deleteOrganization(id: string, userId: string): Promise<{ success: boolean, errors?: string[] }> {
    if (!(await PermissionService.canDeleteOrganization(id, userId))) {
      return { success: false, errors: ['Unauthorized to delete organization'] };
    }

    await organizationStore.delete(id);
    
    emitEvent('OrganizationDeleted', { orgId: id, deletedBy: userId });

    return { success: true };
  }
}
