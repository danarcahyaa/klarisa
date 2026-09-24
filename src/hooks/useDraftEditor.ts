"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEditor, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { BulletList, OrderedList, ListItem } from "@tiptap/extension-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import { StandardHighlight } from "@/lib/tiptap-highlight";
import { ReviseSuggestionExtension } from "@/lib/tiptap-revise-suggestion";
import { getDraftDetailAction } from "@/app/actions/draft-editor.action";
import type { ContractDetail } from "@/types/contract.type";

export interface UseDraftEditorOptions {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export interface UseDraftEditorReturn {
  editor: Editor | null;
  isLoadingDetail: boolean;
  loadDraftDetail: (id: string) => Promise<ContractDetail | null>;
}

/**
 * Custom hook to initialize and configure the Tiptap editor for contract drafts:
 * - Configures core extensions (StarterKit, Heading, Lists, Tables, Alignments, StandardHighlight, ReviseSuggestionExtension).
 * - Manages content synchronization and autosave event dispatching.
 * - Provides draft detail fetching helper.
 */
export function useDraftEditor({
  initialContent = "",
  onContentChange,
}: UseDraftEditorOptions = {}): UseDraftEditorReturn {
  const router = useRouter();
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const isFetchingRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      StandardHighlight,
      ReviseSuggestionExtension,
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
      if (!transaction.getMeta("preventAutosave")) {
        onContentChange?.(currentEditor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  const loadDraftDetail = useCallback(
    async (id: string): Promise<ContractDetail | null> => {
      if (hasRedirectedRef.current) return null;

      if (!id) {
        hasRedirectedRef.current = true;
        toast.error("Draft tidak ditemukan.", { id: "draft-not-found" });
        router.push("/dashboard/create");
        return null;
      }

      if (isFetchingRef.current) return null;
      isFetchingRef.current = true;
      setIsLoadingDetail(true);

      try {
        const res = await getDraftDetailAction(id);
        if (res.success && res.data) {
          return res.data;
        }

        hasRedirectedRef.current = true;
        toast.error("Draft tidak ditemukan.", { id: "draft-not-found" });
        router.push("/dashboard/create");
        return null;
      } catch (err) {
        console.error("[useDraftEditor] Failed to load draft detail:", err);
        hasRedirectedRef.current = true;
        toast.error("Draft tidak ditemukan.", { id: "draft-not-found" });
        router.push("/dashboard/create");
        return null;
      } finally {
        isFetchingRef.current = false;
        setIsLoadingDetail(false);
      }
    },
    [router]
  );

  return {
    editor,
    isLoadingDetail,
    loadDraftDetail,
  };
}
