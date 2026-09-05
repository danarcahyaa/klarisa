"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReviewRiskSummaryBar } from "./review-risk-summary-bar";

export function FindingListSkeleton() {
  return (
    <section role="status" aria-label="Memuat daftar temuan" className="motion-safe:animate-pulse">
      <div className="sticky top-0 z-20 bg-transparent backdrop-blur-md px-3 pt-3">
        <ReviewRiskSummaryBar isLoading={true} />
      </div>
      <div className="divide-y divide-slate-100 mt-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex w-full items-center border-b border-slate-200 justify-between gap-3 p-4"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Skeleton className="h-4 w-5 shrink-0 rounded-md" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
              </div>
            </div>
            <Skeleton className="size-4 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
