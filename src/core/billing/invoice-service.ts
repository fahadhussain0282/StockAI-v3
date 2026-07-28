import { Invoice } from './types';
import { invoiceStore } from './store';
import { generateId, emitBillingEvent } from './utils';

export class InvoiceService {
  public static async createInvoice(orgId: string, amount: number, currency: string, subscriptionId?: string): Promise<Invoice> {
    const invoice: Invoice = {
      id: generateId('inv'),
      orgId,
      subscriptionId,
      amount,
      currency,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    await invoiceStore.create(invoice);
    return invoice;
  }

  public static async markInvoicePaid(invoiceId: string): Promise<void> {
    const invoice = await invoiceStore.findById(invoiceId);
    if (!invoice) return;

    await invoiceStore.update(invoiceId, { 
      status: 'PAID', 
      paidAt: new Date().toISOString() 
    });

    emitBillingEvent('InvoicePaid', { invoiceId, orgId: invoice.orgId, amount: invoice.amount });
  }

  public static async getInvoices(orgId: string): Promise<Invoice[]> {
    return invoiceStore.findByOrgId(orgId);
  }
}
