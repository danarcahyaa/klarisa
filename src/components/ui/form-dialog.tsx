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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FormDialogProps {
  /** Controls open state of the dialog */
  open: boolean;
  /** Callback fired when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Label/type of the item being renamed (e.g. "Percakapan", "Kontrak", "Dokumen") */
  item?: string;
  /** Initial name/title value */
  defaultValue?: string;
  /** Optional controlled name value */
  value?: string;
  /** Optional custom title override. Defaults to `Ganti Nama ${item}` */
  title?: React.ReactNode;
  /** Optional custom description override. Defaults to `Masukkan nama baru untuk ${item.toLowerCase()} ini.` */
  description?: React.ReactNode;
  /** Custom placeholder for the input field */
  placeholder?: string;
  /** Indicates whether the save action is currently loading/processing */
  isLoading?: boolean;
  /** Loading text displayed on confirm button during save. Defaults to "Menyimpan..." */
  loadingText?: string;
  /** Submit button label. Defaults to "Simpan" */
  confirmText?: string;
  /** Cancel button label. Defaults to "Batal" */
  cancelText?: string;
  /** Maximum length for the input value */
  maxLength?: number;
  /**
   * Async or sync callback fired when user confirms the new name.
   * Returning false prevents the dialog from automatically closing.
   */
  onConfirm: (newName: string) => void | boolean | Promise<void | boolean>;
  /** Optional callback fired when cancel button is clicked */
  onCancel?: () => void;
  /** Optional custom CSS classes for dialog content */
  className?: string;
  /** Optional custom CSS classes for the input field */
  inputClassName?: string;
}

/**
 * Reusable dialog component for renaming items (contracts, chats, documents).
 * Handles input synchronization, empty state validation, and loading indicators.
 */
export function FormDialog({
  open,
  onOpenChange,
  item = "Item",
  defaultValue = "",
  value,
  title,
  description,
  placeholder,
  isLoading,
  loadingText = "Menyimpan...",
  confirmText = "Simpan",
  cancelText = "Batal",
  maxLength,
  onConfirm,
  onCancel,
  className,
  inputClassName,
}: FormDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(value ?? defaultValue);

  const isSubmitting = isLoading ?? internalLoading;

  // Sync input value when dialog opens or default value changes
  React.useEffect(() => {
    if (open) {
      setNameInput(value ?? defaultValue ?? "");
      setInternalLoading(false);
    }
  }, [open, value, defaultValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed || isSubmitting) return;

    try {
      const result = onConfirm(trimmed);
      if (result instanceof Promise) {
        setInternalLoading(true);
        const resolved = await result;
        if (resolved !== false) {
          onOpenChange(false);
        }
      } else if (result !== false) {
        onOpenChange(false);
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

  const resolvedItemLabel = item.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? () => {} : onOpenChange}>
      <DialogContent
        showCloseButton={!isSubmitting}
        className={cn("sm:max-w-md max-w-sm", className)}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title ?? ``}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {description ?? ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={placeholder ?? `Masukkan nama ${resolvedItemLabel}...`}
              disabled={isSubmitting}
              autoFocus
              maxLength={maxLength}
              className={cn("text-xs h-9", inputClassName)}
            />
          </div>

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
              type="submit"
              size="sm"
              disabled={isSubmitting || !nameInput.trim()}
              isLoading={isSubmitting}
              loadingText={loadingText}
              className="text-xs h-8"
            >
              {confirmText}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

