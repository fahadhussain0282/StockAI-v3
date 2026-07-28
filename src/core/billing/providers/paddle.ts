import { PaymentProvider } from './stripe';

export class PaddleProvider implements PaymentProvider {
  async createCustomer(orgId: string, email: string): Promise<string> {
    console.log(`[Paddle] Creating customer for org ${orgId}`);
    return `cus_paddle_${orgId}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<any> {
    console.log(`[Paddle] Creating subscription ${planId} for ${customerId}`);
    return { id: `sub_paddle_${Date.now()}` };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[Paddle] Canceling subscription ${subscriptionId}`);
    return true;
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    return true;
  }
}
