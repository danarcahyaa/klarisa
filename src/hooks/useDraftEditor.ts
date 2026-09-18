"use client";

import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { BulletList, OrderedList, ListItem } from "@tiptap/extension-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import { StandardHighlight } from "@/lib/tiptap-highlight";

export interface UseDraftEditorOptions {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

/**
 * Custom hook to initialize and configure the Tiptap editor for contract drafts:
 * - Configures core extensions (StarterKit, Heading, Lists, Tables, Alignments, StandardHighlight).
 * - Manages content synchronization and autosave event dispatching.
 */
export function useDraftEditor({
  initialContent = "",
  onContentChange,
}: UseDraftEditorOptions = {}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      StandardHighlight,
      TableKit,
      TextStyleKit,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-2",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-2",
        },
      }),
      ListItem,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    onUpdate: ({ editor: currentEditor, transaction }) => {
      // Prevent triggering autosave when selection marks are applied or removed
      if (transaction.getMeta("preventAutosave")) {
        return;
      }
      onContentChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  return { editor };
}
