import { Invoice } from '../../types';
import { InvoiceRepository } from '../invoice-repository';

export class MemoryInvoiceStore implements InvoiceRepository {
  private invoices: Map<string, Invoice> = new Map();

  async create(invoice: Invoice): Promise<Invoice> {
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async findByOrgId(orgId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(i => i.orgId === orgId);
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    const invoice = await this.findById(id);
    if (!invoice) return null;
    const updated = { ...invoice, ...data };
    this.invoices.set(id, updated);
    return updated;
  }
}

export const invoiceStore = new MemoryInvoiceStore();
