"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { formatIndonesianDate } from "@/lib/utils";
import { EditorHeaderPopover } from "./editor-header-popover";

interface EditorHeaderProps {
  title?: string;
  updatedAt?: string | null;
  onBack?: () => void;
  backHref?: string;
}

/**
 * Header component for draft editor showing title, save status, and action buttons.
 */
export function EditorHeader({
  title = "Dokumen Kontrak",
  updatedAt,
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
    <header className="mx-auto flex min-h-[68px] w-full flex-wrap items-center gap-3 bg-white border-b border-input px-3">
        <div className="flex gap-2 w-full">
            <Button variant={"ghost"} size={"sm"} onClick={handleBack} title="Kembali" aria-label="Kembali">
                <ArrowLeft/>
            </Button>

            <div className="flex justify-between w-full">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm line-clamp-1 font-medium bg-gradient-to-r from-slate-900 via-slate-700 to-transparent bg-clip-text text-transparent">
                  {title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                   <span>{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <SubmitButton variant={"ghost"} size={"xs"}>
                  Simpan
                </SubmitButton>
                <EditorHeaderPopover />
              </div>
            </div>
        </div>
    </header>
  );
}
