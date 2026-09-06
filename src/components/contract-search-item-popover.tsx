"use client";

import React from "react";
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ContractSearchItemPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDraft: boolean;
  isPinned?: boolean;
  onPinClick: (e: React.MouseEvent) => void;
  onOpenRename: (e: React.MouseEvent) => void;
  onOpenDelete: (e: React.MouseEvent) => void;
}

export function ContractSearchItemPopover({
  isOpen,
  onOpenChange,
  isDraft,
  isPinned,
  onPinClick,
  onOpenRename,
  onOpenDelete,
}: ContractSearchItemPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      {/* Default view: <em> badge ("Draft" / "Review"). Hidden on hover or when popover is open */}
      <em
        className={`shrink-0 text-xs font-medium not-italic transition-all ${
          isOpen ? "hidden" : "group-hover:hidden"
        } ${isDraft ? "text-klarisa-secondary" : "text-red-500"}`}
      >
        {isDraft ? "Draft" : "Review"}
      </em>

      {/* Hover / Active view: 3 vertical dots button */}
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={`size-7 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
            isOpen ? "inline-flex" : "hidden group-hover:inline-flex"
          }`}
          aria-label="Opsi dokumen"
        >
          <MoreVertical className="size-4 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-36 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onPinClick}
            className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 text-left cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            {isPinned ? (
              <>
                <PinOff className="size-3.5 text-slate-500 shrink-0" />
                <span>Lepas Semat</span>
              </>
            ) : (
              <>
                <Pin className="size-3.5 text-slate-500 shrink-0" />
                <span>Sematkan</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenRename}
            className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 text-left cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            <Pencil className="size-3.5 text-slate-500 shrink-0" />
            <span>Ganti Nama</span>
          </button>
          <div className="my-0.5 h-px bg-slate-100" />
          <button
            type="button"
            onClick={onOpenDelete}
            className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 text-left cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            <Trash2 className="size-3.5 text-red-500 shrink-0" />
            <span>Hapus</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
