"use client";

import { EditorHeader } from "./header/editor-header";
import type { ContractDetail } from "@/types/contract.type";
import { TextEditorCanvas } from "./text-editor/text-editor-canvas";

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
 * Main Draft Editor page component orchestrating header, toolbar, and canvas.
 */
export function DraftEditor({ initialDraft, backHref }: DraftEditorProps) {
  const title = initialDraft.title || "Dokumen Kontrak";
  const date = (initialDraft as any).updatedAt || (initialDraft as any).createdAt || null;
  const content = initialDraft.content || "";

  return (
    <div className="flex flex-col min-h-svh">
      <EditorHeader
        title={title}
        updatedAt={date}
        backHref={backHref}
      />

      <div className="w-230 max-w-full mx-auto px-4 pt-3 pb-6">
        <TextEditorCanvas initialContent={content} />
      </div>
    </div>
  );
}
