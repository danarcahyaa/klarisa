"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  UseReviewMarkerOptions,
  UseReviewMarkerReturn,
  ReviewProcessStep,
  ReviewProcessingPhase,
  ClauseReviewResult,
} from "@/types/clause.type";

export type { UseReviewMarkerOptions, UseReviewMarkerReturn };

/**
 * Custom hook to manage review marker popover state, step progression,
 * boundary detection, and execution workflows.
 */
export function useReviewMarker({
  selectedText,
  open: controlledOpen,
  onOpenChange,
  step: controlledStep,
  result: customResult,
  onDismiss,
  collisionBoundary: customBoundary,
  onReReview,
  onDeleteReview,
  onStartReview,
}: UseReviewMarkerOptions = {}): UseReviewMarkerReturn {
  // Controlled vs uncontrolled open state
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Controlled vs internal review process step
  const [internalStep, setInternalStep] = useState<ReviewProcessStep>("preparing");
  const currentStep = controlledStep ?? internalStep;

  // Processing sub-phase for sequential progression
  const [processingPhase, setProcessingPhase] =
    useState<ReviewProcessingPhase>("fetching_regulations");

  const [internalBoundary, setInternalBoundary] = useState<Element | null>(null);
  const [internalResult, setInternalResult] = useState<ClauseReviewResult | null>(null);

  // Automatically locate the document canvas boundary to keep popover within bounds
  useEffect(() => {
    if (typeof document !== "undefined") {
      const el =
        document.querySelector("[data-editor-canvas]") ||
        document.querySelector(".ProseMirror")?.parentElement;
      if (el) {
        setInternalBoundary(el);
      }
    }
  }, [isOpen]);

  const activeBoundary = customBoundary ?? internalBoundary;

  // Active result data (uses custom result if provided, else internal result from live review)
  const currentResult: ClauseReviewResult | null =
    customResult ?? internalResult ?? null;

  const onStartReviewRef = useRef(onStartReview);
  onStartReviewRef.current = onStartReview;
  const hasTriggeredRef = useRef(false);

  /**
   * Explicitly closes the popover when the user clicks the close 'x' button or review fails.
   */
  const handleClose = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onDismiss?.();
  }, [isControlled, onOpenChange, onDismiss]);

  /**
   * Resets and executes the review workflow (live review if onStartReview provided, else timer simulation).
   */
  const runReviewWorkflow = useCallback(async () => {
    setInternalStep("preparing");
    setProcessingPhase("fetching_regulations");

    const reviewPromise = onStartReviewRef.current
      ? onStartReviewRef.current()
      : Promise.resolve(null);

    // Phase 1 -> Phase 2: preparing -> processing
    await new Promise((r) => setTimeout(r, 600));
    setInternalStep("processing");

    // Phase 2a: fetching regulations
    await new Promise((r) => setTimeout(r, 1200));
    setProcessingPhase("reviewing_clause");

    try {
      const reviewResult = await reviewPromise;
      if (reviewResult) {
        setInternalResult(reviewResult as any);
        // Phase 2b: clause reviewed -> checkmarks
        setProcessingPhase("completed");
        await new Promise((r) => setTimeout(r, 450));
        setInternalStep("completed");
      } else {
        // Review failed; dismiss popover
        handleClose();
      }
    } catch (err) {
      console.error("[useReviewMarker] Review execution error:", err);
      handleClose();
    }
  }, [handleClose]);

  // Trigger review workflow on popover open only once per open session when step is not externally controlled
  useEffect(() => {
    if (isOpen && controlledStep === undefined) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        runReviewWorkflow();
      }
    } else if (!isOpen) {
      hasTriggeredRef.current = false;
    }
  }, [isOpen, controlledStep, runReviewWorkflow]);

  // Preserve selected text so that if editor selection collapses/changes during review,
  // the text displayed in the header does not disappear.
  const [cachedSelectedText, setCachedSelectedText] = useState(selectedText);

  useEffect(() => {
    if (selectedText) {
      setCachedSelectedText(selectedText);
    }
  }, [selectedText]);

  const activeText = selectedText || cachedSelectedText;

  /**
   * Handles popover open state change from Radix.
   */
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
      if (!nextOpen) {
        onDismiss?.();
      }
    },
    [isControlled, onOpenChange, onDismiss]
  );

  /**
   * Handles re-review action from result footer.
   */
  const handleReReview = useCallback(() => {
    if (onReReview) {
      onReReview();
    } else {
      runReviewWorkflow();
    }
  }, [onReReview, runReviewWorkflow]);

  /**
   * Handles deleting review from result footer.
   */
  const handleDeleteReview = useCallback(() => {
    onDeleteReview?.();
    handleClose();
  }, [onDeleteReview, handleClose]);

  return {
    isOpen,
    currentStep,
    processingPhase,
    activeBoundary,
    currentResult,
    activeText,
    handleClose,
    handleOpenChange,
    handleReReview,
    handleDeleteReview,
  };
}
