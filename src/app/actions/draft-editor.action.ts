"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraftService } from "@/services/draft.service";
import { createDraftEditorService } from "@/services/draft-editor.service";
import { createErrorResponse } from "@/lib/response";
import type { BaseResponse } from "@/types/response.type";

/**
 * Retrieves the current authenticated user and an admin-privileged DraftEditorService instance.
 */
async function getDraftEditorServerContext() {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) return null;
  return { user, service: createDraftEditorService(createAdminClient()) };
}

/**
 * Server action to rename a contract draft using DraftService.
 *
 * @param contractId - ID of the contract to rename.
 * @param title - New title.
 * @returns BaseResponse with updated title and timestamp.
 */
export async function updateDraftTitleAction(
  contractId: string,
  title: string
): Promise<BaseResponse<{ id: string; title: string; updatedAt: string }>> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const service = createDraftService(createAdminClient());
  const result = await service.updateDraftTitle(user.id, {
    contractId,
    title,
  });

  if (result.success) {
    revalidatePath(`/dashboard/draft/${contractId}`);
    revalidatePath("/dashboard");
  }

  return result;
}

/**
 * Server action to save modified draft content with automatic AES-256-GCM encryption.
 *
 * @param contractId - ID of the contract being edited.
 * @param content - Updated HTML content.
 * @returns BaseResponse with updated timestamp.
 */
export async function saveDraftContentAction(
  contractId: string,
  content: string
): Promise<BaseResponse<{ id: string; updatedAt: string }>> {
  const context = await getDraftEditorServerContext();
  if (!context) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  return context.service.saveDraftContent(context.user.id, {
    contractId,
    content,
  });
}

/**
 * Server action to delete a contract draft and clean up related records.
 *
 * @param contractId - ID of the contract to delete.
 * @returns BaseResponse with deleted contract ID.
 */
export async function deleteDraftAction(
  contractId: string
): Promise<BaseResponse<{ id: string }>> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const service = createDraftService(createAdminClient());
  const result = await service.deleteDraft(user.id, contractId);
  if (result.success) {
    revalidatePath("/dashboard");
  }

  return result;
}
