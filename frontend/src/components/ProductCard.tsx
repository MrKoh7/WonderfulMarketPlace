import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router';
import { MessageCircleIcon, ShoppingCartIcon } from 'lucide-react';
import type { ProductWithUser } from '../types';
import type { FC } from 'react';
import { useAddToCart } from '../hooks/useCart';

interface HighlightTextProps {
  text: string;
  highlight: string;
}

interface ProductCardProps {
  product: ProductWithUser;
  searchTerm?: string;
  HighlightText?: FC<HighlightTextProps>;
}

const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const ProductCard = ({
  product,
  searchTerm,
  HighlightText,
}: ProductCardProps) => {
  const isNew = new Date(product.createdAt) > oneWeekAgo;
  const { mutate: addToCart, isPending } = useAddToCart();
  const { userId } = useAuth();

  const isOwner = userId === product.userId;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="card bg-base-300 hover:bg-base-200 transition-colors"
    >
      <figure className="px-4 pt-4">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="rounded-xl h-40 w-full object-cover"
        />
      </figure>
      <div className="card-body p-4">
        <h2 className="card-title text-base">
          {searchTerm && HighlightText ? (
            <HighlightText text={product.title} highlight={searchTerm} />
          ) : (
            product.title
          )}
          {isNew && <span className="badge badge-secondary badge-sm">NEW</span>}
        </h2>
        <p className="text-sm text-base-content/70 line-clamp-2">
          {product.description}
        </p>

        <div className="font-semibold text-sm mt-1">
          {product.price
            ? `RM ${Number(product.price).toFixed(2)}`
            : 'Price not set'}
        </div>

        <div className="divider my-1"></div>

        <div className="flex items-center justify-between">
          {product.user && (
            <div className="flex items-center gap-2">
              <div className="avatar">
                <div className="w-6 rounded-full ring-1 ring-primary">
                  <img
                    src={product.user.imageUrl ?? undefined}
                    alt={product.user.name ?? undefined}
                  />
                </div>
              </div>
              <span className="text-xs text-base-content/60">
                {product.user.name}
              </span>
            </div>
          )}
          {product.comments && (
            <div className="flex items-center gap-1 text-base-content/50">
              <MessageCircleIcon className="size-3" />
              <span className="text-xs">{product.comments.length}</span>
            </div>
          )}

          {!isOwner && userId &&(
            <button
              onClick={handleAddToCart}
              disabled={isPending}
              className="btn btn-primary btn-xs gap-1"
            >
              {' '}
              <ShoppingCartIcon className="size-3" />
              {isPending ? 'Adding...' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
