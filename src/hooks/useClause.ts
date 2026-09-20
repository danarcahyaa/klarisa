"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  reviewClauseAction,
  saveClauseReviewsAction,
  deleteClauseReviewAction,
} from "@/app/actions/clause.action";
import type {
  ClauseReviewItem,
  UseClauseOptions,
  UseClauseReturn,
} from "@/types/clause.type";

export type { UseClauseOptions, UseClauseReturn };

/**
 * Custom hook managing clause review operations for contract drafts:
 * - Handles AI clause review invocation (reviewClauseAction).
 * - Handles review deletion and editor mark unsetting (deleteClauseReviewAction).
 * - Manages reviews array state in memory without redundant SELECT queries.
 * - Automatically detects when marked review ranges are deleted from the editor,
 *   pruning them from memory and syncing to database via debounce.
 */
export function useClause({
  contractId,
  initialReviews = null,
  editor = null,
  onReviewsChange,
}: UseClauseOptions = {}): UseClauseReturn {
  const [reviews, setReviews] = useState<ClauseReviewItem[]>(
    initialReviews || []
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  // References to track latest reviews without recreating callbacks
  const reviewsRef = useRef<ClauseReviewItem[]>(reviews);
  reviewsRef.current = reviews;

  const lastSavedReviewsRef = useRef<ClauseReviewItem[]>(reviews);
  const isInitializedRef = useRef(false);

  // Debounced reviews value to sync deletions to the database
  const debouncedReviews = useDebounce(reviews, 400);

  /**
   * Synchronizes highlight marks in the editor document with the valid review items:
   * 1. If reviews list is empty, removes ALL clause review marks from the editor document.
   * 2. If reviews list has items, removes any highlight marks whose id is not in the reviews list.
   * 3. Prunes any review items from state & database whose highlight marks are missing from the editor document.
   */
  const syncReviewsAndHighlights = useCallback(
    (targetReviews: ClauseReviewItem[]) => {
      if (!editor || editor.isDestroyed || editor.isEmpty) return;

      const validReviewIds = new Set(targetReviews.map((r) => r.id));
      const { tr } = editor.state;
      let hasRemovals = false;
      const existingMarkIdsInDoc = new Set<string>();

      tr.doc.descendants((node: any, pos: number) => {
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            if (mark.attrs?.id) {
              if (!validReviewIds.has(mark.attrs.id)) {
                // Remove orphaned review mark from editor
                tr.removeMark(pos, pos + node.nodeSize, mark);
                hasRemovals = true;
              } else {
                existingMarkIdsInDoc.add(mark.attrs.id);
              }
            }
          });
        }
      });

      if (hasRemovals) {
        editor.view.dispatch(tr);
      }

      // Check if any review item in state is missing its mark in the editor document
      const remainingReviews = targetReviews.filter((r) =>
        existingMarkIdsInDoc.has(r.id)
      );

      if (remainingReviews.length !== targetReviews.length) {
        setReviews(remainingReviews);
        reviewsRef.current = remainingReviews;
        lastSavedReviewsRef.current = remainingReviews;
        if (contractId) {
          saveClauseReviewsAction(contractId, remainingReviews).catch((err) => {
            console.error("[useClause] Stale review prune save error:", err);
          });
        }
      }
    },
    [editor, contractId]
  );

  // Sync initial reviews prop changes and synchronize editor highlights
  useEffect(() => {
    if (initialReviews === null || initialReviews === undefined) return;

    setReviews(initialReviews);
    reviewsRef.current = initialReviews;
    lastSavedReviewsRef.current = initialReviews;

    if (!editor || editor.isDestroyed) return;

    if (!editor.isEmpty) {
      isInitializedRef.current = true;
      syncReviewsAndHighlights(initialReviews);
    } else {
      // If editor content hasn't loaded yet, wait for the first update transaction
      const handleEditorReady = () => {
        if (!editor.isEmpty) {
          isInitializedRef.current = true;
          syncReviewsAndHighlights(reviewsRef.current);
        }
      };
      editor.once("update", handleEditorReady);
      return () => {
        editor.off("update", handleEditorReady);
      };
    }
  }, [editor, initialReviews, syncReviewsAndHighlights]);

  // Handle case where editor finishes loading content after reviews were already initialized
  useEffect(() => {
    if (!editor || isInitializedRef.current) return;
    if (initialReviews === null || initialReviews === undefined) return;

    if (!editor.isEmpty) {
      isInitializedRef.current = true;
      syncReviewsAndHighlights(reviewsRef.current);
    }
  }, [editor, initialReviews, syncReviewsAndHighlights]);

  // Monitor editor document changes to detect deleted review mark ranges during user editing
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (!isInitializedRef.current || reviewsRef.current.length === 0) return;

      const existingMarkIds = new Set<string>();
      editor.state.doc.descendants((node) => {
        node.marks?.forEach((mark) => {
          if (mark.attrs?.id) {
            existingMarkIds.add(mark.attrs.id);
          }
        });
      });

      // Filter out reviews whose mark ID no longer exists anywhere in the document
      const remaining = reviewsRef.current.filter((r) =>
        existingMarkIds.has(r.id)
      );
      if (remaining.length < reviewsRef.current.length) {
        setReviews(remaining);
        reviewsRef.current = remaining;
      }
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  // Sync debounced review deletions to database
  useEffect(() => {
    if (!contractId || !isInitializedRef.current) return;

    const currentSerialized = JSON.stringify(debouncedReviews);
    const lastSavedSerialized = JSON.stringify(lastSavedReviewsRef.current);

    if (currentSerialized !== lastSavedSerialized) {
      lastSavedReviewsRef.current = debouncedReviews;
      saveClauseReviewsAction(contractId, debouncedReviews).catch((err) => {
        console.error("[useClause] Failed to sync deleted reviews:", err);
      });
      onReviewsChange?.(debouncedReviews);
    }
  }, [debouncedReviews, contractId, onReviewsChange]);

  /**
   * Invokes AI clause review workflow and saves result to database.
   */
  const handleReviewClause = useCallback(
    async (
      clauseText: string,
      highlightId: string
    ): Promise<ClauseReviewItem | null> => {
      if (!contractId) {
        setReviewError("ID kontrak tidak valid.");
        return null;
      }

      setIsReviewing(true);
      setReviewError(null);

      try {
        const response = await reviewClauseAction({
          contractId,
          clauseText,
          highlightId,
          currentReviews: reviewsRef.current,
        });

        if (response.success && response.data) {
          const newReview = response.data.review;
          const updatedReviews = response.data.reviews;
          setReviews(updatedReviews);
          reviewsRef.current = updatedReviews;
          lastSavedReviewsRef.current = updatedReviews;
          return newReview;
        } else {
          const errorMsg = response.error || "Gagal mereview klausul.";
          setReviewError(errorMsg);
          toast.error(errorMsg);
          return null;
        }
      } catch (err) {
        console.error("[useClause] Error in reviewClause:", err);
        const errorMsg = "Terjadi kesalahan saat memproses review klausul.";
        setReviewError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setIsReviewing(false);
      }
    },
    [contractId]
  );

  /**
   * Deletes a review by its highlight ID and removes mark from editor.
   */
  const handleDeleteReview = useCallback(
    async (highlightId: string): Promise<boolean> => {
      if (!contractId) return false;

      setIsDeletingReview(true);
      try {
        //  Remove mark from editor document (allow autosave to persist clean content)
        if (editor) {
          (editor.chain() as any).unsetHighlightMark(highlightId, false).run();
        }

        // Remove review from local state
        const nextReviews = reviewsRef.current.filter((r) => r.id !== highlightId);
        setReviews(nextReviews);
        reviewsRef.current = nextReviews;
        lastSavedReviewsRef.current = nextReviews;

        // Persist to database
        const res = await deleteClauseReviewAction(
          {
            contractId,
            clauseId: highlightId,
          },
          reviewsRef.current
        );

        return res.success;
      } catch (err) {
        console.error("[useClause] Error deleting review:", err);
        return false;
      } finally {
        setIsDeletingReview(false);
      }
    },
    [contractId, editor]
  );

  /**
   * Manually saves an updated reviews array directly to database.
   */
  const handleSaveReviews = useCallback(
    async (updatedReviews: ClauseReviewItem[]): Promise<boolean> => {
      if (!contractId) return false;

      try {
        setReviews(updatedReviews);
        reviewsRef.current = updatedReviews;
        lastSavedReviewsRef.current = updatedReviews;

        const res = await saveClauseReviewsAction(contractId, updatedReviews);
        return res.success;
      } catch (err) {
        console.error("[useClause] Error saving reviews:", err);
        return false;
      }
    },
    [contractId]
  );

  /**
   * Looks up a saved review item by its highlight mark ID.
   */
  const getReviewById = useCallback(
    (highlightId: string): ClauseReviewItem | null => {
      return reviewsRef.current.find((r) => r.id === highlightId) || null;
    },
    []
  );

  return {
    reviews,
    isReviewing,
    isDeletingReview,
    reviewError,
    activeReviewId,
    setActiveReviewId,
    handleReviewClause,
    handleDeleteReview,
    handleSaveReviews,
    getReviewById,
  };
}
