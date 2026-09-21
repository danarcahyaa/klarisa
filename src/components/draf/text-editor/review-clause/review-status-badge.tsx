"use client";

import React from "react";
import { AlertTriangle, FileQuestion, HelpCircle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClauseReviewStatus } from "@/types/clause.type";

export interface ReviewStatusBadgeProps {
  /** Categorized review status */
  status?: ClauseReviewStatus;
  /** Whether the clause has risk (used for legacy fallback) */
  hasRisk?: boolean;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Visual badge displaying the categorized status of a clause review:
 * - "AMBIGUOUS": Blue badge ("Ambigu")
 * - "VIOLATES_LAW": Red badge ("Melanggar Hukum")
 * - "UNFAIR_ONE_SIDED": Amber badge ("Berat Sebelah")
 * - "INCOMPLETE": Orange badge ("Belum Lengkap")
 */
export function ReviewStatusBadge({
  status,
  hasRisk,
  className,
}: ReviewStatusBadgeProps) {
  // Do not render a badge on popover for SAFE status
  if (status === "SAFE") {
    return null;
  }

  if (status === "AMBIGUOUS") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900",
          className
        )}
      >
        <HelpCircle className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Ambigu</span>
      </span>
    );
  }

  if (status === "VIOLATES_LAW") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900",
          className
        )}
      >
        <AlertTriangle className="size-3 text-red-600 dark:text-red-400 shrink-0" />
        <span>Melanggar Hukum</span>
      </span>
    );
  }

  if (status === "UNFAIR_ONE_SIDED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
          className
        )}
      >
        <Scale className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Berat Sebelah</span>
      </span>
    );
  }

  if (status === "INCOMPLETE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900",
          className
        )}
      >
        <FileQuestion className="size-3 text-orange-600 dark:text-orange-400 shrink-0" />
        <span>Belum Lengkap</span>
      </span>
    );
  }

  // Fallback for legacy saved review items without explicit status
  if (hasRisk !== undefined) {
    return hasRisk ? (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900",
          className
        )}
      >
        <AlertTriangle className="size-3 text-red-600 dark:text-red-400 shrink-0" />
        <span>Melanggar Hukum</span>
      </span>
    ) : (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900",
          className
        )}
      >
        <HelpCircle className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Ambigu</span>
      </span>
    );
  }

  return null;
}
