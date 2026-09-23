"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export interface DeleteDialogProps {
  /** Controls open state of the dialog */
  open: boolean;
  /** Callback fired when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Label/name of the item to be deleted (e.g. "Percakapan", "Draf Kontrak") */
  item?: string;
  /** Optional custom title override. Defaults to `Hapus "[item]"` */
  title?: React.ReactNode;
  /** Optional custom description override. Defaults to `"[item]" akan dihapus secara permanen dan tidak dapat dikembalikan.` */
  description?: React.ReactNode;
  /** Whether the item placeholder should be wrapped in quotes. Defaults to true. */
  withQuotes?: boolean;
  /** Indicates whether the delete action is currently loading/processing */
  isLoading?: boolean;
  /** Loading text displayed on confirm button during deletion. Defaults to "Menghapus..." */
  loadingText?: string;
  /** Confirm button label. Defaults to "Hapus" */
  confirmText?: string;
  /** Cancel button label. Defaults to "Batal" */
  cancelText?: string;
  /** Async or sync callback fired when confirm delete button is clicked */
  onConfirm: () => void | Promise<void>;
  /** Optional callback fired when cancel button is clicked */
  onCancel?: () => void;
  /** Optional custom CSS classes for dialog content */
  className?: string;
}

/**
 * Reusable delete confirmation dialog component.
 * Displays title with item placeholder, description with bold item placeholder,
 * and handles loading state on confirmation action.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  item = "",
  title,
  description,
  isLoading,
  loadingText = "Menghapus...",
  confirmText = "Hapus",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  className,
}: DeleteDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isSubmitting = isLoading ?? internalLoading;


  const handleConfirm = async () => {
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? () => {} : onOpenChange}>
      <DialogContent
        showCloseButton={!isSubmitting}
        className={cn("sm:max-w-md max-w-sm", className)}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold line-clamp-1 text-slate-900 dark:text-slate-100">
            {title ?? `Hapus ${item}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {description ?? (
              <>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                  "{item}"
                </strong>{" "}
                akan dihapus secara permanen dan tidak dapat dikembalikan.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="text-xs h-8"
          >
            {cancelText}
          </Button>
          <SubmitButton
            type="button"
            variant="destructive"
            size="sm"
            isLoading={isSubmitting}
            loadingText={loadingText}
            onClick={handleConfirm}
            className="text-xs h-8"
          >
            {confirmText}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
