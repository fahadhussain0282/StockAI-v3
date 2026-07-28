import { PaymentProvider } from './stripe';

export class PayPalProvider implements PaymentProvider {
  async createCustomer(orgId: string, email: string): Promise<string> {
    console.log(`[PayPal] Creating customer for org ${orgId}`);
    return `cus_paypal_${orgId}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<any> {
    console.log(`[PayPal] Creating subscription ${planId} for ${customerId}`);
    return { id: `sub_paypal_${Date.now()}` };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[PayPal] Canceling subscription ${subscriptionId}`);
    return true;
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    return true;
  }
}
