/**
 * NavbarUserSkeleton — mirrors the right-side authenticated section of <Navbar />.
 *
 * Real signed-in section:
 *   <btn btn-sm>New Product  (hidden on mobile)
 *   <btn btn-sm>Profile      (hidden on mobile)
 *   <btn btn-sm icon>Cart
 *   <UserButton />            ← Clerk's circular avatar button (~32px)
 *
 * The text buttons are hidden below `sm` breakpoint, matching the real navbar's
 * `hidden sm:inline` pattern, so the skeleton also hides them on small screens.
 */

import { Skeleton } from './Skeleton';

export const NavbarUserSkeleton = () => (
  <div className="flex items-center gap-2">
    {/* "New Product" button stub — hidden sm:inline */}
    <Skeleton className="h-8 w-28 hidden sm:block" />

    {/* "Profile" button stub — hidden sm:inline */}
    <Skeleton className="h-8 w-20 hidden sm:block" />

    {/* Cart icon button — always visible (icon-only on mobile) */}
    <Skeleton className="h-8 w-8" rounded />

    {/* Clerk UserButton — 32 × 32 circular avatar */}
    <Skeleton className="h-8 w-8" rounded />
  </div>
);
