"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface ReviewRiskSummaryBarProps {
  isLoading?: boolean;
  totalAnalyzed?: number;
  riskyCount?: number;
  description?: string;
}

export function ReviewRiskSummaryBar({
  isLoading = false,
  totalAnalyzed = 0,
  riskyCount = 0,
}: ReviewRiskSummaryBarProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-lg bg-white/80 backdrop-blur-md border px-5 py-5">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-5 w-36 max-w-full rounded-md" />
          <Skeleton className="h-3.5 w-60 max-w-full rounded-md" />
        </div>
      </div>
    );
  }

  const totalCount = totalAnalyzed || riskyCount;
  const fractionText = totalCount > 0 ? `${riskyCount}/${totalCount}` : `${riskyCount}`;
  const ratio = totalCount > 0 ? Math.min(100, Math.round((riskyCount / totalCount) * 100)) : 0;

  return (
    <div className="flex items-center gap-4 rounded-lg bg-white/80 backdrop-blur-md border px-5 py-5">
      <div className="relative flex size-20 shrink-0 items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-[#ff5527] transition-all duration-500 ease-out"
            strokeDasharray={`${ratio}, 100`}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-xs font-bold text-slate-800">{fractionText}</span>
      </div>
      <div className="grid flex-1 gap-1">
        <h3 className="text-md font-bold text-slate-900 leading-snug">
          {riskyCount} terdeteksi berisiko
        </h3>
        <p className="text-xs text-slate-500">
          Dari {totalCount} bagian kontrak yang diperiksa, terdapat {riskyCount} yang berisiko
        </p>
      </div>
    </div>
  );
}
