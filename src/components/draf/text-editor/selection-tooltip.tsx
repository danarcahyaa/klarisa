"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { BubbleMenu } from "@tiptap/react/menus";
import { CircleDotDashed, FileSearch } from "lucide-react";
import { ReviewMarkerPopover } from "./review-clause/review-marker-popover";
import { StartReviewPopover } from "./review-clause/start-review-popover";
import { ReviseMarkerPopover } from "./revise-clause/revise-marker-popover";
import {
  useSelectionTooltip,
  type UseSelectionTooltipOptions,
} from "@/hooks/useSelectionTooltip";
import {
  getHtmlForRange,
  getSelectionPopoverPlacement,
  hasReviseMarkInRange,
} from "@/lib/tip-tap.utils";

export type AskSelectionTooltipProps = UseSelectionTooltipOptions;

/**
 * Floating tooltip displayed above highlighted/selected text in the draft text editor.
 * Provides quick actions: Review / Lihat Review, Revise Clause, and Ask AI.
 */
export function SelectionTooltip(props: AskSelectionTooltipProps) {
  const { editor, onReviseClause, isRevisingClause } = props;

  const {
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
  } = useSelectionTooltip(props);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isReviseOpen, setIsReviseOpen] = useState(false);

  // Automatically dismiss popovers whenever the review popover is open or for existing reviews
  useEffect(() => {
    if (isReviewOpen || isExistingReview) {
      setIsOptionsOpen(false);
      setIsReviseOpen(false);
    }
  }, [isReviewOpen, isExistingReview]);

  const handleOptionsOpenChange = useCallback((open: boolean) => {
    setIsOptionsOpen(open);
    if (open) {
      setIsReviseOpen(false);
    }
  }, []);

  const frozenReviseTextRef = useRef<string>("");
  const frozenReviseHtmlRef = useRef<string>("");
  const frozenReviseRangeRef = useRef<{ from: number; to: number }>({ from: 0, to: 0 });

  const handleReviseOpenChange = useCallback(
    (open: boolean) => {
      setIsReviseOpen(open);
      if (open) {
        setIsOptionsOpen(false);
        if (editor) {
          const { from, to } = editor.state.selection;
          const text =
            selectedTextString ||
            editor.state.doc.textBetween(from, to, " ").trim();
          const html = getHtmlForRange(editor, from, to);
          frozenReviseTextRef.current = text;
          frozenReviseHtmlRef.current = html || text;
          frozenReviseRangeRef.current = { from, to };
        }
      }
    },
    [editor, selectedTextString]
  );

  const handleStartRevise = useCallback(
    (instruction?: string) => {
      if (!editor) return;
      setIsReviseOpen(false);
      setIsOptionsOpen(false);

      const targetRange = frozenReviseRangeRef.current;
      const from = targetRange.from !== targetRange.to ? targetRange.from : editor.state.selection.from;
      const to = targetRange.from !== targetRange.to ? targetRange.to : editor.state.selection.to;

      const selectedHtml =
        frozenReviseHtmlRef.current ||
        getHtmlForRange(editor, from, to) ||
        frozenReviseTextRef.current ||
        editor.state.doc.textBetween(from, to, " ").trim();

      if (selectedHtml) {
        // Provide saved review result as context if available
        const reviewContext = activeReviewResult?.result || undefined;
        onReviseClause?.(
          selectedHtml,
          instruction,
          activeHighlightId || undefined,
          reviewContext,
          from !== to ? { from, to } : undefined
        );
      }
    },
    [editor, onReviseClause, activeHighlightId, activeReviewResult]
  );

  const handleDeleteReviewWithCleanup = useCallback(() => {
    setIsOptionsOpen(false);
    setIsReviseOpen(false);
    handleDeleteReview();
  }, [handleDeleteReview]);

  const placement = getSelectionPopoverPlacement(editor, canvasBoundary);

  if (!editor || isForceHidden || isRevisingClause) return null;

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor: currentEditor, state, from, to }) => {
        if (isForceHidden || isRevisingClause) {
          return false;
        }
        if (isReviewOpen || isOptionsOpen || isReviseOpen) {
          return true;
        }
        if (!currentEditor.isEditable || state.selection.empty || from === to) {
          return false;
        }

        // Do not show selection tooltip if selection contains or touches a struck-through / revise clause
        if (hasReviseMarkInRange(currentEditor, from, to)) {
          return false;
        }

        const text = state.doc.textBetween(from, to, " ").trim();
        return text.length > 0;
      }}
    >

      {isForceHidden ? null : (
        <div
          className="not-prose z-[90] animate-in fade-in zoom-in-95 duration-150 w-fit"
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
              onOpenChange={handleOptionsOpenChange}
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
          <ReviseMarkerPopover
            open={isReviseOpen}
            onOpenChange={handleReviseOpenChange}
            side={placement.side}
            align={placement.align}
            collisionBoundary={canvasBoundary}
            selectedText={selectedTextString || frozenReviseTextRef.current}
            onStartRevise={handleStartRevise}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
            >
              <CircleDotDashed className="size-3.5 text-slate-500 shrink-0" />
              <span>Perbaiki Klausul</span>
            </button>
          </ReviseMarkerPopover>

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
