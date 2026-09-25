"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Pin } from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils";
import {
  ContractSearchItemActionPopover,
  ContractSearchItemPopover,
} from "./contract-search-item-popover";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { FormDialog } from "@/components/ui/form-dialog";

export type SearchItem = {
  id: string;
  type: "draft" | "review";
  title: string;
  isPinned?: boolean;
  createdAt?: string;
  updatedAt: string;
  riskCount: number;
  metadata: {
    comments?: number;
    version?: number;
  };
};

export interface ContractSearchItemProps {
  /** The contract or review document item to render */
  item: SearchItem;
  /** Callback fired when Pin option is selected */
  onPin?: (item: SearchItem) => void;
  /** Callback fired when Rename option is confirmed */
  onRename?: (
    item: SearchItem,
    newTitle: string
  ) => Promise<boolean | void> | boolean | void;
  /** Callback fired when Delete option is confirmed */
  onDelete?: (
    item: SearchItem
  ) => Promise<boolean | void> | boolean | void;
}

/**
 * ContractSearchItem component renders an individual document item row
 * with title, creation date, type badge, pin status, and a hover 3-dots action menu.
 */
export function ContractSearchItem({
  item,
  onPin,
  onRename,
  onDelete,
}: ContractSearchItemProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isDraft = item.type === "draft";
  const href = isDraft
    ? `/dashboard/draft/${item.id}`
    : `/dashboard/review/result/${item.id}`;

  const dateValue = item.createdAt ?? item.updatedAt;
  const formattedDate = useMemo(() => {
    return formatIndonesianDate(dateValue);
  }, [dateValue]);

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(false);
    onPin?.(item);
  };

  const handleOpenRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(false);
    setIsRenameOpen(true);
  };

  const handleConfirmRename = async (newTitle: string) => {
    return await onRename?.(item, newTitle);
  };

  const handleOpenDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(false);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    const res = await onDelete?.(item);
    if (res !== false) {
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="group flex items-center justify-between gap-3 border-b border-slate-200 py-3 text-slate-700 transition-colors hover:bg-slate-50/50">
        <Link
          href={href}
          className="grid min-w-0 flex-1 gap-1 py-0.5 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
        >
          <b className="truncate text-sm font-medium text-slate-800 flex items-center gap-1.5">
            {item.isPinned && (
              <Pin
                className="size-3.5 shrink-0"
                aria-label="Disematkan"
              />
            )}
            <span className="truncate">{item.title}</span>
          </b>
          <small className="text-xs text-slate-400">{formattedDate}</small>
        </Link>

        <div className="flex items-center justify-end shrink-0 min-w-[50px]">
          <ContractSearchItemActionPopover
            isOpen={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            isDraft={isDraft}
            isPinned={item.isPinned}
            onPinClick={handlePinClick}
            onOpenRename={handleOpenRename}
            onOpenDelete={handleOpenDelete}
          />
        </div>
      </div>

      {/* Rename Contract Dialog */}
      <FormDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        title="Ganti Nama Kontrak"
        item="Kontrak"
        defaultValue={item.title}
        onConfirm={handleConfirmRename}
      />

      {/* Reusable Delete Contract Dialog */}
      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        item={item.title}
        title="Hapus Kontrak"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
