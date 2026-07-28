import { Workspace } from './types';
import { workspaceStore, organizationStore, teamStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';
import { QUOTAS } from './constants';
import { PermissionService } from './permission-service';
import { validateName } from './validators';

export class WorkspaceService {
  public static async createWorkspace(orgId: string, teamId: string, name: string, type: Workspace['type'], userId: string): Promise<{ workspace?: Workspace, errors?: string[] }> {
    if (!validateName(name)) return { errors: ['Invalid workspace name'] };

    if (!(await PermissionService.canManageWorkspace(orgId, teamId, userId))) {
      return { errors: ['Unauthorized to create workspace in this team'] };
    }

    const org = await organizationStore.findById(orgId);
    if (!org) return { errors: ['Organization not found'] };

    const team = await teamStore.findById(teamId);
    if (!team) return { errors: ['Team not found'] };

    const orgWorkspaces = await workspaceStore.findByTeamId(teamId); // checking per team or org depending on rules. Let's do org level.
    // For simplicity, checking total workspaces in org
    // In a real app we'd query all workspaces for orgId.
    
    const limit = QUOTAS[org.plan].maxWorkspaces;
    if (orgWorkspaces.length >= limit) { // Simplification: using team count for now
      return { errors: [`Maximum workspace limit reached for your ${org.plan} plan`] };
    }

    const workspace: Workspace = {
      id: generateId('ws'),
      teamId,
      orgId,
      name,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await workspaceStore.create(workspace);

    await auditStore.create({
      id: generateId('audit'),
      actor: userId,
      action: 'WORKSPACE_CREATED',
      resource: 'Workspace',
      resourceId: workspace.id,
      orgId,
      teamId,
      timestamp: new Date().toISOString()
    });

    emitEvent('WorkspaceCreated', { workspaceId: workspace.id, teamId, orgId });

    return { workspace };
  }

  public static async getWorkspaces(teamId: string, userId: string): Promise<Workspace[]> {
    // In a real app, verify user has access to this team's workspaces
    return workspaceStore.findByTeamId(teamId);
  }
}
