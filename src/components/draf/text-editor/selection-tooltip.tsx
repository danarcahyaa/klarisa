"use client";

import Image from "next/image";
import { BubbleMenu } from "@tiptap/react/menus";
import { CircleDotDashed, FileSearch } from "lucide-react";
import { ReviewMarkerPopover } from "./review-clause/review-marker-popover";
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
    canvasBoundary,
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
  } = useSelectionTooltip(props);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor: currentEditor, state, from, to }) => {
        if (isReviewOpen) {
          return true;
        }
        if (!currentEditor.isEditable || state.selection.empty || from === to) {
          return false;
        }
        const text = state.doc.textBetween(from, to, " ").trim();
        return text.length > 0;
      }}
    >
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
          {/* Clause Review / Detail Review */}
          <ReviewMarkerPopover
            open={isReviewOpen}
            onOpenChange={handleReviewOpenChange}
            collisionBoundary={canvasBoundary}
            selectedText={selectedTextString}
            step={reviewStep}
            result={activeReviewResult}
            onStartReview={handleStartReview}
            onReReview={handleReReview}
            onDeleteReview={handleDeleteReview}
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
    </BubbleMenu>
  );
}
