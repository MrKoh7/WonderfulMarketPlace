import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';

// Mock Clerk
vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  // Authenticated by default
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  // Fake logged-in user
  getAuth: (_req: any) => ({ userId: 'user_buyer123' }),
}));

// Mock Stripe
// never hit real Stripe API in tests
vi.mock('stripe', () => {
  const mockStripeInstance = {
    paymentIntent: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };

  return {
    default: vi.fn().mockImplementation(function () {
      return mockStripeInstance;
    }),
  };
});

// Mock DB queries
vi.mock('../../db/queries', () => ({
  getUserById: vi.fn(),
  getCartItemsByUserId: vi.fn(),
  createOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  removeCartItem: vi.fn(),
}));

// createPaymentIntent Test
describe('POST api/payments/create-payment-intent', () => {
  it('should return 400 when sellerId is missing', async () => {
    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Seller ID is required!');
  });

  it('should return 404 when buyer tries to purchase own products', async () => {
    // here the seller id matches the above one
    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({ sellerId: 'user_buyer_123' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Seller not found!');
  });

  it('should return 404 whyen seller does not exist', async () => {
    const { getUserById } = await import('../../db/queries'); // fixed typo
    vi.mocked(getUserById).mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({
        sellerId: 'user_buyer586',
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Seller not found!');
  });

  it('should return 400 when seller has not completed Stripe onboarding', async () => {
    const { getUserById } = await import('../../db/queries');
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'user_seller457',
      stripeAccountId: null, // no Stripe account
      stripeOnboardingComplete: false,
    } as any);

    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({ sellerId: 'user_seller457' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Seller has not completed payment setup');
  });

  it('should return 400 when seller has no cart items', async () => {
    const { getUserById, getCartItemsByUserId } =
      await import('../../db/queries');
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'user_seller457',
      stripeAccountId: 'acc_test_123',
      stripeOnboardingComplete: true,
    } as any);
    vi.mocked(getCartItemsByUserId).mockResolvedValueOnce([]); // empty cart

    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({ sellerId: 'user_seller457' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No items found for this seller!');
  });
});

// Webhook Tests
describe('POST api/payments/webhook', () => {
  it('should return 400 when stripe-signature header is missing', async () => {
    const res = await request(app).post('/api/payments/webhook').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing stripe signature');
  });

  it('should return 400 when stripe signature is invalid', async () => {
    const stripeModule = await import('stripe');
    const mockInstance = vi.mocked(stripeModule.default).mock.results[0].value;

    mockInstance.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('Webhook signature verification failed');
    });

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'bad_signature')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid webhook signature');
  });
});
