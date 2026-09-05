"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { formatIndonesianDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentHeaderProps {
  fileName?: string;
  createdAt?: string | null;
  status?: string;
  onBack?: () => void;
  isLoading?: boolean;
}

export function DocumentHeader({
  fileName = "",
  createdAt,
  status,
  onBack,
  isLoading = false,
}: DocumentHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/review");
    }
  };

  const formattedDate = createdAt ? formatIndonesianDate(createdAt) : null;

  return (
    <header className="flex h-16 min-h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-7">
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        onClick={handleBack}
        title="Kembali"
        aria-label="Kembali"
        className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
      {!isLoading && status && (
        <span className="ml-auto hidden text-xs font-medium text-slate-500 sm:block">
          {status}
        </span>
      )}
    </header>
  );
}
