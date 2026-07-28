import { Organization } from '../types';

export interface OrganizationRepository {
  create(org: Organization): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  update(id: string, data: Partial<Organization>): Promise<Organization | null>;
  delete(id: string): Promise<boolean>;
}
