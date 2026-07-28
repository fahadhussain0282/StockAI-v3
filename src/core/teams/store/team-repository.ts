import { Team } from '../types';

export interface TeamRepository {
  create(team: Team): Promise<Team>;
  findById(id: string): Promise<Team | null>;
  findByOrgId(orgId: string): Promise<Team[]>;
  update(id: string, data: Partial<Team>): Promise<Team | null>;
  delete(id: string): Promise<boolean>;
}
