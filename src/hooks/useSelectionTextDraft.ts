"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  UseSelectionTextDraftOptions,
  UseSelectionTextDraftReturn,
} from "@/types/text-selection-draft.type";

/**
 * Custom hook to manage text selection and highlight state in the draft editor
 * for AI interaction ('Tanya' / clause questions).
 * - Manages active selected text snippet and associated highlightId.
 * - Handles dismissal of highlight marks and cursor selection cleanup on the editor canvas.
 * - Measures multi-line height for selected text UI box.
 */
export function useSelectionTextDraft({
  editor,
}: UseSelectionTextDraftOptions = {}): UseSelectionTextDraftReturn {
  const [selectedTextForAsk, setSelectedTextForAsk] = useState<string | null>(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [isMultiLine, setIsMultiLine] = useState(false);

  const selectedTextElRef = useRef<HTMLDivElement | null>(null);

  const setSelectedTextRef = useCallback((node: HTMLDivElement | null) => {
    selectedTextElRef.current = node;
    if (node) {
      setIsMultiLine(node.scrollHeight > 24);
    }
  }, []);

  useEffect(() => {
    if (!selectedTextForAsk || !selectedTextElRef.current) return;
    const el = selectedTextElRef.current;
    const observer = new ResizeObserver(() => {
      setIsMultiLine(el.scrollHeight > 24);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedTextForAsk]);

  /**
   * Sets the highlighted/selected text to be displayed in the Agent panel box.
   * Does NOT immediately generate AI response.
   */
  const handleSelectTextForAsk = useCallback((selectedText: string, highlightId?: string) => {
    const trimmed = selectedText.trim();
    if (!trimmed) return;
    setSelectedTextForAsk(trimmed);
    setSelectedHighlightId(highlightId || null);
  }, []);

  /**
   * Clears the selected text from state only without altering the editor canvas.
   */
  const handleClearSelectedText = useCallback(() => {
    setSelectedTextForAsk(null);
    setSelectedHighlightId(null);
    setIsMultiLine(false);
  }, []);

  /**
   * Dismisses the selected text from state and removes the highlight mark and cursor selection
   * from the Tiptap editor canvas.
   */
  const handleDismissSelectedText = useCallback(() => {
    if (editor && !editor.isDestroyed) {
      if ((editor.commands as any).unsetHighlightMark) {
        (editor.commands as any).unsetHighlightMark(selectedHighlightId || undefined, true);
      } else {
        const markType = editor.schema?.marks?.highlight;
        if (markType) {
          const { tr } = editor.state;
          tr.doc.descendants((node, pos) => {
            if (node.marks) {
              node.marks.forEach((mark) => {
                if (
                  mark.type === markType &&
                  (!selectedHighlightId || mark.attrs.id === selectedHighlightId)
                ) {
                  tr.removeMark(pos, pos + node.nodeSize, mark);
                }
              });
            }
          });
          tr.setMeta("preventAutosave", true);
          editor.view.dispatch(tr);
        }
      }

      // Collapse selection so floating tooltip immediately disappears
      const currentPos = editor.state.selection.to;
      (editor.chain() as any).setTextSelection(currentPos).run();
      if (typeof window !== "undefined") {
        window.getSelection()?.removeAllRanges();
      }
    }

    setSelectedTextForAsk(null);
    setSelectedHighlightId(null);
    setIsMultiLine(false);
  }, [editor, selectedHighlightId]);

  return {
    selectedTextForAsk,
    selectedHighlightId,
    isMultiLine,
    setSelectedTextRef,
    handleSelectTextForAsk,
    handleClearSelectedText,
    handleDismissSelectedText,
  };
}
