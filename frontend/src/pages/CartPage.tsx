import { ShoppingCartIcon, Trash2Icon } from 'lucide-react';
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useClearCart,
} from '../hooks/useCart';
import type { CartItem } from '../types';

const CartPage = () => {
  const { data, isLoading } = useCart();
  const { mutate: removeItem } = useRemoveCartItem();
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: clearCart } = useClearCart();

  const items: CartItem[] = data?.items ?? [];

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const price = Number(item.product.price ?? 0);
    return sum + price * item.quantity;
  }, 0);

  if (isLoading)
    return <div className="flex justify-center p-10">Loading cart...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCartIcon className="size-6" />
          Your Cart
        </h1>
        {items.length > 0 && (
          <button
            onClick={() => clearCart()}
            className="btn btn-ghost btn-sm text-error"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center text-base-content/50 py-20">
          Your cart is empty.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {items.map((item: CartItem) => (
              <div
                key={item.id}
                className="card bg-base-200 p-4 flex flex-row items-center gap-4"
              >
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.product.title}</p>
                  <p className="text-primary text-sm">
                    RM {Number(item.product.price ?? 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() =>
                      item.quantity > 1
                        ? updateQuantity({
                            id: item.id,
                            quantity: item.quantity - 1,
                          })
                        : removeItem(item.id)
                    }
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() =>
                      updateQuantity({
                        id: item.id,
                        quantity: item.quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>

                <p className="w-20 text-right font-medium">
                  RM{' '}
                  {(Number(item.product.price ?? 0) * item.quantity).toFixed(2)}
                </p>

                <button
                  onClick={() => removeItem(item.id)}
                  className="btn btn-ghost btn-sm text-error"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-base-300 pt-4 flex flex-col items-end gap-3">
            <p className="text-lg font-semibold">
              Subtotal:{' '}
              <span className="text-primary">RM {subtotal.toFixed(2)}</span>
            </p>
            {/* Disabled for now — Stripe comes next */}
            <button className="btn btn-primary w-full" disabled>
              Proceed to Checkout (Coming Soon)
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
