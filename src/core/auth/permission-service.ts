import { Role } from './types';

export class RoleService {
  // Define Role Hierarchies
  private static readonly ROLE_HIERARCHY: Record<Role, number> = {
    'guest': 10,
    'viewer': 20,
    'contributor': 30,
    'team_member': 40,
    'moderator': 50,
    'team_owner': 60,
    'admin': 100
  };

  public static hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
    const userLevel = this.ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = this.ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }
}

export class PermissionService {
  public static canAccessAdminPanel(role: Role): boolean {
    return RoleService.hasRequiredRole(role, 'admin');
  }

  public static canGenerateMetadata(role: Role, status: string): boolean {
    return status === 'active' && RoleService.hasRequiredRole(role, 'contributor');
  }
}
