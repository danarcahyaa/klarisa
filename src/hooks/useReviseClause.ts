"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { reviseClauseAction } from "@/app/actions/revise-clause.action";
import type { ReviseClauseResult } from "@/types/revise-clause.type";
import {
  generateHighlightId,
  markClauseSelection,
  removeHighlightMark,
  updateHighlightMarkAttrs,
} from "@/lib/tip-tap.utils";

export interface UseReviseClauseOptions {
  editor: Editor | null;
}

export interface UseReviseClauseReturn {
  isRevising: boolean;
  activeRevision: ReviseClauseResult | null;
  activeRevisionId: string | null;
  handleStartRevise: (
    clauseText: string,
    instruction?: string,
    citationId?: string,
    reviewContext?: string,
    selectionRange?: { from: number; to: number }
  ) => Promise<boolean>;
  handleAcceptRevision: () => void;
  handleRejectRevision: () => void;
}

/**
 * Finds the continuous document position range occupied by a specific highlight mark.
 */
function getMarkPositionRange(
  editor: Editor,
  markId: string
): { from: number; to: number } | null {
  let minFrom = Infinity;
  let maxTo = -1;

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (
          mark.attrs?.id === markId ||
          mark.attrs?.["data-revise-id"] === markId
        ) {
          if (pos < minFrom) minFrom = pos;
          if (pos + node.nodeSize > maxTo) maxTo = pos + node.nodeSize;
        }
      }
    }
  });

  if (maxTo > -1 && minFrom !== Infinity) {
    return { from: minFrom, to: maxTo };
  }
  return null;
}

/**
 * Custom hook managing the end-to-end clause revision workflow:
 * - Marks selected text with "shimmer" animation and locks editing.
 * - Invokes AI reasoning via reviseClauseAction.
 * - Applies strikethrough styling to the original clause.
 * - Manages active revision proposal state with accept/reject actions.
 */
