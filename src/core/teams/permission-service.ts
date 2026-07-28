import { Role } from './types';
import { membershipStore } from './store';

const HIERARCHY: Record<Role, number> = {
  'GUEST': 1,
  'VIEWER': 2,
  'CONTRIBUTOR': 3,
  'MANAGER': 4,
  'ADMIN': 5,
  'OWNER': 6
};

export class PermissionService {
  private static hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
    return HIERARCHY[userRole] >= HIERARCHY[requiredRole];
  }

  public static async canManageOrganization(orgId: string, userId: string): Promise<boolean> {
    const mem = await membershipStore.findByOrgAndUser(orgId, userId);
    return mem ? this.hasRequiredRole(mem.role, 'ADMIN') : false;
  }

  public static async canDeleteOrganization(orgId: string, userId: string): Promise<boolean> {
    const mem = await membershipStore.findByOrgAndUser(orgId, userId);
    return mem ? mem.role === 'OWNER' : false;
  }

  public static async canCreateTeam(orgId: string, userId: string): Promise<boolean> {
    return this.canManageOrganization(orgId, userId);
  }

  public static async canManageTeam(orgId: string, teamId: string, userId: string): Promise<boolean> {
    // Org Admin/Owner can manage any team
    if (await this.canManageOrganization(orgId, userId)) return true;
    
    // Or Team Manager/Admin/Owner
    const mem = await membershipStore.findByTeamAndUser(teamId, userId);
    return mem ? this.hasRequiredRole(mem.role, 'MANAGER') : false;
  }

  public static async canDeleteTeam(orgId: string, teamId: string, userId: string): Promise<boolean> {
    return this.canManageOrganization(orgId, userId); // Only Org Admins/Owners can delete teams
  }

  public static async canManageWorkspace(orgId: string, teamId: string, userId: string): Promise<boolean> {
    return this.canManageTeam(orgId, teamId, userId);
  }

  public static async canInviteMember(orgId: string, teamId: string | undefined, userId: string): Promise<boolean> {
    if (teamId) {
      return this.canManageTeam(orgId, teamId, userId);
    }
    return this.canManageOrganization(orgId, userId);
  }
}
