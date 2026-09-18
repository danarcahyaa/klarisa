"use client";

import React from "react";
import Image from "next/image";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";

export interface AskSelectionTooltipProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Callback triggered when user clicks the 'Tanya' button */
  onAsk: (selectedText: string, highlightId?: string) => void;
}

/**
 * Floating tooltip displayed above highlighted/selected text in the draft text editor.
 * Provides a quick 'Tanya' button to consult Klarisa AI regarding the selected clause.
 */
export function AskSelectionTooltip({ editor, onAsk }: AskSelectionTooltipProps) {
  if (!editor) return null;

  const handleAskClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ").trim();
    if (selectedText) {
      // Generate a standard unique ID
      const highlightId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `id-${Date.now()}`;

      // Apply highlight mark with preventAutosave meta flag so it does not trigger database save
      (editor.chain() as any)
        .setMeta("preventAutosave", true)
        .setHighlight({ id: highlightId })
        .run();

      onAsk(selectedText, highlightId);
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor: currentEditor, state, from, to }) => {
        if (!currentEditor.isEditable || state.selection.empty || from === to) {
          return false;
        }
        const text = state.doc.textBetween(from, to, " ").trim();
        return text.length > 0;
      }}
    >
      <div className="not-prose z-50 animate-in fade-in zoom-in-95 duration-150 w-fit">
        <button
          type="button"
          onMouseDown={(e) => {
            // Prevent editor from losing focus or collapsing selection on mouse down
            e.preventDefault();
          }}
          onClick={handleAskClick}
          className="inline-flex items-center gap-1 rounded-full bg-slate-900/95 px-2 py-1 text-xs font-medium text-white transition-colors cursor-pointer select-none leading-normal whitespace-nowrap"
          title="Tanyakan klausul ini ke Klarisa AI"
        >
          <Image
            src="/klarisa/logo-ai.svg"
            alt="AI"
            width={15}
            height={15}
            className="size-3.5 object-contain shrink-0"
          />
          <span>Tanya</span>
        </button>
      </div>
    </BubbleMenu>
  );
}
