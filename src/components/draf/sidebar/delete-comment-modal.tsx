"use client";

import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { Button, SubmitButton } from "@/components/ui/button";

export interface DeleteCommentModalProps {
  label: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCommentModal({
  label,
  isPending,
  onCancel,
  onConfirm,
}: DeleteCommentModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Batal menghapus komentar"
        onClick={onCancel}
        className="absolute inset-0"
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-comment-title"
        aria-describedby="delete-comment-description"
        className="relative w-full max-w-xs rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <span className="grid size-9 place-items-center rounded-full bg-red-50 text-red-600">
          <Trash2 className="size-4" />
        </span>
        <h2
          id="delete-comment-title"
          className="mt-3 text-lg font-semibold tracking-[-.03em]"
        >
          Hapus {label}?
        </h2>
        <p
          id="delete-comment-description"
          className="mt-1.5 text-xs leading-5 text-slate-500"
        >
          Sorotan diskusi pada teks sumber juga akan dihapus.
        </p>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={isPending}
            onClick={onCancel}
          >
            Batal
          </Button>
          <SubmitButton
            variant="destructive"
            size="sm"
            type="button"
            isLoading={isPending}
            loadingText="Menghapus..."
            onClick={onConfirm}
          >
            Hapus
          </SubmitButton>
        </div>
      </section>
    </div>,
    document.body,
  );
}
