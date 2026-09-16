"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatIndonesianDate } from "@/lib/utils";
import { EditorHeaderPopover } from "./editor-header-popover";

interface EditorHeaderProps {
  title?: string;
  updatedAt?: string | null;
  isSaving?: boolean;
  isSaved?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  backHref?: string;
}

/**
 * Header component for draft editor showing title, save status, and action buttons.
 */
export function EditorHeader({
  title = "Dokumen Kontrak",
  updatedAt,
  isSaving = false,
  isSaved = false,
  onRename,
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
    <header className="shrink-0 sticky top-0 z-30 mx-auto flex h-[68px] min-h-[68px] w-full flex-wrap items-center gap-3 bg-white border-b border-input px-3">
        <div className="flex gap-2 w-full">
            <Button variant={"ghost"} size={"sm"} onClick={handleBack} title="Kembali" aria-label="Kembali">
                <ArrowLeft/>
            </Button>

            <div className="flex justify-between w-full">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm line-clamp-1 font-medium">
                  {title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                   <span>{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {isSaving ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 animate-in fade-in duration-200">
                    <Spinner size="xs" />
                    <span>Menyimpan</span>
                  </div>
                ) : isSaved ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in duration-200">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Berhasil disimpan</span>
                  </div>
                ) : null}
                <EditorHeaderPopover
                  onRename={onRename}
                  onDelete={onDelete}
                />
              </div>
            </div>
        </div>
    </header>
  );
}
