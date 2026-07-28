import { Workspace } from '../types';

export interface WorkspaceRepository {
  create(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findByTeamId(teamId: string): Promise<Workspace[]>;
  update(id: string, data: Partial<Workspace>): Promise<Workspace | null>;
  delete(id: string): Promise<boolean>;
}
