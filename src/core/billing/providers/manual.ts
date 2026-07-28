import { PaymentProvider } from './stripe';

export class ManualProvider implements PaymentProvider {
  async createCustomer(orgId: string, email: string): Promise<string> {
    console.log(`[Manual] Creating customer for org ${orgId}`);
    return `cus_manual_${orgId}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<any> {
    console.log(`[Manual] Creating subscription ${planId} for ${customerId}`);
    return { id: `sub_manual_${Date.now()}` };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[Manual] Canceling subscription ${subscriptionId}`);
    return true;
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    return true;
  }
}
