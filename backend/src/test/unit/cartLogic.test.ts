import { describe, it, expect } from 'vitest';
import { canAddToCart } from '../../utils/cartLogic';

describe('canAddToCart', () => {
  it('should return false when buyer is the product owner', () => {
    const userId = 'user_abc123';
    const productOwnerId = 'user_abc123';

    expect(canAddToCart(userId, productOwnerId)).toBe(false);
  });

  it('should return true when buyer is a different user', () => {
    const userId = 'user_abc123';
    const sellerId = 'user_xyc121';

    expect(canAddToCart(userId, sellerId)).toBe(true);
  });

  it('should return false when both IDs are empty strings', () => {
    expect(canAddToCart('', '')).toBe(false);
  });
});
