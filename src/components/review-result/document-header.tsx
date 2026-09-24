"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, EllipsisVertical, FileDown, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatIndonesianDate } from "@/lib/utils";
import { ActionPopover } from "@/components/ui/action-popover";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchReviewDialog } from "./search-review-dialog";

interface DocumentHeaderProps {
  fileName?: string;
  createdAt?: string | null;
  status?: string;
  onBack?: () => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  onSearchReview?: () => void;
  onExportDraft?: () => void;
  onDeleteReview?: () => void | Promise<void>;
}

export function DocumentHeader({
  fileName = "",
  createdAt,
  status,
  onBack,
  isLoading = false,
  isDeleting = false,
  onSearchReview,
  onExportDraft,
  onDeleteReview,
}: DocumentHeaderProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/review");
    }
  };

  const formattedDate = createdAt ? formatIndonesianDate(createdAt) : null;

  return (
    <>
      <header className="relative z-20 lg:sticky lg:top-0 lg:z-30 flex h-16 min-h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-7">
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={handleBack}
          title="Kembali"
          aria-label="Kembali"
          className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="size-5" />
        </Button>
        {isLoading ? (
          <div className="grid gap-1 flex-1">
            <Skeleton className="h-4 w-48 max-w-full rounded-md" />
            <Skeleton className="h-3 w-32 max-w-full rounded-md" />
          </div>
        ) : (
          <span className="grid">
            <b className="text-sm font-semibold">{fileName}</b>
            <small className="text-xs text-slate-400">
              {formattedDate ? `${formattedDate}` : ""}
            </small>
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {!isLoading && status && (
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              {status}
            </span>
          )}

          <div className="flex">
            <ActionPopover
              align="end"
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  aria-label="Menu Opsi Review"
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                >
                  <EllipsisVertical className="size-4.5" />
                </Button>
              }
              items={[
                {
                  text: "Cari review",
                  icon: <Search className="size-3.5" />,
                  onClick: () => {
                    if (onSearchReview) {
                      onSearchReview();
                    } else {
                      setIsSearchDialogOpen(true);
                    }
                  },
                },
                {
                  text: "Export draft",
                  icon: <FileDown className="size-3.5" />,
                  onClick: () => {
                    if (onExportDraft) {
                      onExportDraft();
                    } else {
                      toast.info("Fitur ekspor draft sedang dipersiapkan.");
                    }
                  },
                },
              ]}
              footer={{
                text: "Hapus",
                icon: <Trash2 className="size-3.5" />,
                variant: "destructive",
                onClick: () => {
                  setIsDeleteDialogOpen(true);
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Search Review Dialog */}
      <SearchReviewDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSelectReview={(selectedReviewId) => {
          router.push(`/dashboard/review/result/${selectedReviewId}`);
        }}
      />

      {/* Confirmation Dialog for Delete Review */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        item={fileName || "Review Kontrak"}
        isLoading={isDeleting}
        onConfirm={async () => {
          if (onDeleteReview) {
            await onDeleteReview();
          } else {
            toast.success("Review berhasil dihapus.");
            router.push("/dashboard/review");
          }
          setIsDeleteDialogOpen(false);
        }}
      />
    </>
  );
}
