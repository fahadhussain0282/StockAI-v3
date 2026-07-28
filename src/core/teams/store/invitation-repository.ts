import { Invitation } from '../types';

export interface InvitationRepository {
  create(invitation: Invitation): Promise<Invitation>;
  findByToken(token: string): Promise<Invitation | null>;
  findByOrgId(orgId: string): Promise<Invitation[]>;
  updateStatus(id: string, status: Invitation['status']): Promise<Invitation | null>;
}
