"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { BubbleMenu } from "@tiptap/react/menus";
import { CircleDotDashed, FileSearch } from "lucide-react";
import { ReviewMarkerPopover } from "./review-clause/review-marker-popover";
import { StartReviewPopover } from "./review-clause/start-review-popover";
import {
  useSelectionTooltip,
  type UseSelectionTooltipOptions,
} from "@/hooks/useSelectionTooltip";

export type AskSelectionTooltipProps = UseSelectionTooltipOptions;

/**
 * Floating tooltip displayed above highlighted/selected text in the draft text editor.
 * Provides quick actions: Review / Lihat Review, Revise Clause, and Ask AI.
 */
export function SelectionTooltip(props: AskSelectionTooltipProps) {
  const { editor } = props;

  const {
    isReviewOpen,
    isForceHidden,
    canvasBoundary,
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
  } = useSelectionTooltip(props);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Automatically dismiss options popover whenever the review popover is open or for existing reviews
  useEffect(() => {
    if (isReviewOpen || isExistingReview) {
      setIsOptionsOpen(false);
    }
  }, [isReviewOpen, isExistingReview]);

  const handleDeleteReviewWithCleanup = useCallback(() => {
    setIsOptionsOpen(false);
    handleDeleteReview();
  }, [handleDeleteReview]);

  // Dynamically calculate preferred side and alignment based on selection position within the canvas
  // to avoid collision detection flips and initial placement flashes
  const getPlacement = useCallback((): {
    side: "top" | "bottom";
    align: "start" | "center" | "end";
  } => {
    if (!editor || editor.isDestroyed) {
      return { side: "top", align: "center" };
    }
    try {
      const { from, to } = editor.state.selection;
      if (from === to) return { side: "top", align: "center" };
      const coords = editor.view.coordsAtPos(from);
      const canvasEl =
        canvasBoundary ||
        (editor.view.dom.closest("[data-editor-canvas]") as Element | null) ||
        editor.view.dom;
      const canvasRect = canvasEl?.getBoundingClientRect();

      let side: "top" | "bottom" = "top";
      let align: "start" | "center" | "end" = "center";

      if (canvasRect && coords) {
        const spaceAbove = coords.top - canvasRect.top;
        // If space above is less than 280px (approx popover min-height + offset), place on bottom
        if (spaceAbove < 280) {
          side = "bottom";
        }

        const spaceLeft = coords.left - canvasRect.left;
        const spaceRight = canvasRect.right - coords.right;
        if (spaceLeft < 200) {
          align = "start";
        } else if (spaceRight < 200) {
          align = "end";
        }
      }

      return { side, align };
    } catch {
      return { side: "top", align: "center" };
    }
  }, [editor, canvasBoundary]);

  const placement = getPlacement();

  if (!editor || isForceHidden) return null;

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor: currentEditor, state, from, to }) => {
        if (isForceHidden) {
          return false;
        }
        if (isReviewOpen || isOptionsOpen) {
          return true;
        }
        if (!currentEditor.isEditable || state.selection.empty || from === to) {
          return false;
        }
        const text = state.doc.textBetween(from, to, " ").trim();
        return text.length > 0;
      }}
    >
      {isForceHidden ? null : (
        <div
          className="not-prose z-[60] animate-in fade-in zoom-in-95 duration-150 w-fit"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
        <div className="relative flex items-center gap-0.5 rounded-md bg-slate-50 border border-input p-1">
          {/* Clause Review Section */}
          {isExistingReview || isReviewOpen ? (
            <ReviewMarkerPopover
              open={isReviewOpen}
              onOpenChange={handleReviewOpenChange}
              collisionBoundary={canvasBoundary}
              side={placement.side}
              align={placement.align}
              selectedText={selectedTextString}
              step={reviewStep}
              result={activeReviewResult}
              onStartReview={handleStartReview}
              onDeleteReview={handleDeleteReviewWithCleanup}
              showFooter={isExistingReview || saveReviewEnabled}
              onDismiss={() => {
                handleReviewOpenChange(false);
              }}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={handleReviewClick}
                className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
                title={isExistingReview ? "Hasil review klausul" : "Review klausul terpilih"}
              >
                <FileSearch className="size-3.5 text-slate-500 shrink-0" />
                <span>{isExistingReview ? "Hasil review" : "Review klausul"}</span>
              </button>
            </ReviewMarkerPopover>
          ) : (
            <StartReviewPopover
              open={isOptionsOpen}
              onOpenChange={setIsOptionsOpen}
              side={placement.side}
              align={placement.align}
              collisionBoundary={canvasBoundary}
              saveReviewEnabled={saveReviewEnabled}
              onToggleSaveReview={handleToggleSaveReview}
              onStartReview={handleStartNewReview}
            />
          )}

          {/* Divider */}
          <div className="h-3.5 w-px bg-slate-200 shrink-0" aria-hidden="true" />

          {/* 2. Revise Clause */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={handleReviseClauseClick}
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
          >
            <CircleDotDashed className="size-3.5 text-slate-500 shrink-0" />
            <span>Perbaiki Klausul</span>
          </button>

          {/* Divider */}
          <div className="h-3.5 w-px bg-slate-200 shrink-0" aria-hidden="true" />

          {/* 3. Ask AI */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={handleAskClick}
            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
          >
            <Image
              src="/klarisa/logo-ai.svg"
              alt="AI"
              width={16}
              height={16}
              className="size-3.5 object-contain shrink-0"
            />
          </button>

          {/* Tooltip triangle arrow pointing down */}
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45 border-r border-b border-input bg-slate-50 transition-colors"
            aria-hidden="true"
          />
        </div>
      </div>
      )}
    </BubbleMenu>
  );
}
