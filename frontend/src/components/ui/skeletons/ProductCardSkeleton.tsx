/**
 * ProductCardSkeleton — mirrors the layout of <ProductCard />.
 *
 * Real card structure (for reference):
 *   <Link> card bg-base-300
 *     <figure px-4 pt-4>
 *       <img h-40 w-full rounded-xl>
 *     <card-body p-4>
 *       <card-title text-base>         ← title (~75% width)
 *       <p text-sm line-clamp-2>       ← 2 description lines
 *       <p font-semibold text-sm>      ← price (~30% width)
 *       <divider>
 *       <div flex items-center>
 *         <avatar w-6 rounded-full>
 *         <comment count>
 *         <add-to-cart btn-xs>
 */

import { Skeleton } from './Skeleton';

export const ProductCardSkeleton = () => (
  <div className="card bg-base-300">
    {/* ── Image — matches h-40 w-full rounded-xl of the real figure ── */}
    <div className="px-4 pt-4">
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>

    <div className="card-body p-4 gap-0">
      {/* ── Title — card-title text-base; stop at ~75% to suggest a real word boundary ── */}
      <Skeleton className="h-5 w-3/4 mb-2" />

      {/* ── Description — two lines mirroring line-clamp-2; second line shorter ── */}
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-5/6 mb-3" />

      {/* ── Price — font-semibold text-sm; kept narrow like "$12.99" ── */}
      <Skeleton className="h-4 w-1/3 mb-2" />

      {/* ── Divider ── */}
      <div className="divider my-1" />

      {/* ── Footer row — avatar | comment count | spacer | cart button ── */}
      <div className="flex items-center gap-2">
        {/* avatar: w-6 h-6 rounded-full */}
        <Skeleton className="h-6 w-6 shrink-0" rounded />

        {/* comment count stub (icon + number) */}
        <Skeleton className="h-4 w-10" />

        {/* push button to the right */}
        <div className="flex-1" />

        {/* cart button — btn-xs roughly 80px wide */}
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    </div>
  </div>
);
