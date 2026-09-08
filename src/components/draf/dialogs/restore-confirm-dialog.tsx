"use client";

import { RotateCcw } from "lucide-react";
import type { DraftVersionContent } from "@/types/contract.type";
import { Button, SubmitButton } from "@/components/ui/button";

export interface RestoreConfirmDialogProps {
  version: DraftVersionContent;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

/**
 * Confirmation dialog shown before restoring a draft to a previous version.
 */
export function RestoreConfirmDialog({
  version,
  onCancel,
  onConfirm,
  isLoading,
}: RestoreConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Batal memulihkan versi"
        onClick={onCancel}
        className="absolute inset-0"
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restore-version-title"
        aria-describedby="restore-version-description"
        className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <span className="grid size-10 place-items-center rounded-full bg-[#edf2ff] text-klarisa-secondary">
          <RotateCcw className="size-4" />
        </span>
        <h2
          id="restore-version-title"
          className="mt-4 text-xl font-semibold tracking-[-.03em]"
        >
          Pulihkan versi {String(version.version).padStart(2, "0")}?
        </h2>
        <p
          id="restore-version-description"
          className="mt-2 text-xs leading-5 text-slate-500"
        >
          Isi draft saat ini akan diganti dengan versi pilihan tanpa membuat
          versi baru. Diskusi sebelumnya tetap tersimpan, tetapi sorotan teksnya
          tidak dibawa ke versi yang dipulihkan.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={isLoading}
            onClick={onCancel}
          >
            Batal
          </Button>
          <SubmitButton
            variant="default"
            size="sm"
            type="button"
            isLoading={isLoading}
            loadingText="Memulihkan..."
            onClick={onConfirm}
            leftIcon={<RotateCcw className="size-4" />}
          >
            Pulihkan versi
          </SubmitButton>
        </div>
      </section>
    </div>
  );
}
