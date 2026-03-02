import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  onboardSeller,
  getOnboardingStatus,
  createPaymentIntent,
  handleWebhook,
  getMyOrders,
} from '../controllers/paymentController';

const router = Router();

// Seller onboarding
router.post('/onboard', requireAuth(), onboardSeller);
router.get('/onboard/status', requireAuth(), getOnboardingStatus);

// Payment intent — buyer initiates checkout
router.post('/create-payment-intent', requireAuth(), createPaymentIntent);

// Webhook — Stripe calls this, NOT protected by Clerk
// Raw body parsing is handled in index.ts BEFORE express.json()
router.post('/webhook', handleWebhook);

// Get user's orders
router.get('/orders', requireAuth(), getMyOrders);
export default router;
