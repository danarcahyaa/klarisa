"use client";

import React, { useMemo } from "react";
import { Pencil, Share2, Trash2, EllipsisVertical } from "lucide-react";
import {
  ActionPopover,
  type PopoverActionItem,
} from "@/components/ui/action-popover";
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
 * Popover action menu for EditorHeader containing document options: Ganti nama, Bagikan, Hapus.
 * Built using the reusable ActionPopover component.
 */
export function EditorHeaderPopover({
  isOpen,
  onOpenChange,
  onRename,
  onShare,
  onDelete,
  trigger,
}: EditorHeaderPopoverProps) {
  const items = useMemo<PopoverActionItem[]>(
    () => [
      {
        text: "Ganti nama",
        icon: <Pencil className="size-3.5" />,
        onClick: onRename,
      },
      {
        text: "Bagikan",
        icon: <Share2 className="size-3.5" />,
        onClick: onShare,
      },
    ],
    [onRename, onShare]
  );

  const footer = useMemo<PopoverActionItem | undefined>(
    () =>
      onDelete
        ? {
            text: "Hapus",
            icon: <Trash2 className="size-3.5" />,
            variant: "destructive",
            onClick: onDelete,
          }
        : undefined,
    [onDelete]
  );

  const defaultTrigger = (
    <Button variant="ghost" size="xs" aria-label="Opsi dokumen">
      <EllipsisVertical className="size-4" />
    </Button>
  );

  return (
    <ActionPopover
      trigger={trigger || defaultTrigger}
      items={items}
      footer={footer}
      open={isOpen}
      onOpenChange={onOpenChange}
      align="end"
      className="w-40"
    />
  );
}

export const EditorHeaderActionPopover = EditorHeaderPopover;

