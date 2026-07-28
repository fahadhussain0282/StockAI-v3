import { PaymentMethod } from '../types';

export interface PaymentRepository {
  createMethod(method: PaymentMethod): Promise<PaymentMethod>;
  findMethodsByOrgId(orgId: string): Promise<PaymentMethod[]>;
  updateMethod(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod | null>;
  deleteMethod(id: string): Promise<boolean>;
}
