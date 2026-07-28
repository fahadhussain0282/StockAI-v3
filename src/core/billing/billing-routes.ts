import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../auth/auth-middleware';
import { PlanService } from './plan-service';
import { SubscriptionService } from './subscription-service';
import { CreditService } from './credit-service';
import { UsageService } from './usage-service';
import { InvoiceService } from './invoice-service';
import { CheckoutService } from './checkout-service';

export const billingRouter = Router();

// Secure all routes
billingRouter.use(AuthMiddleware.authenticate);

// --- Plans ---
billingRouter.get('/v1/billing/plans', async (req: Request, res: Response) => {
  const plans = await PlanService.getAllPlans();
  res.json({ plans });
});

// --- Subscriptions ---
billingRouter.get('/v1/subscriptions', async (req: Request, res: Response) => {
  // In real app, you would pass orgId derived from user context or query param (with validation)
  const orgId = req.query.orgId as string;
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const subscription = await SubscriptionService.getActiveSubscription(orgId);
  res.json({ subscription });
});

billingRouter.delete('/v1/subscriptions', async (req: Request, res: Response) => {
  const orgId = req.body.orgId as string;
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const result = await SubscriptionService.cancelSubscription(orgId);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ success: true });
});

// --- Credits ---
billingRouter.get('/v1/credits', async (req: Request, res: Response) => {
  const orgId = req.query.orgId as string;
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const ledger = await CreditService.getLedger(orgId);
  res.json({ ledger });
});

// --- Usage ---
billingRouter.get('/v1/usage', async (req: Request, res: Response) => {
  const { orgId, metric, startDate, endDate } = req.query;
  if (!orgId || !metric || !startDate || !endDate) return res.status(400).json({ error: 'Missing required parameters' });

  const amount = await UsageService.getUsageForPeriod(
    orgId as string, 
    metric as any, 
    startDate as string, 
    endDate as string
  );
  res.json({ amount });
});

// --- Invoices ---
billingRouter.get('/v1/invoices', async (req: Request, res: Response) => {
  const orgId = req.query.orgId as string;
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const invoices = await InvoiceService.getInvoices(orgId);
  res.json({ invoices });
});

// --- Checkout ---
billingRouter.post('/v1/checkout', async (req: Request, res: Response) => {
  const { orgId, planId, provider, successUrl, cancelUrl } = req.body;
  if (!orgId || !planId || !provider || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const result = await CheckoutService.createCheckoutSession(orgId, planId, provider, successUrl, cancelUrl);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ url: result.url });
});
