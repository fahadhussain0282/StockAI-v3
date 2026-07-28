import { PaymentMethod } from './types';
import { paymentStore } from './store';
import { generateId } from './utils';

export class PaymentService {
  public static async addPaymentMethod(orgId: string, provider: string, providerPaymentMethodId: string, type: PaymentMethod['type'], last4: string, isDefault: boolean): Promise<PaymentMethod> {
    const method: PaymentMethod = {
      id: generateId('pm'),
      orgId,
      provider,
      providerPaymentMethodId,
      type,
      last4,
      isDefault
    };

    return paymentStore.createMethod(method);
  }

  public static async getPaymentMethods(orgId: string): Promise<PaymentMethod[]> {
    return paymentStore.findMethodsByOrgId(orgId);
  }

  public static async setDefaultMethod(orgId: string, methodId: string): Promise<{ success: boolean, errors?: string[] }> {
    const method = await paymentStore.updateMethod(methodId, { isDefault: true });
    if (!method) return { success: false, errors: ['Payment method not found'] };
    return { success: true };
  }

  public static async removePaymentMethod(orgId: string, methodId: string): Promise<void> {
    await paymentStore.deleteMethod(methodId);
  }
}
