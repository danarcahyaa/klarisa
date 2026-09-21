"use client";

import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { X, FileSearch } from "lucide-react";
import { ReviewPrepareStep } from "./review-prepare-step";
import { ReviewProcessingStep } from "./review-processing-step";
import { ReviewResultStep } from "./review-result-step";
import { useReviewMarker } from "@/hooks/useReviewMarker";
import type {
  ReviewMarkerPopoverProps,
  ReviewProcessStep,
  ReviewProcessingPhase,
  ClauseReviewResult,
} from "@/types/clause.type";

// Re-export modular step components and types for external use
export { ReviewPrepareStep } from "./review-prepare-step";
export { ReviewProcessingStep } from "./review-processing-step";
export { ReviewResultStep } from "./review-result-step";
export { ReviewStatusBadge, type ReviewStatusBadgeProps } from "./review-status-badge";
export { StartReviewPopover, type StartReviewPopoverProps } from "./start-review-popover";
export type {
  ReviewProcessStep,
  ReviewProcessingPhase,
  ClauseReviewResult,
  ReviewMarkerPopoverProps,
};

/**
 * Popover component that displays the interactive clause review process.
 * Progression:
 * 1. Preparing State: Centered loading spinner.
 * 2. Processing State: Sequential progress indicators with spinners and checkmarks.
 * 3. Completed State: Structured AI review results with action button (Hapus review).
 */
export function ReviewMarkerPopover(props: ReviewMarkerPopoverProps) {
  const { children, side = "top", align = "center" } = props;
  const {
    isOpen,
    currentStep,
    processingPhase,
    activeBoundary,
    currentResult,
    activeText,
    showFooter,
    handleClose,
    handleOpenChange,
    handleDeleteReview,
  } = useReviewMarker(props);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      {children && <PopoverTrigger asChild>{children}</PopoverTrigger>}

      <PopoverContent
        align={align}
        side={side}
        sideOffset={10}
        avoidCollisions={true}
        collisionBoundary={activeBoundary}
        collisionPadding={16}
        sticky="always"
        onPointerDown={(e) => {
          // Prevent click/pointer events from bubbling to editor canvas
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Prevent focus shifts that would cause editor blur and trigger BubbleMenu hide
          const target = e.target as HTMLElement | null;
          const isInteractiveInput =
            target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.isContentEditable;
          if (!isInteractiveInput) {
            e.preventDefault();
          }
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevent click from bubbling to editor canvas
          e.stopPropagation();
        }}
        className="z-[60] w-[360px] sm:w-[400px] max-w-[92vw] max-h-[min(480px,85vh)] min-h-[220px] p-0 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 flex flex-col overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 flex items-start justify-between gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mt-0.5">
              <FileSearch className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              {activeText ? (
                <p
                  className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug"
                  title={activeText}
                >
                  &ldquo;{activeText}&rdquo;
                </p>
              ) : (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Review Klausul
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Tutup"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Preparing */}
        {currentStep === "preparing" && (
          <div className="flex-1 min-h-[175px] p-4 flex items-center justify-center">
            <ReviewPrepareStep />
          </div>
        )}

        {/* Processing */}
        {currentStep === "processing" && (
          <div className="flex-1 min-h-[175px] p-4 flex flex-col justify-center">
            <ReviewProcessingStep processingPhase={processingPhase} />
          </div>
        )}

        {/* Completed (AI Result view with scrollable body & sticky footer) */}
        {currentStep === "completed" && currentResult && (
          <ReviewResultStep
            result={currentResult}
            showFooter={showFooter}
            onDeleteReview={handleDeleteReview}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
