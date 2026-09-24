"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatIndonesianDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorHeaderPopover } from "./editor-header-popover";

interface EditorHeaderProps {
  title?: string;
  updatedAt?: string | null;
  isLoading?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
  onRename?: () => void;
  onExportDocx?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  backHref?: string;
}

/**
 * Header component for draft editor showing title, save status, and action buttons.
 */
export function EditorHeader({
  title = "",
  updatedAt,
  isLoading = false,
  isSaving = false,
  isSaved = false,
  onRename,
  onExportDocx,
  onDelete,
  onBack,
  backHref,
}: EditorHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const formattedDate = updatedAt ? formatIndonesianDate(updatedAt) : "Baru saja";

  return (
    <header className="shrink-0 sticky top-0 z-[80] mx-auto flex h-[68px] min-h-[68px] w-full items-center gap-2 sm:gap-3 bg-white border-b border-input px-2 sm:px-3">
        <div className="flex gap-1.5 sm:gap-2 w-full items-center">
            <Button variant={"ghost"} size={"sm"} onClick={handleBack} title="Kembali" aria-label="Kembali" className="shrink-0">
                <ArrowLeft className="size-4" />
            </Button>

            <div className="flex justify-between items-center w-full min-w-0">
              <div className="flex flex-col gap-0.5 justify-center min-w-0 flex-1 mr-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-32 sm:w-44 rounded bg-slate-200" />
                    <Skeleton className="h-3 w-20 sm:w-28 rounded bg-slate-200" />
                  </>
                ) : (
                  <>
                    <h4 className="text-sm line-clamp-1 font-medium truncate">
                      {title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>{formattedDate}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {isSaving ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 animate-in fade-in duration-200">
                    <Spinner size="xs" />
                    <span className="hidden sm:inline">Menyimpan</span>
                  </div>
                ) : isSaved ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in duration-200">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Berhasil disimpan</span>
                  </div>
                ) : null}
                <EditorHeaderPopover
                  onRename={onRename}
                  onExportDocx={onExportDocx}
                  onDelete={onDelete}
                />
              </div>
            </div>
        </div>
    </header>
  );
}
