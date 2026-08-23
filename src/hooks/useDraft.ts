"use client";

import { useCallback, useState } from "react";

import { addDraftCommentAction, deleteDraftAction, deleteDraftCommentAction, getDraftVersionAction, inviteDraftCollaboratorAction, removeDraftCollaboratorAction, restoreDraftVersionAction, saveDraftAction, setDraftCommentResolvedAction, shareDraftAction, updateDraftCollaboratorRoleAction, updateDraftCommentAction } from "@/app/actions/draft.action";
import type { AddDraftCommentDTO, ContractDetail, InviteDraftCollaboratorDTO, SaveDraftDTO, UpdateDraftCollaboratorDTO, UpdateDraftCommentDTO } from "@/types/contract.type";

export function useDraft(initialDraft: ContractDetail) {
  const [data, setData] = useState(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);
  const [isManagingAccess, setIsManagingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDraft = useCallback(async (input: SaveDraftDTO) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveDraftAction(data.id, input);
      if (!result.success) throw new Error(result.error ?? "Draft gagal disimpan.");
      setData((current) => ({ ...current, title: input.title, content: input.content, metadata: { ...current.metadata, version: result.data?.version ?? current.metadata.version, active_version_id: result.data?.activeVersionId ?? current.metadata.active_version_id } }));
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

  const deleteDraft = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteDraftAction(data.id);
      if (!result.success) throw new Error(result.error ?? "Draft gagal dihapus.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft gagal dihapus.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [data.id]);

  const getDraftVersion = useCallback(async (versionId: string) => {
    setIsLoadingVersion(true);
    setError(null);
    try {
      const result = await getDraftVersionAction(data.id, versionId);
      if (!result.success || !result.data) throw new Error(result.error ?? "Versi draft gagal dimuat.");
      return result.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Versi draft gagal dimuat.");
      return null;
    } finally {
      setIsLoadingVersion(false);
    }
  }, [data.id]);

  const restoreDraftVersion = useCallback(async (versionId: string) => {
    setIsRestoringVersion(true);
    setError(null);
    try {
      const result = await restoreDraftVersionAction(data.id, versionId);
      if (!result.success || !result.data) throw new Error(result.error ?? "Versi draft gagal dipulihkan.");
      setData((current) => ({
        ...current,
        title: result.data!.title,
        content: result.data!.content,
        metadata: {
          ...current.metadata,
          version: result.data!.version,
          active_version_id: result.data!.id,
        },
      }));
      return result.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Versi draft gagal dipulihkan.");
      return null;
    } finally {
      setIsRestoringVersion(false);
    }
  }, [data.id]);

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

  const updateComment = useCallback(async (commentId: string, input: UpdateDraftCommentDTO) => {
    setIsCommenting(true);
    setError(null);
    try {
      const result = await updateDraftCommentAction(data.id, commentId, input);
      if (!result.success || !result.data) throw new Error(result.error ?? "Komentar gagal diperbarui.");
      setData((current) => ({ ...current, comments: current.comments.map((item) => item.id === commentId ? result.data! : item) }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Komentar gagal diperbarui.");
      return false;
    } finally {
      setIsCommenting(false);
    }
  }, [data.id]);

  const setCommentResolved = useCallback(async (commentId: string, resolved: boolean) => {
    setIsCommenting(true);
    setError(null);
    try {
      const result = await setDraftCommentResolvedAction(data.id, commentId, resolved);
      if (!result.success || !result.data) throw new Error(result.error ?? "Status diskusi gagal diperbarui.");
      setData((current) => ({
        ...current,
        comments: current.comments.map((item) => item.id === commentId
          ? { ...item, isResolved: resolved, resolvedAt: resolved ? new Date().toISOString() : null }
          : item),
      }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status diskusi gagal diperbarui.");
      return false;
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

  const updateCollaboratorRole = useCallback(async (input: UpdateDraftCollaboratorDTO) => {
    setIsManagingAccess(true);
    setError(null);
    try {
      const result = await updateDraftCollaboratorRoleAction(data.id, input);
      if (!result.success || !result.data) throw new Error(result.error ?? "Akses pihak terkait gagal diperbarui.");
      setData((current) => ({ ...current, collaborators: current.collaborators.map((item) => item.userId === input.userId ? result.data! : item) }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Akses pihak terkait gagal diperbarui.");
      return false;
    } finally {
      setIsManagingAccess(false);
    }
  }, [data.id]);

  const removeCollaborator = useCallback(async (collaboratorId: string) => {
    setIsManagingAccess(true);
    setError(null);
    try {
      const result = await removeDraftCollaboratorAction(data.id, collaboratorId);
      if (!result.success || !result.data) throw new Error(result.error ?? "Akses pihak terkait gagal dicabut.");
      setData((current) => ({
        ...current,
        collaborators: current.collaborators.filter((item) => item.userId !== collaboratorId),
        settings: current.settings ? { ...current.settings, status: result.data!.shared ? "shared" : "private" } : current.settings,
        metadata: { ...current.metadata, shared: result.data!.shared, recipients: Math.max(0, current.collaborators.length - 1) },
      }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Akses pihak terkait gagal dicabut.");
      return false;
    } finally {
      setIsManagingAccess(false);
    }
  }, [data.id]);

  return { data, isSaving, isCommenting, isSharing, isDeleting, isLoadingVersion, isRestoringVersion, isManagingAccess, error, saveDraft, deleteDraft, getDraftVersion, restoreDraftVersion, addComment, updateComment, deleteComment, setCommentResolved, shareDraft, inviteCollaborator, updateCollaboratorRole, removeCollaborator, dismissError };
}
