import type { Editor } from "@tiptap/react";

export interface UseSelectionTextDraftOptions {
  /** Optional Tiptap editor instance to remove marks and clear cursor selection */
  editor?: Editor | null;
}

export interface UseSelectionTextDraftReturn {
  selectedTextForAsk: string | null;
  selectedHighlightId: string | null;
  isMultiLine: boolean;
  setSelectedTextRef: (node: HTMLDivElement | null) => void;
  handleSelectTextForAsk: (selectedText: string, highlightId?: string) => void;
  handleClearSelectedText: () => void;
  handleDismissSelectedText: () => void;
}
