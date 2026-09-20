"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ClauseReviewItem,
  ReviewProcessStep,
  UseSelectionTooltipOptions,
  UseSelectionTooltipReturn,
} from "@/types/clause.type";

export type { UseSelectionTooltipOptions, UseSelectionTooltipReturn };

/**
 * Custom hook to manage the state, actions, and popover transitions for the SelectionTooltip.
 * - Detects canvas boundary for tooltip and popover positioning.
 * - Listens for clicks on highlighted clauses to select the range and show the standard selection tooltip.
 * - Differentiates between new clause review and existing saved reviews ("Review klausul" vs "Lihat review").
 * - Provides handlers for Ask AI, Revise Clause, and Review operations.
 */
export function useSelectionTooltip({
  editor,
  onAsk,
  onReviseClause,
  onReviewClause,
  onDeleteReview,
  getReviewById,
}: UseSelectionTooltipOptions): UseSelectionTooltipReturn {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [frozenReviewText, setFrozenReviewText] = useState("");
  const [canvasBoundary, setCanvasBoundary] = useState<Element | null>(null);

  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [activeReviewResult, setActiveReviewResult] = useState<ClauseReviewItem | null>(null);
  const [reviewStep, setReviewStep] = useState<ReviewProcessStep | undefined>(undefined);

  // References to keep callbacks stable
  const activeHighlightIdRef = useRef(activeHighlightId);
  activeHighlightIdRef.current = activeHighlightId;

  const onReviewClauseRef = useRef(onReviewClause);
  onReviewClauseRef.current = onReviewClause;

  const onDeleteReviewRef = useRef(onDeleteReview);
  onDeleteReviewRef.current = onDeleteReview;

  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number }>({ from: 0, to: 0 });

  // Locate the scrollable editor canvas element to constrain the popover within
  useEffect(() => {
    if (editor?.view?.dom) {
      const canvas =
        editor.view.dom.closest("[data-editor-canvas]") ||
        editor.view.dom.parentElement;
      if (canvas) {
        setCanvasBoundary(canvas);
      }
    }
  }, [editor]);

  // Subscribe to editor selection changes so the tooltip state matches the currently selected range
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      setSelectionRange((prev) => {
        if (prev.from === from && prev.to === to) return prev;
        return { from, to };
      });

      // If user selected a different range while a review popover was open, dismiss the popover
      if (activeHighlightIdRef.current) {
        let selectionContainsActiveHighlight = false;
        if (from !== to) {
          editor.state.doc.nodesBetween(from, to, (node) => {
            if (node.isText && node.marks) {
              for (const mark of node.marks) {
                if (mark.attrs?.id === activeHighlightIdRef.current) {
                  selectionContainsActiveHighlight = true;
                  return false;
                }
              }
            }
          });
        }

        if (!selectionContainsActiveHighlight) {
          // If transient mark was not saved, clean it up
          if (!getReviewById?.(activeHighlightIdRef.current)) {
            editor.commands.unsetHighlightMark(activeHighlightIdRef.current, true);
          }
          setIsReviewOpen(false);
          setFrozenReviewText("");
          setActiveHighlightId(null);
          setActiveReviewResult(null);
          setReviewStep(undefined);
        }
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, getReviewById]);

  /**
   * Helper to find existing review ID strictly within the active text selection range.
   * Only resolves when user has selected a range of text (from !== to).
   * Identifies clause review marks directly by their unique id attribute.
   */
  const getSelectedHighlightId = useCallback((): string | null => {
    if (!editor) return null;
    const { from, to } = editor.state.selection;
    if (from === to) return null;

    let foundId: string | null = null;
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText && node.marks) {
        for (const mark of node.marks) {
          if (mark.attrs?.id) {
            foundId = mark.attrs.id;
            return false;
          }
        }
      }
    });

    return foundId;
  }, [editor]);

  const selectedHighlightId = getSelectedHighlightId();
  const existingReview = selectedHighlightId ? getReviewById?.(selectedHighlightId) : null;
  const isExistingReview = !!existingReview;

  const selectedTextString =
    frozenReviewText ||
    (editor
      ? editor.state.doc
          .textBetween(editor.state.selection.from, editor.state.selection.to, " ")
          .trim()
      : "");

  const selectedTextStringRef = useRef(selectedTextString);
  selectedTextStringRef.current = selectedTextString;

  const handleReviewOpenChange = useCallback(
    (open: boolean) => {
      setIsReviewOpen(open);
      if (open) {
        if (!editor) return;
        const text = editor.state.doc
          .textBetween(editor.state.selection.from, editor.state.selection.to, " ")
          .trim();
        if (text) {
          setFrozenReviewText(text);
        }

        // Check if current selection has an existing review
        const existingId = getSelectedHighlightId();
        if (existingId) {
          const saved = getReviewById?.(existingId);
          if (saved) {
            setActiveHighlightId(existingId);
            setActiveReviewResult(saved);
            setFrozenReviewText(saved.clauseText);
            setReviewStep("completed");
            return;
          }
        }

        // If new clause review, generate ID and apply mark
        const newId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `id-${Date.now()}`;
        setActiveHighlightId(newId);
        setActiveReviewResult(null);
        setReviewStep(undefined);

        (editor.chain() as any).setHighlight({ id: newId }).run();
      } else {
        setFrozenReviewText("");
        setReviewStep(undefined);
        // If temporary mark was created but no review was saved, clean up mark
        if (
          activeHighlightIdRef.current &&
          !getReviewById?.(activeHighlightIdRef.current) &&
          editor
        ) {
          editor.commands.unsetHighlightMark(activeHighlightIdRef.current, true);
        }
        setActiveHighlightId(null);
        setActiveReviewResult(null);
      }
    },
    [editor, getSelectedHighlightId, getReviewById]
  );

  /**
   * Handles "Review" / "Lihat review" button click.
   */
  const handleReviewClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isReviewOpen) {
        handleReviewOpenChange(true);
      }
    },
    [isReviewOpen, handleReviewOpenChange]
  );

  /**
   * Handles "Revise Clause" action on the selected text.
   */
  const handleReviseClauseClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!editor) return;
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ").trim();
      if (selectedText) {
        onReviseClause?.(selectedText);
      }
    },
    [editor, onReviseClause]
  );

  /**
   * Handles "Ask" action on the selected text.
   */
  const handleAskClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!editor) return;
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ").trim();
      if (selectedText) {
        const highlightId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `id-${Date.now()}`;

        (editor.chain() as any)
          .setMeta("preventAutosave", true)
          .setHighlight({ id: highlightId })
          .setTextSelection(to)
          .run();

        onAsk(selectedText, highlightId);
      }
    },
    [editor, onAsk]
  );

  /**
   * Executes AI review when popover starts workflow.
   */
  const handleStartReview = useCallback(async (): Promise<ClauseReviewItem | null> => {
    const fn = onReviewClauseRef.current;
    const highlightId = activeHighlightIdRef.current;
    const text = selectedTextStringRef.current;

    if (fn && highlightId && text) {
      const res = await fn(text, highlightId);
      if (res) {
        setActiveReviewResult(res);
      } else {
        // If review failed, clean up temporary mark from editor immediately
        if (editor) {
          editor.commands.unsetHighlightMark(highlightId, true);
        }
        setActiveHighlightId(null);
        setActiveReviewResult(null);
        setIsReviewOpen(false);
      }
      return res;
    }
    return null;
  }, [editor]);

  /**
   * Re-executes AI review on user demand from result footer.
   */
  const handleReReview = useCallback(() => {
    const fn = onReviewClauseRef.current;
    const highlightId = activeHighlightIdRef.current;
    const text = selectedTextStringRef.current;

    if (fn && highlightId && text) {
      setReviewStep("preparing");
      fn(text, highlightId).then((res) => {
        if (res) {
          setActiveReviewResult(res);
          setReviewStep("completed");
        } else {
          // Revert to completed step to maintain view of existing review
          setReviewStep("completed");
        }
      });
    }
  }, []);

  /**
   * Deletes the currently active review.
   */
  const handleDeleteReview = useCallback(() => {
    const highlightId = activeHighlightIdRef.current;
    if (highlightId) {
      onDeleteReviewRef.current?.(highlightId);
      setActiveHighlightId(null);
      setActiveReviewResult(null);
    }
    setIsReviewOpen(false);
  }, []);

  return {
    isReviewOpen,
    canvasBoundary,
    activeHighlightId,
    activeReviewResult,
    reviewStep,
    selectedTextString,
    isExistingReview,
    handleReviewOpenChange,
    handleReviewClick,
    handleReviseClauseClick,
    handleAskClick,
    handleStartReview,
    handleReReview,
    handleDeleteReview,
  };
}
