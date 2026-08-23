"use server";

import { revalidatePath } from "next/cache";

import { getDraftServerContext } from "@/lib/draft-context";
import { createErrorResponse } from "@/lib/response";
import type { AddDraftCommentDTO, CreateDraftDTO, DraftCollaborator, DraftComment, DraftVersionContent, InviteDraftCollaboratorDTO, SaveDraftDTO, UpdateDraftCollaboratorDTO, UpdateDraftCommentDTO } from "@/types/contract.type";

export async function createDraftAction(input: CreateDraftDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ id: string }>("Sesi Anda telah berakhir.");
  const result = await context.service.createDraft(context.user.id, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
  }
  return result;
}

export async function deleteDraftAction(contractId: string) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ id: string }>("Sesi Anda telah berakhir.");
  const result = await context.service.deleteDraft(context.user.id, contractId);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
  }
  return result;
}

export async function deleteDraftCommentAction(contractId: string, commentId: string) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ id: string }>("Sesi Anda telah berakhir.");
  const result = await context.service.deleteComment(context.user.id, contractId, commentId);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function updateDraftCommentAction(contractId: string, commentId: string, input: UpdateDraftCommentDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<DraftComment>("Sesi Anda telah berakhir.");
  const result = await context.service.updateComment(context.user.id, contractId, commentId, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function setDraftCommentResolvedAction(contractId: string, commentId: string, resolved: boolean) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ id: string; resolved: boolean }>("Sesi Anda telah berakhir.");
  const result = await context.service.setCommentResolved(context.user.id, contractId, commentId, resolved);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function saveDraftAction(contractId: string, input: SaveDraftDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ version: number; activeVersionId?: string }>("Sesi Anda telah berakhir.");
  const result = await context.service.saveDraft(context.user.id, contractId, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function getDraftVersionAction(contractId: string, versionId: string) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<DraftVersionContent>("Sesi Anda telah berakhir.");
  return context.service.getDraftVersion(context.user.id, contractId, versionId);
}

export async function restoreDraftVersionAction(contractId: string, versionId: string) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<DraftVersionContent>("Sesi Anda telah berakhir.");
  const result = await context.service.restoreDraftVersion(context.user.id, contractId, versionId);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function shareDraftAction(contractId: string) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ status: "shared" }>("Sesi Anda telah berakhir.");
  const result = await context.service.shareDraft(context.user.id, contractId);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function addDraftCommentAction(contractId: string, input: AddDraftCommentDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<DraftComment>("Sesi Anda telah berakhir.");
  const result = await context.service.addComment(context.user.id, contractId, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function inviteDraftCollaboratorAction(contractId: string, input: InviteDraftCollaboratorDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<DraftCollaborator>("Sesi Anda telah berakhir.");
  const result = await context.service.inviteCollaborator(context.user.id, contractId, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function updateDraftCollaboratorRoleAction(contractId: string, input: UpdateDraftCollaboratorDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<DraftCollaborator>("Sesi Anda telah berakhir.");
  const result = await context.service.updateCollaboratorRole(context.user.id, contractId, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}

export async function removeDraftCollaboratorAction(contractId: string, collaboratorId: string) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ userId: string; shared: boolean }>("Sesi Anda telah berakhir.");
  const result = await context.service.removeCollaborator(context.user.id, contractId, collaboratorId);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard/shared");
    revalidatePath(`/dashboard/create?id=${contractId}`);
  }
  return result;
}
