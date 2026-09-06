"use client";

import { Skeleton } from "@/components/ui/skeleton";

export interface ContractSearchSkeletonProps {
  /** Number of skeleton items to render */
  count?: number;
}

/**
 * Skeleton loader component for contract search list items using shadcn Skeleton UI.
 */
export function ContractSearchSkeleton({ count = 3 }: ContractSearchSkeletonProps) {
  return (
    <div role="status" aria-label="Memuat daftar kontrak" className="space-y-0 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-3 border-b border-slate-200 py-3.5"
        >
          <div className="grid flex-1 gap-2 py-0.5 min-w-0">
            <Skeleton className="h-4 w-2/5 rounded-md" />
            <Skeleton className="h-3 w-1/4 rounded-md" />
          </div>
          <div className="flex items-center justify-end shrink-0 min-w-[50px]">
            <Skeleton className="size-6 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
