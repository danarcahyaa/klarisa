"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface DeleteContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => Promise<boolean | void> | boolean | void;
}

export function DeleteContractDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
}: DeleteContractDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsDeleting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await onConfirm();
      if (result !== false) {
        onOpenChange(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kontrak</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus kontrak{" "}
            <b className="text-slate-800">"{title}"</b>? Kontrak yang
            telah dihapus tidak dapat dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild disabled={isDeleting}>
            <Button type="button" variant="outline" size="sm" disabled={isDeleting}>
              Batal
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild disabled={isDeleting}>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  <span>Menghapus...</span>
                </>
              ) : (
                "Ya, hapus"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
