import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

/**
 * Test Design
 *  requireAuth() from Clerk will try to verify a real JWT token.
 * In tests, there's no real Clerk instance —
 * so we mock the entire @clerk/express module
 * to make requireAuth a passthrough (authenticated)
 * or
 * a blocker (unauthenticated) depending on the scenario.
 */

// Mock the entire @clerk/express mode
vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req: any, res: any, next: any) => next(),
  requireAuth: () => (req: any, res: any, next: any) => {
    // simulate aunauthenticated (no session)
    res.status(401).json({ error: 'Unauthorised' });
  },
  getAuth: () => ({ userId: null }),
}));

// Mock db queries , so never touch real database
vi.mock('../../db/queries', () => ({
  getAllProduct: vi.fn(),
  searchProducts: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getProductsByUserId: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProductById: vi.fn(),
  deleteProductById: vi.fn(),
}));

describe('Product Routes - Auth Guard', () => {
  // Public routes
  describe('GET /api/products', () => {
    it('should return 200 for public product listing', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
    });
  });

  // Protected routes
  describe('GET /api/products/my', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/products/my');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/products', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/products').send({
        title: 'Test',
        description: 'TESTING',
        imageUrl: 'http://test.com',
        price: 10,
      });
      expect(res.status).toBe(401);
    });
  });

  describe('PUt /api/products/:id', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).put('/api/products/123').send({
        title: 'Testing_Testing 123',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/products/:id', async () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).delete('/api/products/123');
      expect(res.status).toBe(401);
    });
  });
});
