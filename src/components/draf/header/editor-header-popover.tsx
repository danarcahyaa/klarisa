"use client";

import React from "react";
import { Pencil, Share2, Trash2, EllipsisVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface EditorHeaderPopoverProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRename?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  trigger?: React.ReactNode;
}

/**
 * Popover menu for EditorHeader containing document options: Ganti nama, Bagikan, Hapus.
 */
export function EditorHeaderPopover({
  isOpen,
  onOpenChange,
  onRename,
  onShare,
  onDelete,
  trigger,
}: EditorHeaderPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="xs" aria-label="Opsi dokumen">
            <EllipsisVertical className="size-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-40 p-1.5 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onRename}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 text-left cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            <Pencil className="size-3.5 text-slate-500 shrink-0" />
            <span>Ganti nama</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 text-left cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            <Share2 className="size-3.5 text-slate-500 shrink-0" />
            <span>Bagikan</span>
          </button>

          <div className="my-0.5 h-px bg-slate-100" />

          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 text-left cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            <Trash2 className="size-3.5 text-red-500 shrink-0" />
            <span>Hapus</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
