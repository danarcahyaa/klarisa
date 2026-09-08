"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import { EditorToolbar } from "./editor-toolbar";

export interface EditorCanvasProps {
  editor: Editor | null;
  canEdit: boolean;
  isSearchOpen: boolean;
  onSearchToggle: () => void;
  onInsertLink: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchNext: () => void;
  searchFeedback: string;
}

export function EditorCanvas({
  editor,
  canEdit,
  isSearchOpen,
  onSearchToggle,
  onInsertLink,
  searchQuery,
  onSearchChange,
  onSearchNext,
  searchFeedback,
}: EditorCanvasProps) {
  return (
    <section className="min-w-0 border-b border-slate-200 xl:border-r xl:border-b-0">
      <EditorToolbar
        editor={editor}
        canEdit={canEdit}
        isSearchOpen={isSearchOpen}
        onSearchToggle={onSearchToggle}
        onInsertLink={onInsertLink}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchNext={onSearchNext}
        searchFeedback={searchFeedback}
      />

      <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-10 lg:px-14">
        <EditorContent
          editor={editor}
          className="prose max-w-none text-sm leading-7 [&_a]:text-klarisa-secondary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-klarisa-secondary [&_blockquote]:pl-4 [&_h2]:mt-7 [&_h2]:text-sm [&_h2]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:min-h-[1.25rem] [&_ul]:list-disc"
        />
      </div>
    </section>
  );
}
