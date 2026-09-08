"use client";

import { Search, X, Undo2, Redo2, Link2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TOOLBAR_BUTTONS } from "@/lib/draft-editor";
import type { ToolbarButton } from "@/types/draft-editor.type";

interface EditorToolbarProps {
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

/**
 * Toolbar component for draft editor with formatting buttons and search.
 * Displays formatting controls (bold, italic, etc.) and text search functionality.
 */
export function EditorToolbar({
  editor,
  canEdit,
  isSearchOpen,
  onSearchToggle,
  onInsertLink,
  searchQuery,
  onSearchChange,
  onSearchNext,
  searchFeedback,
}: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="sticky top-16 z-20 border-b border-slate-200 bg-white lg:top-0">
      {isSearchOpen && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 sm:px-6">
          <Search className="size-4 text-klarisa-secondary" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchNext();
              if (e.key === "Escape") onSearchToggle();
            }}
            placeholder="Cari di dalam kontrak..."
            className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
          <span className="text-xs text-slate-400">{searchFeedback}</span>
          <Button
            variant="default"
            size="xs"
            type="button"
            onClick={onSearchNext}
          >
            Cari berikutnya
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={onSearchToggle}
            aria-label="Tutup pencarian"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex min-h-13 items-center gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
        {/* Search button */}
        <button
          type="button"
          aria-label="Cari dalam dokumen"
          onClick={onSearchToggle}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100",
            isSearchOpen && "bg-[#edf2ff] text-klarisa-secondary",
          )}
        >
          <Search className="size-4" />
        </button>

        {canEdit && (
          <>
            <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />

            {/* Undo/Redo buttons */}
            <FormattingControls editor={editor} />

            <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />

            {/* Paragraph style selector */}
            <StyleSelector editor={editor} />

            {/* Text formatting buttons */}
            {TOOLBAR_BUTTONS.map((btn) => (
              <ToolbarButtonComponent
                key={btn.label}
                button={btn}
                editor={editor}
              />
            ))}

            {/* Link button */}
            <button
              type="button"
              aria-label="Tambahkan tautan"
              onClick={onInsertLink}
              className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"
            >
              <Link2 className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Undo/Redo formatting control buttons.
 */
function FormattingControls({ editor }: { editor: Editor }) {
  return (
    <>
      <button
        type="button"
        aria-label="Urungkan"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100 disabled:opacity-50"
      >
        <Undo2 className="size-4" />
      </button>

      <button
        type="button"
        aria-label="Ulangi"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100 disabled:opacity-50"
      >
        <Redo2 className="size-4" />
      </button>
    </>
  );
}

/**
 * Paragraph style selector dropdown.
 */
function StyleSelector({ editor }: { editor: Editor }) {
  return (
    <select
      aria-label="Gaya paragraf"
      defaultValue="paragraph"
      onChange={(e) => {
        const value = e.target.value;
        if (value === "paragraph") {
          editor.chain().focus().setParagraph().run();
        } else if (value === "h2") {
          editor.chain().focus().setHeading({ level: 2 }).run();
        } else if (value === "blockquote") {
          editor.chain().focus().setBlockquote().run();
        }
      }}
      className="mx-2 h-9 shrink-0 rounded border border-slate-200 bg-white px-2 text-xs outline-none"
    >
      <option value="paragraph">Paragraf</option>
      <option value="h2">Judul pasal</option>
      <option value="blockquote">Kutipan</option>
    </select>
  );
}

/**
 * Individual toolbar button component.
 */
interface ToolbarButtonComponentProps {
  button: ToolbarButton;
  editor: Editor;
}

function ToolbarButtonComponent({
  button,
  editor,
}: ToolbarButtonComponentProps) {
  const Icon = button.icon;
  const isActive = button.isActive?.(editor) ?? false;

  return (
    <button
      type="button"
      title={button.label}
      aria-label={button.label}
      aria-pressed={isActive}
      onClick={() => button.action(editor)}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100",
        isActive && "bg-[#eaf0ff] text-klarisa-secondary",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
