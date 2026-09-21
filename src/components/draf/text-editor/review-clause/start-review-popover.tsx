"use client";

import React from "react";
import { FileSearch } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export interface StartReviewPopoverProps {
  /** Controls open state of popover */
  open: boolean;
  /** Callback triggered when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Preferred placement side */
  side?: "top" | "bottom";
  /** Preferred alignment */
  align?: "start" | "center" | "end";
  /** Boundary element to constrain popover within */
  collisionBoundary?: Element | null | Array<Element | null>;
  /** Whether the save review option is enabled */
  saveReviewEnabled: boolean;
  /** Callback when save review toggle is changed */
  onToggleSaveReview: (enabled: boolean) => void;
  /** Callback triggered when user clicks 'Mulai review' */
  onStartReview: () => void;
  /** Optional custom trigger element */
  children?: React.ReactNode;
}

/**
 * Popover component displayed when initiating a new clause review from the text editor selection.
 * Allows toggling review persistence ("Simpan Review") before starting the review process.
 */
export function StartReviewPopover({
  open,
  onOpenChange,
  side = "top",
  align = "center",
  collisionBoundary,
  saveReviewEnabled,
  onToggleSaveReview,
  onStartReview,
  children,
}: StartReviewPopoverProps) {
  const handleStartReviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
    requestAnimationFrame(() => {
      onStartReview();
    });
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children || (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
            title="Review klausul terpilih"
          >
            <FileSearch className="size-3.5 text-slate-500 shrink-0" />
            <span>Review klausul</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={10}
        avoidCollisions={true}
        collisionBoundary={collisionBoundary}
        collisionPadding={16}
        sticky="always"
        className="z-[60] w-72 max-w-[calc(100vw-32px)] p-3 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Simpan Review
          </h4>
          <Switch
            id="toggle-save-clause-review"
            checked={saveReviewEnabled}
            onCheckedChange={onToggleSaveReview}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Simpan Review"
          />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Dengan mengaktifkan ini, hasil dari review akan disimpan dan ditandai pada editor Anda.
        </p>
        <div className="pt-1 flex justify-end">
          <Button
            type="button"
            size="xs"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleStartReviewClick}
            className="w-full font-medium cursor-pointer"
          >
            Mulai review
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
