"use server";

import { revalidatePath } from "next/cache";
import { getDraftServerContext } from "@/lib/draft-context";
import type { SaveDraftChatDTO } from "@/app/validations/contract.validation";
import type { SaveDraftChatResult } from "@/types/contract.type";
import type { GeminiInteraction, GeminiInteractionResponse, GeminiInteractionToolCall, } from "@/types/llm.type";
import type { BaseResponse } from "@/types/response.type";
import { createErrorResponse } from "@/lib/response";



/**
 * Server action to generate contract draft using LLM interactions API.
 *
 * @param prompt        - The drafting instruction or prompt.
 * @param interactionId - Optional previous interaction session ID.
 * @returns BaseResponse containing GeminiInteraction data.
 */
export async function generateDraftAction(
  prompt: string,
  interactionId?: string
): Promise<GeminiInteractionResponse> {
  const context = await getDraftServerContext();
  if (!context) {
    return createErrorResponse<GeminiInteraction>("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  if (!prompt || prompt.trim().length === 0) {
    return createErrorResponse<GeminiInteraction>("Prompt draft tidak boleh kosong.");
  }

  return context.service.generateDraft(prompt.trim(), {
    interactionId,
  });
}

/**
 * Server action to save an AI chat conversation (question and response) atomically using RPC.
 *
 * @param input - The chat conversation data (question, answer, chatId, etc.).
 * @returns BaseResponse containing SaveDraftChatResult with chat_id and conversation_id.
 */
export async function saveDraftChatAction(
  input: SaveDraftChatDTO
): Promise<BaseResponse<SaveDraftChatResult>> {
  const context = await getDraftServerContext();
  if (!context) {
    return createErrorResponse<SaveDraftChatResult>(
      "Sesi Anda telah berakhir. Silakan masuk kembali."
    );
  }

  const result = await context.service.saveAiChat(context.user.id, input);
  if (result.success) {
    revalidatePath("/dashboard/create");
    revalidatePath("/dashboard");
  }
  return result;
}

export interface GenerateContractDraftActionInput {
  userPrompt: string;
  contractType?: string;
  matchedArticles?: Array<{
    name?: string | null;
    article_number?: string | null;
    content?: string | null;
  }>;
}

/**
 * Server action to generate and persist a full contract draft based on matched legal regulations.
 *
 * @param input - Generation parameters including prompt, extracted clauses, and matched legal articles.
 * @returns BaseResponse containing created contract ID and title.
 */
export async function generateContractDraftAction(
  input: GenerateContractDraftActionInput
): Promise<BaseResponse<{ contractId: string; title: string }>> {
  const context = await getDraftServerContext();
  if (!context) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  return context.service.generateContractDraft(context.user.id, input);
}
