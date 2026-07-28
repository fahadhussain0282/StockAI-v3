import { PaymentProvider } from './stripe';

export class LemonSqueezyProvider implements PaymentProvider {
  async createCustomer(orgId: string, email: string): Promise<string> {
    console.log(`[LemonSqueezy] Creating customer for org ${orgId}`);
    return `cus_ls_${orgId}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<any> {
    console.log(`[LemonSqueezy] Creating subscription ${planId} for ${customerId}`);
    return { id: `sub_ls_${Date.now()}` };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[LemonSqueezy] Canceling subscription ${subscriptionId}`);
    return true;
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    return true;
  }
}
