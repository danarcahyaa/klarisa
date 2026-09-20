"use client";

import { useState, useEffect } from "react";
import { Check, Copy, RotateCcw, Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClauseReviewResult } from "@/types/clause.type";

export type { ClauseReviewResult };

export interface ReviewResultStepProps {
  /** Structured AI analysis review result data */
  result: ClauseReviewResult;
  /** Callback triggered when user clicks 'Review ulang' */
  onReReview?: () => void;
  /** Callback triggered when user clicks 'Hapus review' */
  onDeleteReview?: () => void;
  /** Optional custom CSS classes for the container */
  className?: string;
}

/**
 * Step 3 component for clause review popover:
 * Displays findings, legal reasoning, relevant statutory references,
 * copy action, 'Selengkapnya' toggle for long results, and footer buttons.
 */
export function ReviewResultStep({
  result,
  onReReview,
  onDeleteReview,
  className,
}: ReviewResultStepProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const reasoningText = result.result || result.reasoning || "";
  const isLongText = reasoningText.length > 200;

  // Reset expansion state if the displayed review result changes
  useEffect(() => {
    setIsExpanded(false);
  }, [reasoningText]);

  /**
   * Copies review reasoning text to clipboard.
   */
  const handleCopyReview = async () => {
    if (!reasoningText) return;
    try {
      await navigator.clipboard.writeText(reasoningText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  return (
    <div
      className={cn(
        "flex-1 min-h-0 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200",
        className
      )}
    >
      {/* Scrollable Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {/* Findings & Legal Reasoning */}
        <div className="group relative space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-klarisa-navy">
              Hasil Review
            </h4>
            <button
              type="button"
              onClick={handleCopyReview}
              className={cn(
                "p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition-opacity inline-flex items-center gap-1",
                isCopied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              title="Salin hasil review"
              aria-label="Salin hasil review"
            >
              {isCopied ? (
                <Check className="size-3 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
          <div>
            <p
              className={cn(
                "text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line",
                !isExpanded && isLongText && "line-clamp-4"
              )}
            >
              {reasoningText}
            </p>
            {isLongText && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="mt-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                {isExpanded ? "Tutup" : "Selengkapnya"}
              </button>
            )}
          </div>
        </div>

        {/* Statutory References */}
        {result.references && result.references.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="text-xs font-medium text-klarisa-navy">
              Rujukan Undang-Undang
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {result.references.map((ref, idx) => {
                const regCode = ref.code || ref.name || ref.title || "";
                const artNum = ref.article_number
                  ? ref.article_number.toLowerCase().startsWith("pasal")
                    ? ref.article_number
                    : `Pasal ${ref.article_number}`
                  : "";
                const label =
                  regCode && artNum
                    ? `${regCode} (${artNum})`
                    : regCode || artNum || `Rujukan ${idx + 1}`;
                const fullDesc = ref.content
                  ? `${regCode ? `${regCode} - ` : ""}${artNum ? `${artNum}: ` : ""}${ref.content}`
                  : label;

                return (
                  <Badge
                    key={idx}
                    variant="klarisa-tertiary"
                    className="text-[10px] font-medium h-auto py-0.5 px-2 gap-1 max-w-full"
                    title={fullDesc}
                  >
                    <Scale className="size-3 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Action Footer: Review ulang & Hapus review */}
      <div className="sticky bottom-0 z-10 shrink-0 bg-white dark:bg-slate-900 flex items-center justify-end gap-2 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDeleteReview}
        >
          <Trash2 className="size-3" />
          <span>Hapus</span>
        </Button>

        <Button
          type="button"
          size="xs"
          onClick={onReReview}
        >
          <RotateCcw className="size-3" />
          <span>Review ulang</span>
        </Button>
      </div>
    </div>
  );
}
