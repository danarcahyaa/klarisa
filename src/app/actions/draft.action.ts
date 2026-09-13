"use server";

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

  return context.service.saveAiChat(context.user.id, input);
}
