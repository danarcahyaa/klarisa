"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/response";
import { createReviewService } from "@/services/review.service";
import type { DocumentSection } from "@/types/common.type";
import type {
  MatchedChunk,
  MatchedDocumentChunk,
  ReasoningAnalysisResult,
} from "@/types/contract-review.type";
import type { LlmProvider } from "@/types/llm.type";

/**
 * Server action: delegates legal reasoning analysis over matched contract chunks to ReviewService.
 *
 * @param sectionsOrRawText - Array of parsed document sections or raw text string.
 * @param matchedChunks      - Array of matched chunks containing vector-matched legal articles.
 * @param provider           - LLM provider choice (default: "gemini").
 * @returns BaseResponse containing the full ReasoningAnalysisResult.
 */
export async function processReasoningAction(
  sectionsOrRawText: DocumentSection[] | string,
  matchedChunks: (MatchedDocumentChunk | MatchedChunk)[],
  provider: LlmProvider = "gemini"
) {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) {
    return createErrorResponse<ReasoningAnalysisResult>("Sesi Anda telah berakhir.");
  }

  const reviewService = createReviewService(createAdminClient());
  return reviewService.processReasoning(sectionsOrRawText, matchedChunks, provider);
}
