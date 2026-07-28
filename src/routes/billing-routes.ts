import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../core/auth';
import { planStore, paymentStore, INTERNAL_WHATSAPP_NUMBERS } from '../core/admin/admin-store';

const router = Router();

// Get Public Configurable Subscription Plans
router.get('/plans', (req: Request, res: Response) => {
  const publicPlans = Object.values(planStore)
    .filter(p => p.status === 'active' && p.visibility === 'public')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return res.json({ plans: publicPlans });
});

// Initiate Purchase via WhatsApp Flow (Optional Auth)
router.post('/subscriptions/purchase-request', async (req: Request, res: Response) => {
  try {
    const { planId, userEmail, fullName } = req.body;
    
    // Support authenticated request context or unauthenticated with provided body fields
    let email = (userEmail || '').trim().toLowerCase();
    let name = (fullName || 'Contributor').trim();

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
       // Since it's an optional auth route, we can just safely ignore if the token is invalid, 
       // but typically we'd parse the token here.
       // For this exact implementation we just rely on email/fullName in body if auth not provided explicitly by middleware.
    }
    
    // In our new architecture we can try to rely on AuthMiddleware optionally, 
    // but the frontend sends userEmail and fullName manually if logged out.

    if (!email) {
      return res.status(400).json({ error: 'Email address is required to initiate purchase.' });
    }

    const plan = planStore[planId] || Object.values(planStore).find(p => p.id === planId || p.name.toLowerCase() === (planId || '').toLowerCase()) || planStore['plan_1m'];
    const refCode = `REF-${Date.now().toString(36).toUpperCase()}`;

    const message = `Hello StockAI Sales! I would like to purchase the ${plan.name} Plan (${plan.price} ${plan.currency}).\n\nAccount Email: ${email}\nName: ${name}\nReference Code: ${refCode}\n\nPlease share payment details to activate my account.`;
    const whatsappUrl = `https://wa.me/${INTERNAL_WHATSAPP_NUMBERS.sales}?text=${encodeURIComponent(message)}`;
    const supportWhatsappUrl = `https://wa.me/${INTERNAL_WHATSAPP_NUMBERS.support}?text=${encodeURIComponent(`Hi StockAI Support, I need help regarding my purchase ${refCode} for account ${email}.`)}`;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    paymentStore[paymentId] = {
      id: paymentId,
      refCode,
      userEmail: email,
      fullName: name,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      paymentChannel: 'WhatsApp (Manual Transfer)',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      refCode,
      plan,
      whatsappUrl,
      supportWhatsappUrl,
      salesNumber: '03413516882',
      supportNumber: '03394377311'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate purchase request.' });
  }
});

export const billingRouter = router;
