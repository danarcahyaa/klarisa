"use client";

import { X, RotateCcw } from "lucide-react";
import type { DraftVersion, DraftVersionContent } from "@/types/contract.type";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VersionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DraftVersion[];
  selectedVersion: DraftVersionContent | null;
  onSelectVersion: (versionId: string) => void;
  isLoadingVersion: boolean;
  onRestoreClick: (version: DraftVersionContent) => void;
}

/**
 * Modal dialog for inspecting and restoring previous versions of a draft.
 */
export function VersionsDialog({
  isOpen,
  onClose,
  versions,
  selectedVersion,
  onSelectVersion,
  isLoadingVersion,
  onRestoreClick,
}: VersionsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Tutup riwayat versi"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-title"
        className="relative grid max-h-[min(720px,calc(100svh-2rem))] w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl md:grid-cols-[260px_minmax(0,1fr)]"
      >
        {/* Sidebar list of draft versions */}
        <div className="border-b border-slate-200 p-5 md:border-r md:border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
                RIWAYAT DRAFT
              </p>
              <h2
                id="version-history-title"
                className="mt-2 text-lg font-semibold tracking-[-.03em]"
              >
                Versi tersimpan
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={onClose}
              aria-label="Tutup"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Pilih versi untuk melihat isi sebelumnya.
          </p>
          <div className="mt-5 grid max-h-64 gap-1 overflow-y-auto md:max-h-[510px]">
            {versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => void onSelectVersion(version.id)}
                disabled={isLoadingVersion}
                className={cn(
                  "grid gap-1 rounded-md px-3 py-3 text-left transition-colors hover:bg-[#f5f7ff] disabled:cursor-wait",
                  selectedVersion?.id === version.id &&
                    "bg-[#edf2ff] text-klarisa-secondary",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <b className="text-xs font-semibold">
                    Versi {String(version.version).padStart(2, "0")}
                  </b>
                  <time className="text-xs text-slate-400">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(version.createdAt))}
                  </time>
                </span>
                <small className="truncate text-xs text-slate-500">
                  {version.title}
                </small>
              </button>
            ))}
            {versions.length === 0 && (
              <p className="px-3 py-5 text-xs leading-5 text-slate-400">
                Belum ada versi tersimpan.
              </p>
            )}
          </div>
        </div>

        {/* Content preview pane */}
        <div className="flex min-h-0 flex-col bg-slate-50/60">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
              PRATINJAU VERSI
            </p>
            <h3 className="mt-2 text-base font-semibold">
              {selectedVersion ? selectedVersion.title : "Pilih versi draft"}
            </h3>
          </div>
          {selectedVersion ? (
            <>
              <article
                dangerouslySetInnerHTML={{
                  __html: selectedVersion.content,
                }}
                className="min-h-0 flex-1 overflow-y-auto px-6 py-6 text-xs leading-6 text-slate-700 [&_h2]:mt-6 [&_h2]:font-sans [&_h2]:text-xs [&_h2]:font-bold [&_p]:mt-3"
              />
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
                <small className="text-xs leading-5 text-slate-500">
                  Pemulihan mengganti isi draft tanpa menambah riwayat. Diskusi
                  lama tetap tersimpan, tetapi sorotannya tidak dipasang pada
                  versi ini.
                </small>
                <Button
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={() => onRestoreClick(selectedVersion)}
                >
                  <RotateCcw className="size-4" />
                  Pulihkan versi ini
                </Button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-6 text-center">
              <p className="max-w-xs text-xs leading-5 text-slate-400">
                Pilih salah satu versi di sebelah kiri untuk melihat isi dan
                memulihkannya bila diperlukan.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
