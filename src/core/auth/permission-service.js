var RoleService = /** @class */ (function () {
    function RoleService() {
    }
    RoleService.hasRequiredRole = function (userRole, requiredRole) {
        var userLevel = this.ROLE_HIERARCHY[userRole] || 0;
        var requiredLevel = this.ROLE_HIERARCHY[requiredRole] || 0;
        return userLevel >= requiredLevel;
    };
    // Define Role Hierarchies
    RoleService.ROLE_HIERARCHY = {
        'guest': 10,
        'viewer': 20,
        'contributor': 30,
        'team_member': 40,
        'moderator': 50,
        'team_owner': 60,
        'admin': 100
    };
    return RoleService;
}());
export { RoleService };
var PermissionService = /** @class */ (function () {
    function PermissionService() {
    }
    PermissionService.canAccessAdminPanel = function (role) {
        return RoleService.hasRequiredRole(role, 'admin');
    };
    PermissionService.canGenerateMetadata = function (role, status) {
        return status === 'active' && RoleService.hasRequiredRole(role, 'contributor');
    };
    return PermissionService;
}());
export { PermissionService };
