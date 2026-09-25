"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Pen, X, CircleDotDashed, Info } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tiptap-ui-primitive/tooltip";

export interface ReviseMarkerPopoverProps {
  /** Controls open state of the popover */
  open?: boolean;
  /** Callback triggered when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Preferred placement side */
  side?: "top" | "bottom";
  /** Preferred alignment */
  align?: "start" | "center" | "end";
  /** Boundary element to constrain popover within */
  collisionBoundary?: Element | null | Array<Element | null>;
  /** Selected clause text to display */
  selectedText?: string;
  /** Callback triggered when user clicks 'Mulai' */
  onStartRevise?: (instruction?: string) => void;

  /** Optional custom trigger element */
  children?: React.ReactNode;
}

/**
 * Popover component displayed when initiating a clause revision workflow.
 * Layout:
 * - Header: Title + optional selected clause preview quote.
 * - Left: Ghost xs button with a pen icon that toggles the revision instruction input.
 * - Center (when toggled): Input component from UI folder to type additional instructions.
 * - Right: "Mulai" button that defaults to flexible full width and adapts dynamically when the input is shown.
 */
export function ReviseMarkerPopover({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  side = "top",
  align = "center",
  collisionBoundary,
  selectedText,
  onStartRevise,
  children,
}: ReviseMarkerPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const [showInput, setShowInput] = useState(false);
  const [instruction, setInstruction] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      controlledOnOpenChange?.(nextOpen);
    },
    [isControlled, controlledOnOpenChange]
  );

  // Reset internal input state whenever popover closes
  useEffect(() => {
    if (!isOpen) {
      setShowInput(false);
      setInstruction("");
    }
  }, [isOpen]);

  const handleStartRevise = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    handleOpenChange(false);
    const trimmed = instruction.trim();
    requestAnimationFrame(() => {
      onStartRevise?.(trimmed || undefined);
    });
  };

  const handleToggleInput = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowInput((prev) => {
      const nextState = !prev;
      if (!nextState) {
        setInstruction("");
      }
      return nextState;
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children || (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
            title="Perbaiki klausul terpilih"
          >
            <CircleDotDashed className="size-3.5 text-slate-500 shrink-0" />
            <span>Perbaiki Klausul</span>
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
        className="z-[90] w-72 sm:w-80 max-w-[calc(100vw-32px)] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg"
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
        <div className="space-y-1 mb-4 p-1">

          <div className="text-xs flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <span>Perbaiki Klausul</span>
            <Tooltip placement="top">
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-full focus:outline-none cursor-pointer"
                  aria-label="Informasi Perbaiki Klausul"
                >
                  <Info className="size-3.5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                className="z-[9999] max-w-[260px] p-2.5 text-left rounded-sm bg-slate-900 text-white dark:bg-slate-800 border border-slate-700/50"
              >
                <div className="flex flex-col gap-1.5 justify-start text-[11px] leading-relaxed text-slate-200 font-normal">
                  <span>Jika terdapat hasil review pada klausul yang Anda pilih, maka perbaikan akan disesuaikan dengan konteks review tersebut.</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Klausul Anda akan disesuaikan dengan konteks regulasi dan diperbaiki secara otomatis.
            </p>
        </div>
        <div className="flex items-center gap-1.5 w-full">
          {/* Left button: ghost xs with Pen icon */}
        
        <Button
            type="button"
            variant="ghost"
            size="xs"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleInput}
            title={showInput ? "Tutup input instruksi" : "Tambah instruksi perbaikan"}
            className={cn(
              "shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer",
              showInput && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
            )}
          >
            {showInput ? <X className="size-3.5" /> : <Pen className="size-3.5" />}
        </Button>
        
          {/* displayed when showInput is true */}
          {showInput && (
            <Input
              ref={inputRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleStartRevise();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setShowInput(false);
                  setInstruction("");
                }
              }}
              placeholder="Ketik instruksi tambahan..."
              className="h-8 text-xs py-1 px-2.5 flex-1 min-w-0 bg-transparent border-slate-200 dark:border-slate-700"
            />
          )}

          {/* Flexible Mulai button: full-width by default, adapts dynamically when input appears */}
          <Button
            type="button"
            size="xs"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleStartRevise}
            className={cn(
              "cursor-pointer transition-all",
              showInput ? "shrink-0 px-3" : "flex-1 w-full"
            )}
          >
            Mulai
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
