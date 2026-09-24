"use client";

import React, { useEffect, useMemo } from "react";
import { FileSearch, FileText, Loader2, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useReviewSearch } from "@/hooks/useReviewSearch";
import { cn, formatIndonesianDate } from "@/lib/utils";
import type { ReviewSearchItem } from "@/types/contract-review.type";

export interface SearchReviewDialogProps {
  /** Controls open state of the dialog */
  open: boolean;
  /** Callback fired when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback fired when user selects a review from the list */
  onSelectReview?: (reviewId: string) => void;
  /** Active review id to highlight */
  currentReviewId?: string | null;
  /** Optional pre-loaded reviews list */
  initialReviews?: ReviewSearchItem[];
  /** Optional custom CSS classes for dialog content */
  className?: string;
}

/**
 * Modal dialog for searching and navigating user contract reviews.
 * Features a sticky search input at the top and a scrollable list of review documents
 * with lazy pagination and debounced search.
 */
export function SearchReviewDialog({
  open,
  onOpenChange,
  onSelectReview,
  currentReviewId,
  initialReviews,
  className,
}: SearchReviewDialogProps) {
  const {
    query,
    setQuery,
    reviews,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sentinelRef,
    containerRef,
    handleScroll,
  } = useReviewSearch({
    enabled: open,
    limit: 15,
    debounceDelay: 300,
    initialReviews,
  });

  // Reset search query when dialog is closed
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open, setQuery]);

  const handleItemClick = (reviewId: string) => {
    onSelectReview?.(reviewId);
    onOpenChange(false);
  };

  // Memoize formatted review items to prevent unnecessary re-computations on keystroke re-renders
  const memoizedReviews = useMemo(() => {
    return reviews.map((review) => {
      const cleanTitle = (review.title?.trim() || "Review Kontrak").replace(/\.docx$/i, "");
      return {
        ...review,
        displayTitle: cleanTitle,
        formattedDate: formatIndonesianDate(review.created_at),
        isCurrent: review.id === currentReviewId,
      };
    });
  }, [reviews, currentReviewId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-lg p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl",
          className
        )}
      >
        <DialogHeader className="px-5 pt-4 pb-2">
          <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSearch className="size-4 text-klarisa-secondary" />
            <span>Cari Review Kontrak</span>
          </DialogTitle>
        </DialogHeader>

        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-5 pb-3 pt-1 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berkas review kontrak..."
              className="pl-9 pr-9 text-xs h-9 w-full bg-slate-50/60 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800"
              autoFocus
            />
            {query && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="max-h-[360px] min-h-[140px] overflow-y-auto px-3 py-2 space-y-0.5"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="size-5 animate-spin text-klarisa-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-red-500 px-4">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center px-4">
              <FileSearch className="size-6 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {query
                  ? "Tidak ada review kontrak yang cocok"
                  : "Belum ada riwayat review kontrak"}
              </p>
              {query && (
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Coba gunakan kata kunci pencarian nama dokumen lain.
                </span>
              )}
            </div>
          ) : (
            <>
              {memoizedReviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => handleItemClick(review.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-xs transition-colors outline-none",
                    review.isCurrent
                      ? "bg-slate-100 dark:bg-slate-800 text-klarisa-primary font-medium"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileText
                      className={cn(
                        "size-3.5 shrink-0",
                        review.isCurrent
                          ? "text-klarisa-primary"
                          : "text-slate-400 dark:text-slate-500"
                      )}
                    />
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {review.displayTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {review.formattedDate && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {review.formattedDate}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {/* Lazy Pagination Sentinel & Loader */}
              {hasMore && !isLoadingMore && (
                <div ref={sentinelRef} className="h-1 w-full pointer-events-none" aria-hidden="true" />
              )}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-2 text-slate-400">
                  <Loader2 className="size-3.5 animate-spin text-klarisa-primary" />
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SearchReviewDialog;