export function useReviseClause({
  editor,
}: UseReviseClauseOptions): UseReviseClauseReturn {
  const [isRevising, setIsRevising] = useState(false);
  const [activeRevision, setActiveRevision] = useState<ReviseClauseResult | null>(null);
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);

  const activeRevisionIdRef = useRef<string | null>(null);
  activeRevisionIdRef.current = activeRevisionId;

  const isRevisingRef = useRef(false);
  isRevisingRef.current = isRevising;

  // Clause editing protection is natively enforced by ReviseSuggestionExtension.filterTransaction

  /**
   * Starts the clause revision workflow.
   */
  const handleStartRevise = useCallback(
    async (
      clauseText: string,
      instruction?: string,
      citationId?: string,
      reviewContext?: string,
      selectionRange?: { from: number; to: number }
    ): Promise<boolean> => {
      if (!editor || editor.isDestroyed) return false;

      const markId = citationId || generateHighlightId();
      const cleanClause = clauseText.replace(/<[^>]*>/g, "").trim();

      if (!cleanClause) {
        toast.error("Klausul yang dipilih tidak boleh kosong.");
        return false;
      }

      // Restore exact selection range if provided
      if (selectionRange && selectionRange.from !== selectionRange.to) {
        try {
          editor.commands.setTextSelection(selectionRange);
        } catch {
          // Fallback ignored
        }
      }

      // Step 1: Mark selected text with shimmer animation and lock interaction
      markClauseSelection(editor, "data-revise-id", {
        id: markId,
        preventAutosave: true,
        attrs: {
          id: markId,
          "data-revise-id": markId,
          class: "shimmer shine-text",
        },
      });

      // Collapse selection cursor outside the shimmering mark to prevent immediate typing
      try {
        const { to } = editor.state.selection;
        editor.commands.setTextSelection(to);
      } catch {
        // Fallback ignored
      }

      setIsRevising(true);
      setActiveRevisionId(markId);
      setActiveRevision(null);

      try {
        // Step 2: Call AI revision server action
        const response = await reviseClauseAction({
          selectedClause: clauseText,
          citationId: markId,
          additionalPrompt: instruction?.trim() || undefined,
          reviewContext: reviewContext?.trim() || undefined,
        });

        if (!response.success || !response.data) {
          // Cleanup mark on failure
          removeHighlightMark(editor, markId, true);
          setActiveRevisionId(null);
          toast.error(response.error || "Gagal merevisi klausul. Silakan coba lagi.");
          return false;
        }

        const result = response.data;

        // If result type is SAFE or AMBIGUOUS, check whether the user provided specific instructions.
        // When user provided instructions (e.g. styling/marking or specific edits), we should always
        // show the revision proposal to allow the user to review and accept the changes.
        const hasUserInstruction = Boolean(instruction && instruction.trim());

        if ((result.type === "SAFE" || result.type === "AMBIGUOUS") && !hasUserInstruction) {
          removeHighlightMark(editor, markId, true);
          setActiveRevisionId(null);
          setActiveRevision(null);

          if (result.type === "SAFE") {
            toast.info(
              "Klausul ini tidak memerlukan perbaikan.",
              { position: "bottom-center" }
            );
          } else {
            toast.warning(
              "Teks klausul masih ambigu atau belum lengkap sehingga tidak dapat direvisi.",
              { position: "bottom-center" }
            );
          }
          return true;
        }

        // Step 3: Replace shimmer class with strikethrough styling without underline
        updateHighlightMarkAttrs(
          editor,
          markId,
          {
            class: "revise-clause-strikethrough",
            "data-revise-id": markId,
          },
          true
        );

        setActiveRevision(result);
        toast.success("Draf revisi klausul telah siap ditinjau.", {
          position: "bottom-center",
        });
        return true;

      } catch (err) {
        console.error("[useReviseClause] Failed to revise clause:", err);
        removeHighlightMark(editor, markId, true);
        setActiveRevisionId(null);
        toast.error("Terjadi kesalahan saat memproses revisi klausul.");
        return false;
      } finally {
        setIsRevising(false);
      }
    },
    [editor]
  );

  /**
   * Accepts proposed revision: replaces original struck-through clause with revision HTML.
   */
  const handleAcceptRevision = useCallback(() => {
    if (!editor || !activeRevision || !activeRevisionId) return;

    const range = getMarkPositionRange(editor, activeRevisionId);
    const htmlToInsert = activeRevision.revision_clause;

    if (range) {
      editor
        .chain()
        .focus()
        .setMeta("allowReviseMutation", true)
        .insertContentAt(range, htmlToInsert)
        .run();
    }


    // Clean up mark from document
    removeHighlightMark(editor, activeRevisionId, false);

    setActiveRevision(null);
    setActiveRevisionId(null);
    toast.success("Klausul berhasil diperbarui ke draf kontrak.");
  }, [editor, activeRevision, activeRevisionId]);

  /**
   * Rejects proposed revision: clears mark and restores original clause text.
   */
  const handleRejectRevision = useCallback(() => {
    if (!editor || !activeRevisionId) return;

    // Remove the strikethrough mark to restore clean original text
    removeHighlightMark(editor, activeRevisionId, true);

    setActiveRevision(null);
    setActiveRevisionId(null);
  }, [editor, activeRevisionId]);

  // Synchronize active revision with TipTap ReviseSuggestionExtension
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const storage = (editor.storage as any)?.reviseSuggestion;
    if (!storage) return;

    if (activeRevision) {
      storage.activeRevision = activeRevision;
      storage.onAccept = handleAcceptRevision;
      storage.onReject = handleRejectRevision;
      editor.view.dispatch(editor.state.tr.setMeta("preventAutosave", true));
    } else if (storage.activeRevision) {
      storage.activeRevision = null;
      storage.onAccept = null;
      storage.onReject = null;
      editor.view.dispatch(editor.state.tr.setMeta("preventAutosave", true));
    }
  }, [editor, activeRevision, handleAcceptRevision, handleRejectRevision]);

  return {
    isRevising,
    activeRevision,
    activeRevisionId,
    handleStartRevise,
    handleAcceptRevision,
    handleRejectRevision,
  };
}

