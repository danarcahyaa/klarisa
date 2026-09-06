"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface RenameContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle: string;
  onConfirm: (newTitle: string) => Promise<boolean | void> | boolean | void;
}

export function RenameContractDialog({
  open,
  onOpenChange,
  initialTitle,
  onConfirm,
}: RenameContractDialogProps) {
  const [renameInput, setRenameInput] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRenameInput(initialTitle);
      setIsSaving(false);
    }
  }, [open, initialTitle]);

  const handleConfirm = async () => {
    const trimmed = renameInput.trim();
    if (!trimmed || isSaving) return;

    setIsSaving(true);
    try {
      const result = await onConfirm(trimmed);
      if (result !== false) {
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSaving && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ganti Nama Kontrak</DialogTitle>
          <DialogDescription>
            Masukkan judul baru untuk kontrak ini.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          <div className="py-2">
            <FormInput
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Judul kontrak..."
              disabled={isSaving}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={isSaving}>
                Batal
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={!renameInput.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
