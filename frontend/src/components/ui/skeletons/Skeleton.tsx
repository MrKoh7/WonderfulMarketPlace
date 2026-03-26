/**
 * Skeleton — base shimmer block.
 *
 * All sizing is controlled via `className` (Tailwind utilities like `w-full h-40`).
 * The shimmer animation is defined in index.css as `.skeleton-shimmer` so that
 * the `prefers-reduced-motion` fallback can be handled purely in CSS — no JS
 * media-query hook needed, and the fallback is guaranteed even if JS hasn't run.
 *
 * @param className - Tailwind sizing/spacing classes (required for any visible output)
 * @param rounded   - true → rounded-full (circles/avatars), false → rounded-md (blocks)
 */

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export const Skeleton = ({ className = '', rounded = false }: SkeletonProps) => (
  <div
    // skeleton-shimmer   → gradient sweep defined in index.css (with reduced-motion fallback)
    // rounded-full/md    → shape: circle for avatars, rounded rect for everything else
    className={`skeleton-shimmer ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
  />
);
