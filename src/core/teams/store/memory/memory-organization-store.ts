import { Organization } from '../../types';
import { OrganizationRepository } from '../organization-repository';

export class MemoryOrganizationStore implements OrganizationRepository {
  private organizations: Map<string, Organization> = new Map();

  async create(org: Organization): Promise<Organization> {
    this.organizations.set(org.id, org);
    return org;
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    const org = await this.findById(id);
    if (!org) return null;
    const updated = { ...org, ...data, updatedAt: new Date().toISOString() };
    this.organizations.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.organizations.delete(id);
  }
}

export const organizationStore = new MemoryOrganizationStore();
