"use client";

import React, { useMemo } from "react";
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActionPopover,
  type PopoverActionItem,
} from "@/components/ui/action-popover";
import { cn } from "@/lib/utils";

export interface ContractSearchItemPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDraft: boolean;
  isPinned?: boolean;
  onPinClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenRename: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  trigger?: React.ReactNode;
}

/**
 * ContractSearchItemPopover provides the action popover menu for an individual contract search item,
 * featuring pin/unpin, rename, and delete actions built on top of the reusable ActionPopover.
 */
export function ContractSearchItemPopover({
  isOpen,
  onOpenChange,
  isDraft,
  isPinned,
  onPinClick,
  onOpenRename,
  onOpenDelete,
  trigger,
}: ContractSearchItemPopoverProps) {
  const items = useMemo<PopoverActionItem[]>(
    () => [
      {
        text: isPinned ? "Lepas Semat" : "Sematkan",
        icon: isPinned ? (
          <PinOff className="size-3.5" />
        ) : (
          <Pin className="size-3.5" />
        ),
        onClick: onPinClick,
      },
      {
        text: "Ganti Nama",
        icon: <Pencil className="size-3.5" />,
        onClick: onOpenRename,
      },
    ],
    [isPinned, onPinClick, onOpenRename]
  );

  const footer = useMemo<PopoverActionItem>(
    () => ({
      text: "Hapus",
      icon: <Trash2 className="size-3.5" />,
      variant: "destructive",
      onClick: onOpenDelete,
    }),
    [onOpenDelete]
  );

  const defaultTrigger = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn(
        "size-7 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
        isOpen ? "inline-flex" : "hidden group-hover:inline-flex"
      )}
      aria-label="Opsi dokumen"
    >
      <MoreVertical className="size-4 text-slate-500" />
    </Button>
  );

  return (
    <div className="flex items-center">
      {/* Default view: <em> badge ("Draft" / "Review"). Hidden on hover or when popover is open */}
      <em
        className={cn(
          "shrink-0 text-xs font-medium not-italic transition-all",
          isOpen ? "hidden" : "group-hover:hidden",
          isDraft ? "text-klarisa-secondary" : "text-red-500"
        )}
      >
        {isDraft ? "Draft" : "Review"}
      </em>

      {/* Popover action menu */}
      <ActionPopover
        trigger={trigger || defaultTrigger}
        items={items}
        footer={footer}
        open={isOpen}
        onOpenChange={onOpenChange}
        align="end"
        sideOffset={4}
        className="w-36"
      />
    </div>
  );
}

export const ContractSearchItemActionPopover = ContractSearchItemPopover;
