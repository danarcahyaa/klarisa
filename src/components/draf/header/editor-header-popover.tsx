"use client";

import React, { useMemo } from "react";
import { Pencil, FileDown, Trash2, EllipsisVertical } from "lucide-react";
import {
  ActionPopover,
  type PopoverActionItem,
} from "@/components/ui/action-popover";
import { Button } from "@/components/ui/button";

export interface EditorHeaderPopoverProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRename?: () => void;
  onExportDocx?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  trigger?: React.ReactNode;
}

/**
 * Popover action menu for EditorHeader containing document options: Ganti nama, Export DOCX, Hapus.
 * Built using the reusable ActionPopover component.
 */
export function EditorHeaderPopover({
  isOpen,
  onOpenChange,
  onRename,
  onExportDocx,
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
        text: "Export DOCX",
        icon: <FileDown className="size-3.5" />,
        onClick: onExportDocx,
      },
    ],
    [onRename, onExportDocx]
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
      className="z-[90] w-40"
    />
  );
}

export const EditorHeaderActionPopover = EditorHeaderPopover;

