//@ts-nocheck
import { useState, useEffect } from 'react';
import { SearchIcon, XIcon, LoaderIcon } from 'lucide-react';

const SearchBar = ({ value, onChange, isFetching }) => {
  // Local input state — the user types here immediately (no lag)
  const [inputValue, setInputValue] = useState(value);

  // Sync local state when the external value changes (e.g. browser back/forward)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce: wait 400ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue);
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue, onChange]);

  return (
    <div className="relative w-full max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
        {isFetching ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <SearchIcon className="size-4" />
        )}
      </span>

      <input
        type="text"
        placeholder="Search products..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="input input-bordered w-full pl-10 pr-10"
      />

      {inputValue && (
        <button
          type="button"
          onClick={() => setInputValue('')}
          className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
