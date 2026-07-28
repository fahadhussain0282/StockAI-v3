import { PaymentMethod } from '../../types';
import { PaymentRepository } from '../payment-repository';

export class MemoryPaymentStore implements PaymentRepository {
  private methods: Map<string, PaymentMethod> = new Map();

  async createMethod(method: PaymentMethod): Promise<PaymentMethod> {
    if (method.isDefault) {
      // Unset other defaults
      for (const m of this.methods.values()) {
        if (m.orgId === method.orgId) m.isDefault = false;
      }
    }
    this.methods.set(method.id, method);
    return method;
  }

  async findMethodsByOrgId(orgId: string): Promise<PaymentMethod[]> {
    return Array.from(this.methods.values()).filter(m => m.orgId === orgId);
  }

  async updateMethod(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    const method = this.methods.get(id);
    if (!method) return null;
    
    if (data.isDefault) {
      for (const m of this.methods.values()) {
        if (m.orgId === method.orgId && m.id !== id) m.isDefault = false;
      }
    }
    
    const updated = { ...method, ...data };
    this.methods.set(id, updated);
    return updated;
  }

  async deleteMethod(id: string): Promise<boolean> {
    return this.methods.delete(id);
  }
}

export const paymentStore = new MemoryPaymentStore();
