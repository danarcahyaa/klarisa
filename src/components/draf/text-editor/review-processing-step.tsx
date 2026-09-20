"use client";

import React from "react";
import { Check } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ReviewProcessingPhase =
  | "fetching_regulations"
  | "reviewing_clause"
  | "completed";

export interface ReviewProcessingStepProps {
  /** Current active sub-phase of the review process */
  processingPhase: ReviewProcessingPhase;
  /** Optional custom CSS classes for the container */
  className?: string;
}

/**
 * Step 2 component for clause review popover:
 * Displays sequential progress indicators (retrieving regulations -> reviewing clause).
 * Each step transitions from a spinner to a green check icon upon completion.
 */
export function ReviewProcessingStep({
  processingPhase,
  className,
}: ReviewProcessingStepProps) {
  return (
    <div
      className={cn(
        "min-h-[175px] py-3 px-1 flex flex-col justify-start space-y-4 animate-in fade-in duration-200",
        className
      )}
    >
      {/* 1. Regulation Retrieval Step */}
      <Marker role="status" className="items-center gap-2.5">
        <MarkerIcon>
          {processingPhase === "fetching_regulations" ? (
            <Spinner size="sm" />
          ) : (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
          )}
        </MarkerIcon>
        <MarkerContent className="text-xs">
          {processingPhase === "fetching_regulations" ? (
            <span className="shimmer">Mengambil regulasi terkait...</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              Regulasi terkait ditemukan
            </span>
          )}
        </MarkerContent>
      </Marker>

      {/* 2. Clause Review Step */}
      {processingPhase !== "fetching_regulations" && (
        <Marker role="status" className="items-center gap-2.5 animate-in fade-in duration-200">
          <MarkerIcon>
            {processingPhase === "completed" ? (
              <Check className="size-4 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
            ) : (
              <Spinner size="sm" />
            )}
          </MarkerIcon>
          <MarkerContent className="text-xs">
            {processingPhase === "completed" ? (
              <span className="text-slate-500 dark:text-slate-400">
                Klausul selesai di-review
              </span>
            ) : (
              <span className="shimmer">Klausul sedang di-review...</span>
            )}
          </MarkerContent>
        </Marker>
      )}
    </div>
  );
}
