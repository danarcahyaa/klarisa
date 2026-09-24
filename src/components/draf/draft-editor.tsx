"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { EditorHeader } from "./header/editor-header";
import type { ContractDetail } from "@/types/contract.type";
import { TextEditorCanvas } from "./text-editor/text-editor-canvas";
import { useDraftEditorAction } from "@/hooks/useDraftEditorAction";
import { useDraftEditor } from "@/hooks/useDraftEditor";
import { FormDialog } from "@/components/ui/form-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";

interface DraftEditorProps {
  contractId?: string;
  initialDraft?: {
    id?: string;
    title: string;
    content: string;
    updatedAt?: string | null;
    createdAt?: string | null;
  } | ContractDetail | null;
  backHref?: string;
}

/**
 * Main Draft Editor page component orchestrating header, toolbar, canvas, autosave, and dialogs.
 */
export function DraftEditor({ contractId, initialDraft, backHref = "/dashboard" }: DraftEditorProps) {
  const { loadDraftDetail } = useDraftEditor();
  const [draft, setDraft] = useState<ContractDetail | null>(
    (initialDraft as ContractDetail) || null
  );
  const [isLoading, setIsLoading] = useState(!initialDraft && Boolean(contractId));

  const targetId = contractId || initialDraft?.id;

  useEffect(() => {
    let isMounted = true;

    if (!draft && targetId) {
      setIsLoading(true);
      loadDraftDetail(targetId)
        .then((data) => {
          if (!isMounted) return;
          if (data) {
            setDraft(data);
            setIsLoading(false);
          }
          // If !data, useDraftEditor is redirecting to /dashboard/create with toast.
          // Keep isLoading = true so skeleton stays visible instead of flashing an empty canvas.
        })
        .catch(() => {
          if (!isMounted) return;
          setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [targetId, draft, loadDraftDetail]);

  const activeDraft = draft || initialDraft || {
    id: targetId,
    title: "",
    content: "",
    updatedAt: null,
    createdAt: null,
  };

  const {
    title,
    content,
    updatedAt,
    isSaving,
    isSaved,
    isRenaming,
    isDeleting,
    isRenameDialogOpen,
    isDeleteDialogOpen,
    setIsRenameDialogOpen,
    setIsDeleteDialogOpen,
    handleContentChange,
    handleRename,
    handleDelete,
  } = useDraftEditorAction({ initialDraft: activeDraft, backHref });

  const handleExportDocx = useCallback(async () => {
    try {
      toast.loading("Mengekspor draft ke DOCX...", { id: "export-docx" });
      const response = await fetch("/api/draft/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Dokumen Kontrak",
          content: content || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengekspor dokumen DOCX.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeTitle = (title || "Dokumen Kontrak").replace(/[/\\?%*:|"<>]/g, "-").trim();
      anchor.href = url;
      anchor.download = `${safeTitle}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Dokumen DOCX berhasil diunduh.", { id: "export-docx" });
    } catch (err) {
      console.error("[DraftEditor] Export DOCX error:", err);
      toast.error("Gagal mengunduh file DOCX. Silakan coba lagi.", { id: "export-docx" });
    }
  }, [title, content]);

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 flex-1 overflow-hidden">
      <EditorHeader
        title={title}
        updatedAt={updatedAt}
        isLoading={isLoading}
        isSaving={isSaving}
        isSaved={isSaved}
        onRename={() => setIsRenameDialogOpen(true)}
        onExportDocx={handleExportDocx}
        onDelete={() => setIsDeleteDialogOpen(true)}
        backHref={backHref}
      />

      <div className="flex-1 min-h-0 w-full overflow-hidden transition-all duration-300">
        <TextEditorCanvas
          contractId={activeDraft.id}
          initialContent={activeDraft.content || ""}
          initialReviews={(activeDraft as any).reviewMetadata || null}
          isLoading={isLoading}
          onContentChange={handleContentChange}
        />
      </div>

      {/* Rename Contract Dialog */}
      <FormDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        item="Kontrak"
        title="Ganti Nama Kontrak"
        description="Masukkan nama baru untuk dokumen draf kontrak ini."
        defaultValue={title}
        isLoading={isRenaming}
        onConfirm={handleRename}
      />

      {/* Delete Contract Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        item={title}
        title="Hapus Kontrak"
        description={`Draf kontrak "${title}" akan dihapus secara permanen dan tidak dapat dikembalikan.`}
        isLoading={isDeleting}
        onConfirm={async () => {
          await handleDelete();
        }}
      />
    </div>
  );
}
