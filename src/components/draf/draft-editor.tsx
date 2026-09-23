"use client";

import { useEffect, useState } from "react";
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
    if (!draft && targetId) {
      setIsLoading(true);
      loadDraftDetail(targetId)
        .then((data) => {
          console.log("Draft: ")
          console.log(data)
          if (data) {
            setDraft(data);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
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

  return (
    <div className="flex flex-col h-svh max-h-svh overflow-hidden">
      <EditorHeader
        title={title}
        updatedAt={updatedAt}
        isLoading={isLoading}
        isSaving={isSaving}
        isSaved={isSaved}
        onRename={() => setIsRenameDialogOpen(true)}
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
