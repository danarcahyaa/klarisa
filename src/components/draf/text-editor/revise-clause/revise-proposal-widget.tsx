"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviseClauseResult } from "@/types/revise-clause.type";
import { cn } from "@/lib/utils";

interface ReviseProposalWidgetProps {
  revision: ReviseClauseResult;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Interactive revision proposal card rendered adjacent to the struck-through original clause.
 * Displays the revised clause formatted with a soft green background, accompanied by Check and X action buttons.
 */
export function ReviseProposalWidget({
  revision,
  onAccept,
  onReject,
  className,
  style,
}: ReviseProposalWidgetProps) {
  const getBadgeText = (type: string) => {
    switch (type) {
      case "VIOLATES_LAW":
        return "Penyesuaian Regulasi";
      case "UNFAIR_ONE_SIDED":
        return "Penyelarasan Seimbang";
      case "INCOMPLETE":
        return "Pelengkapan Klausul";
      case "SAFE":
        return "Penyempurnaan Redaksi";
      case "AMBIGUOUS":
        return "Perumusan Ulang";
      default:
        return "Hasil Revisi";
    }
  };

  return (
    <div
      data-revise-proposal-widget
      style={style}
      className={cn(
        "z-30 my-2.5 max-w-full rounded-lg border border-emerald-300/90 bg-emerald-50/95 dark:bg-emerald-950/80 dark:border-emerald-800/80 shadow-md p-3 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 select-text",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              {getBadgeText(revision.type)}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Klausul Revisi yang Diusulkan:
            </span>
          </div>

          {/* Rendered HTML revision clause */}
          <div
            className="prose prose-sm max-w-none text-xs leading-relaxed text-emerald-950 dark:text-emerald-100 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 font-sans"
            dangerouslySetInnerHTML={{ __html: revision.revision_clause }}
          />
        </div>

        {/* Action buttons: Accept (Check) and Reject (X) */}
        <div className="flex items-center gap-1.5 shrink-0 self-start pt-0.5">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={onReject}
            title="Tolak / Batalkan revisi"
            className="size-7 p-0 rounded-full text-slate-500 hover:text-red-700 hover:bg-red-100 dark:text-slate-400 dark:hover:text-red-300 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
          >
            <X className="size-4" />
            <span className="sr-only">Tolak</span>
          </Button>

          <Button
            type="button"
            size="xs"
            onClick={onAccept}
            title="Terapkan revisi ini ke dokumen"
            className="size-7 p-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Check className="size-4" />
            <span className="sr-only">Terapkan</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
