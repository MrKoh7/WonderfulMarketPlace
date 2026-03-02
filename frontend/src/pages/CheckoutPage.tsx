import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '../hooks/useCart';
import { createPaymentIntent } from '../lib/api';
import type { CartItem, SellerGroup } from '../types';

// Load Stripe outside component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Inner form component — must be inside <Elements> to use useStripe ────────
const CheckoutForm = ({ group }: { group: SellerGroup }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  // Create PaymentIntent as soon as checkout page loads
  useEffect(() => {
    const initPayment = async () => {
      try {
        const { clientSecret } = await createPaymentIntent(group.seller.id);
        setClientSecret(clientSecret);
      } catch (error) {
        setErrorMessage('Failed to initialise payment. Please try again.');
      } finally {
        setIsLoadingIntent(false);
      }
    };

    initPayment();
  }, [group.seller.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    // Confirm the payment with the card details
    // Card data goes directly to Stripe — never touches our backend
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: { card: cardElement },
      },
    );

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      setSucceeded(true);
      // Webhook handles DB update — we just show success UI here
      setTimeout(() => navigate('/'), 3000);
    }

    setIsProcessing(false);
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (succeeded) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-success mb-2">
          Payment Successful!
        </h2>
        <p className="text-base-content/60">
          Your order has been placed. Redirecting you home...
        </p>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoadingIntent) {
    return (
      <div className="flex justify-center p-10">
        Initialising payment...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Order summary */}
      <div className="bg-base-200 rounded-xl p-4">
        <h2 className="font-semibold text-lg mb-3">Order Summary</h2>
        <div className="flex flex-col gap-2">
          {group.items.map((item: CartItem) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product.title} × {item.quantity}
              </span>
              <span className="font-medium">
                RM{' '}
                {(Number(item.product.price ?? 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-base-300 mt-3 pt-3 flex flex-col gap-1">
          <div className="flex justify-between text-sm text-base-content/60">
            <span>Platform fee (5%)</span>
            <span>RM {(group.total * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">RM {group.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Card input — Stripe Elements handles this securely */}
      <div className="bg-base-200 rounded-xl p-4">
        <h2 className="font-semibold text-lg mb-3">Payment Details</h2>
        <div className="border border-base-300 rounded-lg p-3 bg-base-100">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  '::placeholder': { color: '#6b7280' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
        <p className="text-xs text-base-content/50 mt-2">
          🔒 Your card details are encrypted and never stored on our servers.
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="alert alert-error text-sm">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Test mode hint */}
      <div className="alert alert-info text-sm">
        <span>
          Test mode: use card <strong>4242 4242 4242 4242</strong>, any future
          expiry, any CVC.
        </span>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="btn btn-primary w-full"
      >
        {isProcessing ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          `Pay RM ${group.total.toFixed(2)}`
        )}
      </button>

      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="btn btn-ghost w-full"
      >
        Back to Cart
      </button>
    </form>
  );
};

// ── Outer wrapper — provides Stripe context to the form ───────────────────────
const CheckoutPage = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useCart();

  const items: CartItem[] = data?.items ?? [];

  // Build the seller group for this specific seller
  const sellerItems = items.filter(
    (item) => item.product.userId === sellerId,
  );
  const seller = sellerItems[0]?.product.user;

  const group: SellerGroup | null =
    seller && sellerItems.length > 0
      ? {
          seller,
          items: sellerItems,
          total: sellerItems.reduce(
            (sum, item) =>
              sum + Number(item.product.price ?? 0) * item.quantity,
            0,
          ),
        }
      : null;

  if (isLoading) {
    return <div className="flex justify-center p-10">Loading...</div>;
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-base-content/50">No items found for checkout.</p>
        <button
          className="btn btn-primary mt-4"
          onClick={() => navigate('/cart')}
        >
          Back to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <p className="text-base-content/60 mb-6 text-sm">
        Paying to:{' '}
        <span className="font-semibold text-base-content">
          {group.seller.name}
        </span>
      </p>

      {/* Elements wraps the form and provides Stripe context */}
      <Elements stripe={stripePromise}>
        <CheckoutForm group={group} />
      </Elements>
    </div>
  );
};

export default CheckoutPage;