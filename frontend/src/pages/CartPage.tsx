import { ShoppingCartIcon, Trash2Icon } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useClearCart,
} from '../hooks/useCart';
import type { CartItem, SellerGroup } from '../types';

const CartPage = () => {
  const { data, isLoading } = useCart();
  const { mutate: removeItem } = useRemoveCartItem();
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: clearCart } = useClearCart();
  const navigate = useNavigate();

  const items: CartItem[] = data?.items ?? [];

  // ── Group cart items by seller ────────────────────────────────────────────
  // This is the key logic for per-seller checkout
  const sellerGroups: SellerGroup[] = items.reduce(
    (groups: SellerGroup[], item: CartItem) => {
      const sellerId = item.product.userId;
      const seller = item.product.user;

      if (!seller) return groups;

      const existing = groups.find((g) => g.seller.id === sellerId);

      if (existing) {
        existing.items.push(item);
        existing.total += Number(item.product.price ?? 0) * item.quantity;
      } else {
        groups.push({
          seller,
          items: [item],
          total: Number(item.product.price ?? 0) * item.quantity,
        });
      }

      return groups;
    },
    [],
  );

  const grandTotal = items.reduce((sum: number, item: CartItem) => {
    return sum + Number(item.product.price ?? 0) * item.quantity;
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
          {/* ── Render one section per seller ────────────────────────────── */}
          <div className="flex flex-col gap-8">
            {sellerGroups.map((group: SellerGroup) => (
              <div key={group.seller.id} className="border border-base-300 rounded-xl p-4">

                {/* Seller header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-base-300">
                  <img
                    src={group.seller.imageUrl ?? ''}
                    alt={group.seller.name ?? 'Seller'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <p className="font-semibold text-sm">
                    {group.seller.name ?? 'Unknown Seller'}
                  </p>
                </div>

                {/* Items for this seller */}
                <div className="flex flex-col gap-3">
                  {group.items.map((item: CartItem) => (
                    <div
                      key={item.id}
                      className="flex flex-row items-center gap-4"
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

                      {/* Quantity controls */}
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
                        {(
                          Number(item.product.price ?? 0) * item.quantity
                        ).toFixed(2)}
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

                {/* Seller subtotal + checkout button */}
                <div className="mt-4 pt-3 border-t border-base-300 flex justify-between items-center">
                  <p className="font-semibold">
                    Subtotal:{' '}
                    <span className="text-primary">
                      RM {group.total.toFixed(2)}
                    </span>
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      navigate(`/checkout/${group.seller.id}`)
                    }
                  >
                    Checkout with {group.seller.name ?? 'Seller'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Grand total across all sellers ───────────────────────────── */}
          <div className="mt-6 border-t border-base-300 pt-4 flex justify-end">
            <p className="text-lg font-semibold">
              Grand Total:{' '}
              <span className="text-primary">
                RM {grandTotal.toFixed(2)}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;