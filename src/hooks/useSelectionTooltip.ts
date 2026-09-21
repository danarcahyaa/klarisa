"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ClauseReviewItem,
  ReviewProcessStep,
  UseSelectionTooltipOptions,
  UseSelectionTooltipReturn,
} from "@/types/clause.type";
import {
  markClauseSelection,
  getSelectedHighlightId as getHighlightIdFromSelection,
  getTextForHighlightMark,
  removeHighlightMark,
  updateHighlightMarkAttrs,
  generateHighlightId,
} from "@/lib/tip-tap.utils";

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
  const [isForceHidden, setIsForceHidden] = useState(false);
  const isDeletingReviewRef = useRef(false);
  const [frozenReviewText, setFrozenReviewText] = useState("");
  const frozenReviewTextRef = useRef("");
  const [canvasBoundary, setCanvasBoundary] = useState<Element | null>(null);

  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [activeReviewResult, setActiveReviewResult] = useState<ClauseReviewItem | null>(null);
  const [reviewStep, setReviewStep] = useState<ReviewProcessStep | undefined>(undefined);

  // Persistence toggle state for clause review (stored in localStorage, default false)
  const [saveReviewEnabled, setSaveReviewEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("klarisa_save_clause_review");
        return stored === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const saveReviewEnabledRef = useRef(saveReviewEnabled);
  saveReviewEnabledRef.current = saveReviewEnabled;

  const handleToggleSaveReview = useCallback((enabled: boolean) => {
    setSaveReviewEnabled(enabled);
    saveReviewEnabledRef.current = enabled;
    try {
      localStorage.setItem("klarisa_save_clause_review", String(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

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
        return;
      }
    }
    if (typeof document !== "undefined") {
      const canvas =
        document.querySelector("[data-editor-canvas]") ||
        document.querySelector(".ProseMirror")?.parentElement;
      if (canvas) {
        setCanvasBoundary(canvas);
      }
    }
  }, [editor]);

  // Subscribe to editor selection changes so the tooltip state matches the currently selected range
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const handleSelectionUpdate = () => {
      // Do not re-enable tooltip while deletion is actively in progress
      if (isDeletingReviewRef.current) return;

      const { from, to } = editor.state.selection;
      if (from !== to) {
        setIsForceHidden(false);
      }
      setSelectionRange((prev) => {
        if (prev.from === from && prev.to === to) return prev;
        return { from, to };
      });

      // If user selected a different range while a review popover was open, dismiss the popover
      // NOTE: Only perform mark-containment check if saveReviewEnabled is true and mark exists.
      // If saveReviewEnabled is false, no mark is in the document, so do not dismiss on selection changes!
      if (activeHighlightIdRef.current && saveReviewEnabledRef.current) {
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
            removeHighlightMark(editor, activeHighlightIdRef.current, true);
          }
          setIsReviewOpen(false);
          setFrozenReviewText("");
          frozenReviewTextRef.current = "";
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
    return getHighlightIdFromSelection(editor, "data-review-id");
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
          frozenReviewTextRef.current = text;
          selectedTextStringRef.current = text;
        }

        // Check if current selection has an existing review
        const existingId = getSelectedHighlightId();
        if (existingId) {
          const saved = getReviewById?.(existingId);
          if (saved) {
            setActiveHighlightId(existingId);
            setActiveReviewResult(saved);
            // Prioritize the actual highlighted text currently in the document over saved result
            const highlightedTextInDoc = getTextForHighlightMark(editor, existingId, "data-review-id");
            const actualText = highlightedTextInDoc || saved.clauseText;
            setFrozenReviewText(actualText);
            frozenReviewTextRef.current = actualText;
            selectedTextStringRef.current = actualText;
            setReviewStep("completed");
            return;
          }
        }

        // If new clause review:
        // Generate a new highlight ID. Note: markClauseSelection is deferred to handleStartReview
        // so that TipTap document transactions don't disrupt Popover anchor measurement!
        const newId = generateHighlightId();
        if (newId) {
          setActiveHighlightId(newId);
          setActiveReviewResult(null);
          setReviewStep(undefined);
        }
      } else {
        setFrozenReviewText("");
        frozenReviewTextRef.current = "";
        setReviewStep(undefined);
        // If temporary mark was created but no review was saved, clean up mark
        if (
          activeHighlightIdRef.current &&
          !getReviewById?.(activeHighlightIdRef.current) &&
          editor
        ) {
          removeHighlightMark(editor, activeHighlightIdRef.current, true);
        }
        setActiveHighlightId(null);
        setActiveReviewResult(null);
      }
    },
    [editor, getSelectedHighlightId, getReviewById]
  );

  /**
   * Handles "Review" / "Lihat review" button click.
   * If viewing an existing review, opens the popover.
   * New reviews must be triggered exclusively from the "Mulai" button in the HoverCard.
   */
  const handleReviewClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isExistingReview && !isReviewOpen) {
        handleReviewOpenChange(true);
      }
    },
    [isExistingReview, isReviewOpen, handleReviewOpenChange]
  );

  /**
   * Explicitly starts a new clause review workflow from the "Mulai" button.
   */
  const handleStartNewReview = useCallback(() => {
    handleReviewOpenChange(true);
  }, [handleReviewOpenChange]);

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
    const text = frozenReviewTextRef.current || selectedTextStringRef.current;
    const shouldSave = saveReviewEnabledRef.current;

    if (fn && highlightId && text) {
      // If saving is enabled and mark not yet in document, attach mark now that popover is mounted
      if (shouldSave && editor) {
        const existingMarkId = getSelectedHighlightId();
        if (!existingMarkId) {
          markClauseSelection(editor, "data-review-id", { id: highlightId, preventAutosave: true });
        }
      }

      // Read text directly from the highlight mark in the editor document if available
      const markText = getTextForHighlightMark(editor, highlightId, "data-review-id");
      const text = markText || frozenReviewTextRef.current || selectedTextStringRef.current;

      const res = await fn(text, highlightId, shouldSave);
      if (res) {
        setActiveReviewResult(res);
        // If saved, update highlight mark in editor with data-has-risk, data-status, and class
        if (shouldSave && editor) {
          const hasRisk = Boolean(res.hasRisk);
          updateHighlightMarkAttrs(
            editor,
            highlightId,
            {
              "data-has-risk": String(hasRisk),
              ...(res.status ? { "data-status": res.status } : {}),
              class: hasRisk
                ? "review-clause-mark review-clause-risk"
                : "review-clause-mark review-clause-safe",
            },
            false
          );
        }
      } else {
        // If review failed, clean up temporary mark from editor immediately
        if (editor && shouldSave) {
          editor.commands.unsetHighlightMark(highlightId, true);
        }
        setActiveHighlightId(null);
        setActiveReviewResult(null);
        setIsReviewOpen(false);
      }
      return res;
    }
    return null;
  }, [editor, getSelectedHighlightId]);

  /**
   * Deletes the currently active review and dismisses floating tooltips.
   */
  const handleDeleteReview = useCallback(() => {
    isDeletingReviewRef.current = true;
    setIsForceHidden(true);
    setFrozenReviewText("");
    frozenReviewTextRef.current = "";
    setReviewStep(undefined);
    setIsReviewOpen(false);

    // 1. Immediately collapse editor selection to current end position and blur
    if (editor && !editor.isDestroyed) {
      try {
        const currentPos = editor.state.selection.to;
        editor.commands.setTextSelection(currentPos);
        editor.view.dom.blur();
      } catch {
        // Fallback ignored
      }
    }
    if (typeof window !== "undefined") {
      try {
        window.getSelection()?.removeAllRanges();
      } catch {
        // Fallback ignored
      }
    }

    // 2. Delete the active review and remove its mark from the document
    const highlightId = activeHighlightIdRef.current;
    if (highlightId) {
      onDeleteReviewRef.current?.(highlightId);
      setActiveHighlightId(null);
      setActiveReviewResult(null);
    }

    // 3. Reset deletion flag after next tick so subsequent user selections can show tooltip again
    setTimeout(() => {
      isDeletingReviewRef.current = false;
    }, 150);
  }, [editor]);

  return {
    isReviewOpen,
    isForceHidden,
    canvasBoundary,
    activeHighlightId,
    activeReviewResult,
    reviewStep,
    selectedTextString,
    isExistingReview,
    saveReviewEnabled,
    handleToggleSaveReview,
    handleStartNewReview,
    handleReviewOpenChange,
    handleReviewClick,
    handleReviseClauseClick,
    handleAskClick,
    handleStartReview,
    handleDeleteReview,
  };
}
