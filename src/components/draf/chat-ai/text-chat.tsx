"use client";

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, FileText } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn, formatIndonesianDate } from "@/lib/utils";

import type { ChatStatusStep } from "@/types/draft.type";

export interface TextChatProps {
  role: "user" | "ai";
  content?: React.ReactNode;
  children?: React.ReactNode;
  date?: string;
  className?: string;
  /** Size variant: 'default' for standard page layout, 'small' or 'sm' for compact sidebars */
  variant?: "default" | "small" | "sm";
  isShimmer?: boolean;
  statusSteps?: ChatStatusStep[];
  metadata?: Record<string, unknown> | null;
  /** Optional override to enable or disable collapsible truncation (only applies to user messages) */
  collapsible?: boolean;
}

/**
 * Text chat message component for displaying user queries and markdown-rendered AI responses
 * using Tailwind CSS typography classes directly. Supports auto-truncation for long user messages
 * with an expandable toggle button. AI-generated responses are always displayed completely.
 */
export function TextChat({
  role,
  content,
  children,
  date,
  className,
  variant = "default",
  isShimmer = false,
  statusSteps,
  metadata,
  collapsible,
}: TextChatProps) {
  const isUser = role === "user";
  const isSmall = variant === "small" || variant === "sm";
  const displayContent = content ?? children;
  const textToCopy = typeof displayContent === "string" ? displayContent : "";
  const displayDate = date ? formatIndonesianDate(date) : "";
  const draftId = metadata?.draft_id && typeof metadata.draft_id === "string" ? metadata.draft_id : null;
  const draftTitle = (metadata?.draft_title as string) || "Draf Kontrak";

  const isStringContent = typeof displayContent === "string";
  // Collapsing is only enabled for user messages; AI generated text is always shown completely
  const canCollapse = isUser && collapsible !== false;
  const hasLongContentInit =
    canCollapse &&
    isStringContent &&
    (displayContent.length > 280 || displayContent.split("\n").length > 5);

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(hasLongContentInit);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!canCollapse || isShimmer) {
      setIsOverflowing(false);
      return;
    }

    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      const maxHeightThreshold = 160;
      const hasLengthOverflow =
        isStringContent &&
        (displayContent.length > 280 || displayContent.split("\n").length > 5);

      setIsOverflowing(scrollHeight > maxHeightThreshold || hasLengthOverflow);
    }
  }, [displayContent, canCollapse, isShimmer, isStringContent]);

  return (
    <div
      className={cn(
        "group flex w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className={cn("flex flex-col", isUser ? "max-w-[85%] items-end" : "w-full items-start")}>
        {/* Render multi-phase status steps if present */}
        {!isUser && statusSteps && statusSteps.length > 0 && (
          <div className={cn("flex flex-col w-full", isSmall ? "gap-1.5 mb-1.5" : "gap-2 mb-2")}>
            {statusSteps.map((step, idx) => (
              <div
                key={idx}
                className={cn(
                  "leading-relaxed",
                  isSmall ? "text-xs" : "text-sm",
                  step.isShimmer
                    ? "animate-pulse font-medium text-slate-500 dark:text-slate-400"
                    : "font-medium text-slate-700 dark:text-slate-200"
                )}
              >
                {step.text}
              </div>
            ))}
          </div>
        )}

        {/* Main message content */}
        {Boolean(displayContent) && (
          <div
            className={cn(
              "leading-relaxed",
              isSmall ? "text-xs" : "text-sm",
              isUser
                ? cn(
                    "rounded-lg border border-input bg-white text-slate-900 whitespace-pre-wrap dark:bg-slate-900 dark:text-slate-100",
                    isSmall ? "px-3 py-2" : "px-4 py-3"
                  )
                : cn(
                    "w-full bg-transparent px-0 text-slate-800 prose prose-sm max-w-none dark:prose-invert dark:text-slate-100 [&_p]:leading-relaxed [&_p:last-child]:mb-0 [&_p]:whitespace-pre-line [&_ol]:list-decimal [&_ul]:list-disc",
                    isSmall
                      ? "text-xs [&_p]:text-xs [&_li]:text-xs [&_p]:mb-2"
                      : "text-sm [&_p]:mb-3",
                    isShimmer && "animate-pulse font-medium text-slate-500 dark:text-slate-400"
                  )
            )}
          >
            <div
              ref={contentRef}
              className={cn(
                "relative transition-all duration-300",
                canCollapse && isOverflowing && !isExpanded && "max-h-36 overflow-hidden"
              )}
            >
              {isUser ? (
                displayContent
              ) : typeof displayContent === "string" ? (
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              ) : (
                displayContent
              )}

              {/* Bottom gradient fade when collapsed */}
              {canCollapse && isOverflowing && !isExpanded && (
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none h-14 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80"
                />
              )}
            </div>

            {/* Expand / Collapse toggle button for long user messages */}
            {canCollapse && isOverflowing && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none cursor-pointer inline-flex items-center gap-1 select-none"
              >
                {isExpanded ? "Sembunyikan" : "Selengkapnya"}
              </button>
            )}
          </div>
        )}

        {/* Box container directing to the draft editor when a draft document has been generated */}
        {!isUser && !isShimmer && draftId && (
          <Link
            href={`/dashboard/draft/${draftId}`}
            className={`group/card mt-3 flex items-center justify-between gap-4 rounded-lg border border-slate-200  bg-white/80 hover:bg-white ${isSmall ? "p-2" : "p-3.5"} transition-all duration-200 dark:border-slate-800 dark:bg-transparent dark:hover:border-slate-700 dark:hover:bg-slate-800/60 max-w-md w-full`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10  shrink-0 items-center justify-center rounded-md bg-klarisa-primary/5 text-klarisa-navy border border-klarisa-primary/10 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                <FileText className={isSmall ? "size-4" : "size-5"}  />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`truncate ${isSmall ? "text-xs" : "text-sm"} font-medium text-slate-800  dark:text-slate-200 dark:group-hover/card:text-blue-400 transition-colors`}>
                  {draftTitle}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Buka dan edit draf di editor
                </span>
              </div>
            </div>
            <div className="shrink-0 text-slate-400 transition-colors pr-1">
              <ArrowUpRight className="size-4.5 group-hover/card:text-klarisa-navy transition-transform ease-in-out duration-300" />
            </div>
          </Link>
        )}

        {/* Footer: Date and Copy button (hidden while shimmer animation is active) */}
        {!isShimmer && (
          <div className="mt-1.5 flex items-center gap-1.5 text-slate-400">
            {isUser ? (
              <>
                {textToCopy && (
                  <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <CopyButton valueToCopy={textToCopy} />
                  </div>
                )}
                {displayDate && (
                  <span className="text-[11px] select-none text-slate-400">
                    {displayDate}
                  </span>
                )}
              </>
            ) : (
              <>
                {displayDate && (
                  <span className="text-[11px] select-none text-slate-400">
                    {displayDate}
                  </span>
                )}
                {textToCopy && (
                  <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <CopyButton valueToCopy={textToCopy} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TextChat;
