// Calculate the total price for a group of cart items

export function calculateTotal(
  items: { product: { price: string | null }; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
}

// Calculate the platform fee (5%) for a given total
export function calculatePlatformFee(total: number): number {
  return total * 0.05;
}

// Format a number to 2 decimal places
export function formatPrice(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}
