"use client";

import { Trash2 } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";

export interface DeleteConfirmDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

/**
 * Confirmation dialog shown before permanently deleting a draft.
 */
export function DeleteConfirmDialog({
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Batal menghapus draft"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-draft-title"
        aria-describedby="delete-draft-description"
        className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600">
          <Trash2 className="size-4" />
        </span>
        <h2
          id="delete-draft-title"
          className="mt-4 text-xl font-semibold tracking-[-.03em]"
        >
          Hapus draft ini?
        </h2>
        <p
          id="delete-draft-description"
          className="mt-2 text-xs leading-5 text-slate-500"
        >
          Draft, versi tersimpan, komentar, dan akses pihak terkait akan hapus
          permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={isLoading}
            onClick={onClose}
          >
            Batal
          </Button>
          <SubmitButton
            variant="destructive"
            size="sm"
            type="button"
            isLoading={isLoading}
            loadingText="Menghapus..."
            onClick={onConfirm}
            leftIcon={<Trash2 className="size-4" />}
          >
            Hapus permanen
          </SubmitButton>
        </div>
      </section>
    </div>
  );
}
