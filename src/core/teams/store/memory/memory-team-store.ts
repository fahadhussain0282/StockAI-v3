import { Team } from '../../types';
import { TeamRepository } from '../team-repository';

export class MemoryTeamStore implements TeamRepository {
  private teams: Map<string, Team> = new Map();

  async create(team: Team): Promise<Team> {
    this.teams.set(team.id, team);
    return team;
  }

  async findById(id: string): Promise<Team | null> {
    return this.teams.get(id) || null;
  }

  async findByOrgId(orgId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.orgId === orgId);
  }

  async update(id: string, data: Partial<Team>): Promise<Team | null> {
    const team = await this.findById(id);
    if (!team) return null;
    const updated = { ...team, ...data, updatedAt: new Date().toISOString() };
    this.teams.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }
}

export const teamStore = new MemoryTeamStore();
