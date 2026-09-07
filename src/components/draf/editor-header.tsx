"use client";

import {
  Check,
  Save,
  History,
  Share2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { ContractDetail } from "@/types/contract.type";
import { Button, SubmitButton } from "@/components/ui/button";
import type { SaveStatus } from "@/types/draft-editor.type";

interface EditorHeaderProps {
  draft: ContractDetail;
  title: string;
  saveStatus: SaveStatus;
  isSaving: boolean;
  canEdit: boolean;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onSaveVersion: () => void;
  onViewVersions: () => void;
  onShare: () => void;
  onActionsToggle: () => void;
  isActionsOpen: boolean;
  onDelete: () => void;
  isSharing: boolean;
}

/**
 * Header component for draft editor showing title, save status, and action buttons.
 */
export function EditorHeader({
  draft,
  title,
  saveStatus,
  isSaving,
  canEdit,
  onTitleChange,
  onTitleBlur,
  onSaveVersion,
  onViewVersions,
  onShare,
  onActionsToggle,
  isActionsOpen,
  onDelete,
  isSharing,
}: EditorHeaderProps) {
  return (
    <header className="mx-auto flex min-h-[68px] w-full max-w-[1080px] flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 xl:rounded-t-lg xl:border-x sm:px-7">
      <span className="grid min-w-0 flex-1 gap-1">
        <input
          value={title}
          readOnly={!canEdit}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onTitleBlur}
          aria-label="Judul dokumen"
          className="w-full max-w-xl bg-transparent text-xs font-bold outline-none focus:text-klarisa-secondary read-only:cursor-default"
        />
        <small className="flex items-center gap-1.5 text-[10px] text-slate-400">
          Draft v.{String(draft.metadata.version ?? 1).padStart(2, "0")} ·{" "}
          {!canEdit ? (
            "Akses komentar"
          ) : isSaving || saveStatus === "saving" ? (
            "Menyimpan..."
          ) : saveStatus === "error" ? (
            <span className="text-red-600">Gagal tersimpan</span>
          ) : (
            <>
              <Check className="size-3 text-green-600" />
              Tersimpan
            </>
          )}
        </small>
      </span>

      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onSaveVersion}
          disabled={isSaving}
          className="hidden sm:inline-flex"
        >
          <Save className="size-4" />
          <span className="hidden sm:inline">Simpan versi</span>
        </Button>
      )}

      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onViewVersions}
          className="hidden sm:inline-flex"
        >
          <History className="size-4" />
          <span className="hidden sm:inline">Riwayat versi</span>
        </Button>
      )}

      {draft.permission === "owner" && (
        <SubmitButton
          variant="default"
          size="sm"
          type="button"
          isLoading={isSharing}
          loadingText="Menyiapkan..."
          onClick={onShare}
          leftIcon={<Share2 className="size-4" />}
        >
          Bagikan
        </SubmitButton>
      )}

      {draft.permission === "owner" && (
        <div className="relative">
          <Button
            variant="outline"
            size="icon-lg"
            type="button"
            aria-label="Aksi draft lainnya"
            aria-expanded={isActionsOpen}
            onClick={onActionsToggle}
          >
            <MoreHorizontal className="size-4" />
          </Button>
          {isActionsOpen && (
            <div className="absolute top-12 right-0 z-50 w-44 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onDelete}
                className="w-full justify-start border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="size-4" />
                Hapus draft
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
