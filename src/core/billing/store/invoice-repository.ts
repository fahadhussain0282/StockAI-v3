import { Invoice } from '../types';

export interface InvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findByOrgId(orgId: string): Promise<Invoice[]>;
  update(id: string, data: Partial<Invoice>): Promise<Invoice | null>;
}
