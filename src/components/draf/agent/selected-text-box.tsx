"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectedTextBoxProps {
  /** Text content of the active selection */
  selectedText?: string | null;
  /** Whether the text spans multiple lines to render a gradient fade */
  isMultiLine?: boolean;
  /** Callback ref for measuring element height and line clamp */
  setSelectedTextRef?: (node: HTMLDivElement | null) => void;
  /** Callback to dismiss the selected text */
  onDismiss?: () => void;
  /** Optional container class name */
  className?: string;
}

/**
 * Component to display the active text selection pill in the Agent Panel
 * with multi-line gradient fade and dismiss button.
 */
export function SelectedTextBox({
  selectedText,
  isMultiLine: externalIsMultiLine,
  setSelectedTextRef: externalSetRef,
  onDismiss,
  className,
}: SelectedTextBoxProps) {
  const [internalIsMultiLine, setInternalIsMultiLine] = useState(false);
  const internalRef = useRef<HTMLDivElement | null>(null);

  const isMultiLine =
    externalIsMultiLine !== undefined ? externalIsMultiLine : internalIsMultiLine;

  const handleRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (node && externalIsMultiLine === undefined) {
        setInternalIsMultiLine(node.scrollHeight > 24);
      }
      externalSetRef?.(node);
    },
    [externalIsMultiLine, externalSetRef]
  );

  useEffect(() => {
    if (!selectedText || !internalRef.current || externalIsMultiLine !== undefined) return;
    const el = internalRef.current;
    const observer = new ResizeObserver(() => {
      setInternalIsMultiLine(el.scrollHeight > 24);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedText, externalIsMultiLine]);

  if (!selectedText) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full mb-2 rounded-lg bg-slate-100 border border-slate-200 p-2.5 text-left text-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 dark:bg-slate-900 dark:border-slate-800",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="relative flex-1 min-w-0">
          <div
            ref={handleRef}
            className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed dark:text-slate-300"
          >
            {selectedText}
          </div>
          {isMultiLine && (
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-15 max-h-[60%] bg-gradient-to-t from-slate-100 via-slate-100/50 to-transparent dark:from-slate-900 dark:via-slate-900/50" />
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 -mt-1 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer shrink-0 relative z-10 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          title="Hapus teks terpilih"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
