"use client";

import { useCallback, useState } from "react";

import { addDraftCommentAction, deleteDraftCommentAction, inviteDraftCollaboratorAction, saveDraftAction, shareDraftAction } from "@/app/actions/draft.action";
import type { AddDraftCommentDTO, ContractDetail, InviteDraftCollaboratorDTO, SaveDraftDTO } from "@/types/contract.type";

export function useDraft(initialDraft: ContractDetail) {
  const [data, setData] = useState(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDraft = useCallback(async (input: SaveDraftDTO) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveDraftAction(data.id, input);
      if (!result.success) throw new Error(result.error ?? "Draft gagal disimpan.");
      setData((current) => ({ ...current, title: input.title, content: input.content, metadata: { ...current.metadata, version: result.data?.version ?? current.metadata.version } }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft gagal disimpan.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data.id]);

  const deleteComment = useCallback(async (commentId: string) => {
    setError(null);
    try {
      const result = await deleteDraftCommentAction(data.id, commentId);
      if (!result.success) throw new Error(result.error ?? "Komentar gagal dihapus.");
      setData((current) => {
        const childIds = new Set(current.comments.filter((item) => item.parentId === commentId).map((item) => item.id));
        return {
          ...current,
          comments: current.comments.filter((item) => item.id !== commentId && !childIds.has(item.id)),
          metadata: { ...current.metadata, comments: Math.max(0, Number(current.metadata.comments ?? 0) - 1 - childIds.size) },
        };
      });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Komentar gagal dihapus.");
      return false;
    }
  }, [data.id]);

  const dismissError = useCallback(() => setError(null), []);

  const addComment = useCallback(async (input: AddDraftCommentDTO) => {
    setIsCommenting(true);
    setError(null);
    try {
      const result = await addDraftCommentAction(data.id, input);
      if (!result.success || !result.data) throw new Error(result.error ?? "Komentar gagal dikirim.");
      setData((current) => ({
        ...current,
        comments: [...current.comments, result.data!],
        metadata: { ...current.metadata, comments: current.comments.length + 1 },
      }));
      return result.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Komentar gagal dikirim.");
      return null;
    } finally {
      setIsCommenting(false);
    }
  }, [data.id]);

  const shareDraft = useCallback(async () => {
    setIsSharing(true);
    setError(null);
    try {
      const result = await shareDraftAction(data.id);
      if (!result.success) throw new Error(result.error ?? "Draft gagal dibagikan.");
      setData((current) => ({
        ...current,
        settings: current.settings ? { ...current.settings, status: "shared" } : current.settings,
        metadata: { ...current.metadata, shared: true },
      }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft gagal dibagikan.");
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [data.id]);

  const inviteCollaborator = useCallback(async (input: InviteDraftCollaboratorDTO) => {
    setIsSharing(true);
    setError(null);
    try {
      const result = await inviteDraftCollaboratorAction(data.id, input);
      if (!result.success || !result.data) throw new Error(result.error ?? "Pihak terkait gagal ditambahkan.");
      setData((current) => ({
        ...current,
        collaborators: [
          ...current.collaborators.filter((item) => item.userId !== result.data!.userId),
          result.data!,
        ],
        settings: current.settings ? { ...current.settings, status: "shared" } : current.settings,
        metadata: {
          ...current.metadata,
          shared: true,
          recipients: current.collaborators.some((item) => item.userId === result.data!.userId)
            ? current.collaborators.length
            : current.collaborators.length + 1,
        },
      }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pihak terkait gagal ditambahkan.");
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [data.id]);

  return { data, isSaving, isCommenting, isSharing, error, saveDraft, addComment, deleteComment, shareDraft, inviteCollaborator, dismissError };
}
