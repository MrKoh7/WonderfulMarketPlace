import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useProducts } from '../hooks/useProducts';
import { PackageIcon, SparklesIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { SignInButton, useAuth } from '@clerk/clerk-react';

function HomePage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Sync search term with URL query params (?search=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;

  // Stable callback so SearchBar's debounce effect doesn't re-trigger unnecessarily
  const handleSearchChange = useCallback(
    (value: string) => {
      if (value) {
        setSearchParams({ search: value, page: '1' });
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('search');
          return next;
        });
      }
    },
    [setSearchParams],
  );

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      page: String(newPage),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data, isLoading, isFetching, error } = useProducts(
    searchTerm || undefined,
    page,
    limit,
  );
  const products = data?.data || [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-10">
      <div className="hero bg-linear-to-br from-base-300 via-base-200 to-base-300 rounded-box overflow-hidden">
        <div className="hero-content flex-col lg:flex-row-reverse gap-10 py-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110" />
            <img
              src="/image.png"
              alt="Creator"
              className="relative h-64 lg:h-72 rounded-2xl shadow-2xl"
            />
          </div>
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Share Your <span className="text-primary">Products</span>
            </h1>
            <p className="py-4 text-base-content/60">
              Upload, discover, and connect with creators.
            </p>
            
            {isSignedIn ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/create')}
              >
                <SparklesIcon className="size-4" />
                Start Selling
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn btn-primary">
                  <SparklesIcon className="size-4" />
                  Start Selling
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PackageIcon className="size-5 text-primary" />
            All Products
          </h2>

          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            isFetching={isFetching}
          />
        </div>

        {searchTerm && (
          <p className="text-sm text-base-content/60 mb-4">
            Showing{' '}
            <span className="font-semibold text-base-content">{total}</span>{' '}
            {total === 1 ? 'result' : 'results'} for{' '}
            <span className="font-semibold text-primary">"{searchTerm}"</span>
          </p>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div role="alert" className="alert alert-error">
            <span>Something went wrong. Please refresh the page.</span>
          </div>
        ) : total === 0 ? (
          searchTerm ? (
            // Empty state specifically for search with no results
            <div className="card bg-base-300">
              <div className="card-body items-center text-center py-16">
                <SearchXIcon className="size-16 text-base-content/20" />
                <h3 className="card-title text-base-content/50">
                  No results found
                </h3>
                <p className="text-base-content/40 text-sm">
                  No products match "
                  <span className="font-semibold">{searchTerm}</span>". Try a
                  different search term.
                </p>
                <button
                  onClick={() => setSearchParams({})}
                  className="btn btn-primary btn-sm mt-2"
                >
                  Clear Search
                </button>
              </div>
            </div>
          ) : (
            // Empty state when there are no products at all
            <div className="card bg-base-300">
              <div className="card-body items-center text-center py-16">
                <PackageIcon className="size-16 text-base-content/20" />
                <h3 className="card-title text-base-content/50">
                  No products yet
                </h3>
                <p className="text-base-content/40 text-sm">
                  Be the first to share something!
                </p>
                <Link to="/create" className="btn btn-primary btn-sm mt-2">
                  Create Product
                </Link>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>

            <span className="text-sm text-base-content/60">
              Page {page} of {totalPages}
            </span>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default HomePage;
