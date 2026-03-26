/**
 * MyListingsRowSkeleton — mirrors a single product row in <ProfilePage />.
 *
 * Real structure (card-side layout):
 *   <div card card-side bg-base-300>
 *     <figure w-32 shrink-0>          ← thumbnail, full height
 *       <img object-cover>
 *     <card-body p-4>
 *       <h2 card-title text-base>     ← product title
 *       <p line-clamp-2 text-sm>      ← 2-line description
 *       <p font-semibold text-sm>     ← price
 *       <div card-actions>
 *         <btn btn-ghost btn-xs>      ← View, Edit, Delete
 *
 * `min-h-[7rem]` on the thumbnail ensures the card doesn't collapse before
 * the body fills in — matches the natural height of a 2-line description card.
 */

import { Skeleton } from './Skeleton';

export const MyListingsRowSkeleton = () => (
  <div className="card card-side bg-base-300 overflow-hidden">
    {/* Side thumbnail — w-32 fixed, full card height */}
    {/* rounded-none so it bleeds to the card edge, matching real <figure> */}
    <Skeleton className="w-32 shrink-0 rounded-none min-h-28" />

    {/* Card body */}
    <div className="card-body p-4 gap-0">
      {/* Title — card-title text-base; ~60% to suggest a medium-length name */}
      <Skeleton className="h-5 w-3/5 mb-2" />

      {/* Description — 2 lines matching line-clamp-2 */}
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-4/5 mb-3" />

      {/* Price */}
      <Skeleton className="h-4 w-20 mb-3" />

      {/* Action buttons — View / Edit / Delete (btn-ghost btn-xs) */}
      <div className="flex gap-2 mt-auto">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);
