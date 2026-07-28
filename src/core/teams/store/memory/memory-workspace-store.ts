import { Workspace } from '../../types';
import { WorkspaceRepository } from '../workspace-repository';

export class MemoryWorkspaceStore implements WorkspaceRepository {
  private workspaces: Map<string, Workspace> = new Map();

  async create(workspace: Workspace): Promise<Workspace> {
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.workspaces.get(id) || null;
  }

  async findByTeamId(teamId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values()).filter(w => w.teamId === teamId);
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    const workspace = await this.findById(id);
    if (!workspace) return null;
    const updated = { ...workspace, ...data, updatedAt: new Date().toISOString() };
    this.workspaces.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.workspaces.delete(id);
  }
}

export const workspaceStore = new MemoryWorkspaceStore();
