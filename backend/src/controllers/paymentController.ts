import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { getAuth } from '@clerk/express';
import * as queries from '../db/queries';
import { ENV } from '../config/env';

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY!);

const PLATFORM_FEE = parseFloat(ENV.PLATFORM_FEE_PERCENTAGE!);

/**
 * POST /api/payments/onboard
 * createa a Stripe Connect Express account for the seller
 * and returns the onboarding URL
 */
export const onboardSeller = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const user = await queries.getUserById(userId);
    if (!userId) return res.status(404).json({ error: 'User not found!' });

    let stripeAccountId = user?.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user?.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;
      await queries.updateUserStripeAccount(userId, stripeAccountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${ENV.FRONTEND_URL}/profile?onboard=refresh`,
      return_url: `${ENV.FRONTEND_URL}/profile?onboard=complete`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error('Error onboarding seller: ', error);
    res.status(500).json({ error: 'Failed to start seller onboarding!' });
  }
};

export const getOnboardingStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const user = await queries.getUserById(userId);
    if (!userId) return res.status(404).json({ error: 'User not found!' });

    if (!user?.stripeAccountId) {
      return res.status(200).json({ complete: false });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const isComplete = account.details_submitted;

    if (isComplete && !user.stripeOnboardingComplete) {
      await queries.completeUserStripeOnboarding(userId);
    }

    res.status(200).json({ complete: isComplete });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    res.status(500).json({ error: 'Failed to check onboarding status!' });
  }
};

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised!' });

    const { sellerId } = req.body;
    if (!sellerId)
      return res.status(400).json({ error: 'Seller ID is required!' });

    if (sellerId === userId) {
      return res
        .status(403)
        .json({ error: 'You cannot purchase own products!' });
    }

    const seller = await queries.getUserById(sellerId);
    if (!seller) return res.status(404).json({ error: 'Seller not found!' });

    if (!seller.stripeAccountId || !seller.stripeOnboardingComplete) {
      return res.status(400).json({
        error: 'Seller has not completed payment setup',
      });
    }

    const allCartItems = await queries.getCartItemsByUserId(userId);
    const sellerCartItems = allCartItems.filter(
      (item) => item.product.userId === sellerId,
    );

    if (sellerCartItems.length === 0) {
      return res.status(400).json({ error: 'No items found for this seller!' });
    }

    const totalAmount = sellerCartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price ?? '0');
      return sum + price * item.quantity;
    }, 0);

    const platformFee = totalAmount * PLATFORM_FEE;
    const totalInSen = Math.round(totalAmount * 100);
    const feeInSen = Math.round(platformFee * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInSen,
      currency: 'usd',
      application_fee_amount: feeInSen,
      on_behalf_of: seller.stripeAccountId,
      transfer_data: {
        destination: seller.stripeAccountId,
      },
      metadata: {
        buyerId: userId,
        sellerId,
        items: JSON.stringify(
          sellerCartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          })),
        ),
      },
    });

    await queries.createOrder({
      buyerId: userId,
      sellerId,
      stripePaymentIntentId: paymentIntent.id,
      totalAmount: totalAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      items: sellerCartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.price ?? '0',
      })),
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent!' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error('Webhook signature verification failed: ', error);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { buyerId, sellerId } = paymentIntent.metadata;

        await queries.updateOrderStatus(paymentIntent.id, 'paid');

        const allCartItems = await queries.getCartItemsByUserId(buyerId);
        const sellerItems = allCartItems.filter(
          (item) => item.product.userId === sellerId,
        );
        for (const item of sellerItems) {
          await queries.removeCartItem(item.id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await queries.updateOrderStatus(paymentIntent.id, 'failed');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed!' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const orders = await queries.getOrdersByBuyerId(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders: ', error);
    res.status(500).json({ error: 'Failed to fetch orders!' });
  }
};
