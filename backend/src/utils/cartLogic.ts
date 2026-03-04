/**
 * Determines if a user is allowed to add a product to their cart.
 * A user cannot purchase their own product.
 */
export function canAddToCart(buyerId: string, productOwnerId: string): boolean {
  return buyerId !== productOwnerId;
}