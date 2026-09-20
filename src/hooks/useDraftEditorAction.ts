"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteDraftAction,
  saveDraftContentAction,
  updateDraftTitleAction,
} from "@/app/actions/draft-editor.action";
import type {
  UseDraftEditorOptions,
  UseDraftEditorReturn,
} from "@/types/contract.type";

/**
 * Custom hook for managing Draft Editor interactions:
 * - Content autosave to Supabase with debounce.
 * - Contract renaming via modal dialog.
 * - Contract deletion with navigation redirect.
 * - Saving indicator state ("Menyimpan").
 */
export function useDraftEditorAction({
  initialDraft,
  backHref = "/dashboard",
  debounceMs = 1200,
}: UseDraftEditorOptions): UseDraftEditorReturn {
  const router = useRouter();

  const id = initialDraft.id;
  const [title, setTitle] = useState(initialDraft.title || "Dokumen Kontrak");
  const [content, setContent] = useState(initialDraft.content || "");
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    (initialDraft as any).updatedAt || (initialDraft as any).createdAt || null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>(content);
  latestContentRef.current = content;

  // Sync state when initialDraft updates asynchronously
  useEffect(() => {
    if (initialDraft.title) {
      setTitle(initialDraft.title);
    }
    if (initialDraft.content) {
      setContent(initialDraft.content);
      latestContentRef.current = initialDraft.content;
    }
    const nextUpdatedAt =
      (initialDraft as any).updatedAt || (initialDraft as any).createdAt || null;
    if (nextUpdatedAt) {
      setUpdatedAt(nextUpdatedAt);
    }
  }, [
    initialDraft.title,
    initialDraft.content,
    (initialDraft as any).updatedAt,
    (initialDraft as any).createdAt,
  ]);

  // Cleanup debounce and saved display timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Strips temporary selection highlight marks before persisting to database,
   * while preserving persistent review clause marks containing an id attribute.
   */
  const cleanDraftContentForSave = (html: string): string => {
    if (!html) return "";
    return html.replace(/<mark(\b[^>]*)>([\s\S]*?)<\/mark>/gi, (match, attrs, innerText) => {
      // If the mark has an id attribute (e.g. clause review marker), preserve it
      if (/\bid=["'][^"']+["']/i.test(attrs)) {
        return match;
      }
      // Otherwise, strip temporary highlight tag
      return innerText;
    });
  };

  /**
   * Persists latest content to Supabase.
   */
  const performSave = useCallback(
    async (contentToSave: string) => {
      if (!id) return;

      setIsSaving(true);
      setIsSaved(false);
      setError(null);

      try {
        // Strip temporary highlight marks before saving so they are never stored in database
        const cleanContent = cleanDraftContentForSave(contentToSave);
        const response = await saveDraftContentAction(id, cleanContent);
        if (response.success && response.data) {
          setUpdatedAt(response.data.updatedAt || new Date().toISOString());
          setIsSaved(true);
          if (savedTimeoutRef.current) {
            clearTimeout(savedTimeoutRef.current);
          }
          savedTimeoutRef.current = setTimeout(() => {
            setIsSaved(false);
          }, 3000);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        console.error("[useDraftEditor] Autosave error:", err);
        setError("Gagal menyimpan perubahan ke server.");
      } finally {
        setIsSaving(false);
      }
    },
    [id]
  );

  /**
   * Triggered on every keystroke or update in the Tiptap editor canvas.
   * Debounces the actual network call to save content.
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      // Ignore updates where only temporary selection marks changed
      const cleanNew = cleanDraftContentForSave(newContent);
      const cleanPrev = cleanDraftContentForSave(latestContentRef.current);
      if (cleanNew === cleanPrev) {
        return;
      }

      setContent(newContent);
      setIsSaved(false);
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSave(newContent);
      }, debounceMs);
    },
    [debounceMs, performSave]
  );

  /**
   * Renames the contract draft and persists to Supabase.
   */
  const handleRename = useCallback(
    async (newTitle: string): Promise<boolean> => {
      const cleanTitle = newTitle.trim();
      if (!cleanTitle) {
        setError("Judul kontrak tidak boleh kosong.");
        return false;
      }

      if (!id) {
        setTitle(cleanTitle);
        setIsRenameDialogOpen(false);
        return true;
      }

      setIsRenaming(true);
      setError(null);

      try {
        const response = await updateDraftTitleAction(id, cleanTitle);
        if (response.success && response.data) {
          setTitle(response.data.title);
          setUpdatedAt(response.data.updatedAt);
          setIsRenameDialogOpen(false);
          return true;
        } else {
          setError(response.error || "Gagal mengubah nama kontrak.");
          return false;
        }
      } catch (err) {
        console.error("[useDraftEditor] Rename error:", err);
        setError("Terjadi kesalahan saat mengubah nama kontrak.");
        return false;
      } finally {
        setIsRenaming(false);
      }
    },
    [id]
  );

  /**
   * Deletes the contract draft and navigates back to dashboard.
   */
  const handleDelete = useCallback(async (): Promise<boolean> => {
    if (!id) {
      router.push(backHref);
      return true;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteDraftAction(id);
      if (response.success) {
        setIsDeleteDialogOpen(false);
        router.push(backHref);
        return true;
      } else {
        setError(response.error || "Gagal menghapus kontrak.");
        return false;
      }
    } catch (err) {
      console.error("[useDraftEditor] Delete error:", err);
      setError("Terjadi kesalahan saat menghapus kontrak.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [id, backHref, router]);

  return {
    id,
    title,
    content,
    updatedAt,
    isSaving,
    isSaved,
    isRenaming,
    isDeleting,
    isRenameDialogOpen,
    isDeleteDialogOpen,
    error,
    setIsRenameDialogOpen,
    setIsDeleteDialogOpen,
    handleContentChange,
    handleRename,
    handleDelete,
  };
}
