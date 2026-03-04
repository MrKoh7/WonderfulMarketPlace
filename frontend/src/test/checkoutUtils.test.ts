import { describe, it, expect } from 'vitest';
import {
  calculateTotal,
  calculatePlatformFee,
  formatPrice,
} from '../lib/checkoutUtils';

describe('calculateTotal', () => {
  it('should return 0 for an empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should calculate total for a single item', () => {
    const items = [{ product: { price: '50.00' }, quantity: 1 }];
    expect(calculateTotal(items)).toBe(50);
  });

  it('should multiply price by quantity correctly', () => {
    const items = [{ product: { price: '25.00' }, quantity: 3 }];
    expect(calculateTotal(items)).toBe(75);
  });

  it('should sum multiple items correctly', () => {
    const items = [
      { product: { price: '10.00' }, quantity: 2 },
      { product: { price: '30.00' }, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(50);
  });

  it('should handle null price as 0', () => {
    const items = [{ product: { price: null }, quantity: 2 }];
    expect(calculateTotal(items)).toBe(0);
  });
});

describe('calculatePlatformFee', () => {
  it('should calculate 5% fee correctly', () => {
    expect(calculatePlatformFee(100)).toBe(5);
  });

  it('should return 0 fee for 0 total', () => {
    expect(calculatePlatformFee(0)).toBe(0);
  });
});

describe('formatPrice', () => {
  it('should format to 2 decimal places', () => {
    expect(formatPrice(50)).toBe('50.00');
  });

  it('should round correctly', () => {
    expect(formatPrice(10.555)).toBe('10.56');
  });
});
