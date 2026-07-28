import { AuditEvent } from '../types';

export interface AuditRepository {
  create(event: AuditEvent): Promise<AuditEvent>;
  findByOrgId(orgId: string): Promise<AuditEvent[]>;
  findByTeamId(teamId: string): Promise<AuditEvent[]>;
}
