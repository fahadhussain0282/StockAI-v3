import { AuditEvent } from '../../types';
import { AuditRepository } from '../audit-repository';

export class MemoryAuditStore implements AuditRepository {
  private events: AuditEvent[] = [];

  async create(event: AuditEvent): Promise<AuditEvent> {
    this.events.unshift(event); // most recent first
    return event;
  }

  async findByOrgId(orgId: string): Promise<AuditEvent[]> {
    return this.events.filter(e => e.orgId === orgId);
  }

  async findByTeamId(teamId: string): Promise<AuditEvent[]> {
    return this.events.filter(e => e.teamId === teamId);
  }
}

export const auditStore = new MemoryAuditStore();
