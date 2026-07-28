import { Membership, Role } from '../types';

export interface MembershipRepository {
  create(membership: Membership): Promise<Membership>;
  findByUserId(userId: string): Promise<Membership[]>;
  findByOrgAndUser(orgId: string, userId: string): Promise<Membership | null>;
  findByTeamAndUser(teamId: string, userId: string): Promise<Membership | null>;
  updateRole(id: string, role: Role): Promise<Membership | null>;
  remove(id: string): Promise<boolean>;
}
