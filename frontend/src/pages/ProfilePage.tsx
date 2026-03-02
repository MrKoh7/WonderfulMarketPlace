import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMyProducts, useDeleteProduct } from '../hooks/useProducts';
import { useMyOrders } from '../hooks/useOrder';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  PackageIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  CreditCardIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { onboardSeller, getOnboardingStatus } from '../lib/api';
import type { Order } from '../types';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useMyProducts();
  const deleteProduct = useDeleteProduct();
  const products = data?.products || [];

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Fetch orders via TanStack Query — consistent with your existing patterns
  const { data: orders = [], isLoading: isOrdersLoading } = useMyOrders();
  const paidOrders = orders.filter((o) => o.status === 'paid');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { complete } = await getOnboardingStatus();
        setOnboardingComplete(complete);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    checkStatus();

    const onboardParam = searchParams.get('onboard');
    if (onboardParam === 'complete' || onboardParam === 'refresh') {
      checkStatus();
    }
  }, [searchParams]);

  const handleOnboard = async () => {
    setIsOnboarding(true);
    setOnboardingError(null);
    try {
      const { url } = await onboardSeller();
      window.location.href = url;
    } catch (error) {
      setOnboardingError('Failed to start onboarding. Please try again.');
      setIsOnboarding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product?')) deleteProduct.mutate(id);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-base-content/60 text-sm">Manage your listings</p>
        </div>
        <Link to="/create" className="btn btn-primary btn-sm gap-1">
          <PlusIcon className="size-4" /> New
        </Link>
      </div>

      {/* ── Seller Payment Setup Section ──────────────────────────────────── */}
      <div className="card bg-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCardIcon className="size-5 text-primary" />
              <div>
                <h2 className="font-semibold text-sm">Seller Payment Setup</h2>
                <p className="text-xs text-base-content/60">
                  {onboardingComplete
                    ? 'Your account is ready to receive payments.'
                    : 'Set up payments to receive money from your sales.'}
                </p>
              </div>
            </div>

            {onboardingComplete === null ? (
              <span className="loading loading-spinner loading-sm" />
            ) : onboardingComplete ? (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <CheckCircleIcon className="size-4" />
                Connected
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleOnboard}
                disabled={isOnboarding}
              >
                {isOnboarding ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Set Up Payments'
                )}
              </button>
            )}
          </div>

          {onboardingError && (
            <div className="alert alert-error text-xs mt-2 py-2">
              {onboardingError}
            </div>
          )}

          {searchParams.get('onboard') === 'complete' && onboardingComplete && (
            <div className="alert alert-success text-xs mt-2 py-2">
              🎉 Payment setup complete! You can now receive payments.
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="stats bg-base-300 w-full">
        <div className="stat">
          <div className="stat-title">Total Products</div>
          <div className="stat-value text-primary">{products.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Completed Orders</div>
          <div className="stat-value text-success">{paidOrders.length}</div>
        </div>
      </div>

      {/* ── Purchase History ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBagIcon className="size-5" />
          <h2 className="text-lg font-bold">Purchase History</h2>
        </div>

        {isOrdersLoading ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : paidOrders.length === 0 ? (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-10">
              <ShoppingBagIcon className="size-12 text-base-content/20" />
              <p className="text-base-content/50 text-sm">No purchases yet.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paidOrders.map((order: Order) => (
              <div key={order.id} className="card bg-base-300">
                <div className="card-body p-4">
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-base-content/50 font-mono">
                        {order.stripePaymentIntentId}
                      </p>
                      <p className="text-xs text-base-content/40 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-MY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="badge badge-success badge-sm">Paid</span>
                  </div>

                  {/* Order items */}
                  {order.orderItems && order.orderItems.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {item.product?.imageUrl && (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product?.title}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <span>
                              {item.product?.title ?? 'Product'} ×{' '}
                              {item.quantity}
                            </span>
                          </div>
                          <span className="font-medium">
                            RM{' '}
                            {(
                              Number(item.priceAtPurchase) * item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order totals */}
                  <div className="border-t border-base-content/10 pt-2 flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-base-content/50">
                      <span>Platform fee (5%)</span>
                      <span>RM {Number(order.platformFee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm">
                      <span>Total Paid</span>
                      <span className="text-primary">
                        RM {Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Products list ─────────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="card bg-base-300">
          <div className="card-body items-center text-center py-16">
            <PackageIcon className="size-16 text-base-content/20" />
            <h3 className="card-title text-base-content/50">No products yet</h3>
            <p className="text-base-content/40 text-sm">
              Start by creating your first product
            </p>
            <Link to="/create" className="btn btn-primary btn-sm mt-4">
              Create Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="card card-side bg-base-300">
              <figure className="w-32 shrink-0">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full object-cover"
                />
              </figure>
              <div className="card-body p-4">
                <h2 className="card-title text-base">{product.title}</h2>
                <p className="text-sm text-base-content/60 line-clamp-1">
                  {product.description}
                </p>
                <div className="card-actions justify-end mt-2">
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="btn btn-ghost btn-xs gap-1"
                  >
                    <EyeIcon className="size-3" /> View
                  </button>
                  <button
                    onClick={() => navigate(`/edit/${product.id}`)}
                    className="btn btn-ghost btn-xs gap-1"
                  >
                    <EditIcon className="size-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="btn btn-ghost btn-xs text-error gap-1"
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2Icon className="size-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
