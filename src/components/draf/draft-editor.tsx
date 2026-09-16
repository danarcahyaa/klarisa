"use client";

import { EditorHeader } from "./header/editor-header";
import type { ContractDetail } from "@/types/contract.type";
import { TextEditorCanvas } from "./text-editor/text-editor-canvas";
import { useDraftEditor } from "@/hooks/useDraftEditor";
import { FormDialog } from "@/components/ui/form-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";

interface DraftEditorProps {
  initialDraft: {
    id?: string;
    title: string;
    content: string;
    updatedAt?: string | null;
    createdAt?: string | null;
  } | ContractDetail;
  backHref?: string;
}

/**
 * Main Draft Editor page component orchestrating header, toolbar, canvas, autosave, and dialogs.
 */
export function DraftEditor({ initialDraft, backHref }: DraftEditorProps) {
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
  } = useDraftEditor({ initialDraft, backHref });

  return (
    <div className="flex flex-col h-svh max-h-svh overflow-hidden">
      <EditorHeader
        title={title}
        updatedAt={updatedAt}
        isSaving={isSaving}
        isSaved={isSaved}
        onRename={() => setIsRenameDialogOpen(true)}
        onDelete={() => setIsDeleteDialogOpen(true)}
        backHref={backHref}
      />

      <div className="flex-1 min-h-0 w-full overflow-hidden transition-all duration-300">
        <TextEditorCanvas
          initialContent={initialDraft.content || ""}
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
