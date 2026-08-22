"use server";

import { revalidatePath } from "next/cache";

import { getDraftServerContext } from "@/lib/draft-context";
import { createErrorResponse } from "@/lib/response";
import type { AddDraftCommentDTO, CreateDraftDTO, DraftCollaborator, DraftComment, InviteDraftCollaboratorDTO, SaveDraftDTO } from "@/types/contract.type";

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

export async function saveDraftAction(contractId: string, input: SaveDraftDTO) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ version: number }>("Sesi Anda telah berakhir.");
  const result = await context.service.saveDraft(context.user.id, contractId, input);
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
