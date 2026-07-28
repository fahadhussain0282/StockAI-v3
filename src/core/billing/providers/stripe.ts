export interface PaymentProvider {
  createCustomer(orgId: string, email: string): Promise<string>;
  createSubscription(customerId: string, planId: string): Promise<any>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  verifyWebhookSignature(payload: any, signature: string): boolean;
}

export class StripeProvider implements PaymentProvider {
  async createCustomer(orgId: string, email: string): Promise<string> {
    console.log(`[Stripe] Creating customer for org ${orgId}`);
    return `cus_stripe_${orgId}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<any> {
    console.log(`[Stripe] Creating subscription ${planId} for ${customerId}`);
    return { id: `sub_stripe_${Date.now()}` };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[Stripe] Canceling subscription ${subscriptionId}`);
    return true;
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    return true; // placeholder
  }
}
