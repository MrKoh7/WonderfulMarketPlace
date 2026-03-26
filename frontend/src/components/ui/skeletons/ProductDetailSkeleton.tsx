/**
 * ProductDetailSkeleton — mirrors the layout of <ProductPage />.
 *
 * Real page structure:
 *   <header>  back button | (edit / delete buttons for owner)
 *   <grid lg:grid-cols-2 gap-8>
 *     Left:  <img h-80 object-cover rounded-xl>
 *     Right: <card bg-base-300>
 *              title + price row (text-3xl)
 *              meta: date icon + date | user icon + creator name
 *              <divider>
 *              description paragraph (leading-relaxed, ~4 lines)
 *              creator mini-card (w-12 avatar + name + "Creator" label)
 *   <card bg-base-300>  ← CommentsSection
 *     header | input row | 3 comment rows
 */

import { Skeleton } from './Skeleton';

export const ProductDetailSkeleton = () => (
  <div className="max-w-5xl mx-auto p-4 space-y-6">
    {/* Header row  */}
    <div className="flex items-center justify-between">
      {/* Back button */}
      <Skeleton className="h-9 w-24" />
      {/* Edit / Delete (shown only to owner — skeleton shows them unconditionally) */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>

    {/* Two-column grid */}
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Left col — product image: h-80, rounded-xl */}
      <Skeleton className="h-80 w-full rounded-xl" />

      {/* Right col — info card */}
      <div className="card bg-base-300 p-6 space-y-4">
        {/* Title + price on same row (real: text-3xl each) */}
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-8 w-2/3" />
          {/* Price is text-primary, roughly 4-6 chars */}
          <Skeleton className="h-8 w-1/5" />
        </div>

        {/* Meta rows — icon (small circle) + text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 shrink-0" rounded />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 shrink-0" rounded />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="divider my-0" />

        {/* Description — leading-relaxed paragraph; 4 lines, last ~80% */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Creator mini-card — bg-base-200 rounded-xl p-3 */}
        <div className="flex items-center gap-3 bg-base-200 rounded-xl p-3">
          {/* Avatar: w-12 h-12 rounded-full with ring */}
          <Skeleton className="h-12 w-12 shrink-0" rounded />
          <div className="space-y-1.5 flex-1">
            {/* Creator name */}
            <Skeleton className="h-4 w-1/2" />
            {/* "Creator" label */}
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    </div>

    {/* ── Comments section card ────────────────────────────────────────────── */}
    <div className="card bg-base-300 p-6 space-y-3">
      {/* Section header: icon + "Comments" + count badge */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" rounded />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>

      {/* Comment input row */}
      <Skeleton className="h-9 w-full" />

      {/* Comment list — 3 placeholder rows */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Avatar: w-8 h-8 rounded-full */}
          <Skeleton className="h-8 w-8 shrink-0" rounded />
          <div className="space-y-1.5 flex-1">
            {/* Username + date in chat-header */}
            <Skeleton className="h-3 w-28" />
            {/* Bubble text — varies width to feel organic */}
            <Skeleton className={`h-4 ${i === 2 ? 'w-1/2' : 'w-3/4'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
