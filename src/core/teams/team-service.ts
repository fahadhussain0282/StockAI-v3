import { Team } from './types';
import { teamStore, organizationStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';
import { validateName } from './validators';
import { QUOTAS } from './constants';
import { PermissionService } from './permission-service';

export class TeamService {
  public static async createTeam(orgId: string, name: string, userId: string): Promise<{ team?: Team, errors?: string[] }> {
    if (!validateName(name)) return { errors: ['Invalid team name'] };

    if (!(await PermissionService.canCreateTeam(orgId, userId))) {
      return { errors: ['Unauthorized to create team in this organization'] };
    }

    const org = await organizationStore.findById(orgId);
    if (!org) return { errors: ['Organization not found'] };

    const orgTeams = await teamStore.findByOrgId(orgId);
    const limit = QUOTAS[org.plan].maxTeams;
    if (orgTeams.length >= limit) {
      return { errors: [`Maximum team limit (${limit}) reached for your ${org.plan} plan`] };
    }

    const team: Team = {
      id: generateId('team'),
      orgId,
      name,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await teamStore.create(team);

    await auditStore.create({
      id: generateId('audit'),
      actor: userId,
      action: 'TEAM_CREATED',
      resource: 'Team',
      resourceId: team.id,
      orgId: org.id,
      teamId: team.id,
      timestamp: new Date().toISOString()
    });

    emitEvent('TeamCreated', { teamId: team.id, orgId: org.id, createdBy: userId });

    return { team };
  }

  public static async getTeams(orgId: string, userId: string): Promise<Team[]> {
    // Basic implementation: an org member can see teams. Should add a check that userId is in org.
    return teamStore.findByOrgId(orgId);
  }

  public static async archiveTeam(orgId: string, teamId: string, userId: string): Promise<{ success: boolean, errors?: string[] }> {
    if (!(await PermissionService.canManageTeam(orgId, teamId, userId))) {
      return { success: false, errors: ['Unauthorized to archive team'] };
    }

    await teamStore.update(teamId, { archived: true });
    
    emitEvent('TeamArchived', { teamId, orgId, archivedBy: userId });

    return { success: true };
  }
}
