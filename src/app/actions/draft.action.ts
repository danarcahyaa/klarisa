"use server";

import { revalidatePath } from "next/cache";

import { getDraftServerContext } from "@/lib/draft-context";
import { createErrorResponse } from "@/lib/response";
import type { CreateDraftDTO, SaveDraftDTO } from "@/types/contract.type";

export async function createDraftAction(input: CreateDraftDTO = {}) {
  const context = await getDraftServerContext();
  if (!context) return createErrorResponse<{ id: string }>("Sesi Anda telah berakhir.");
  const result = await context.service.createDraft(context.user.id, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/search");
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
