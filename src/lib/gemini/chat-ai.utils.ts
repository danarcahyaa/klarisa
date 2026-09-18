import type { GeminiInteraction, GeminiInteractionToolCall } from "@/types/llm.type";
import type {
  ChatMessageItem,
  ChatStatusStep,
  ClauseMatchingStatus,
  MatchRegulationsResult,
  UpsertAiChatMessageOptions,
} from "@/types/draft.type";
import type { DraftClauseChunk } from "@/types/embedding.type";
import {
  generateEmbeddingAction,
  matchEmbeddingAction,
} from "@/app/actions/embedding.action";

export type {
  ClauseMatchingStatus,
  MatchRegulationsResult,
  UpsertAiChatMessageOptions,
};

/**
 * Extracts readable display text from an individual Gemini tool call.
 */
export function extractToolCallText(toolCall: GeminiInteractionToolCall): string | null {
  if (!toolCall) return null;

  // 1. agent_text_output
  if (toolCall.name === "agent_text_output") {
    return (
      (toolCall.args?.content as string) ||
      (toolCall.args?.message as string) ||
      (toolCall.args?.summary as string) ||
      null
    );
  }

  // 2. agent_clarification
  if (toolCall.name === "agent_clarification") {
    const question = (toolCall.args?.question as string) || "";
    const options = (toolCall.args?.suggested_options as string[]) || [];
    if (options.length > 0) {
      return `${question}\n\n${options.map((opt) => `- ${opt}`).join("\n")}`;
    }
    return question || null;
  }

  // 3. agent_reject_out_of_scope
  if (toolCall.name === "agent_reject_out_of_scope") {
    return (toolCall.args?.reason as string) || null;
  }

  // 4. agent_diff_replace
  if (toolCall.name === "agent_diff_replace") {
    const summary = (toolCall.args?.summary as string) || "";
    const changes =
      (toolCall.args?.changes as Array<{
        target?: string;
        action?: string;
        explanation?: string;
      }>) || [];

    if (changes.length > 0) {
      const changeList = changes
        .map(
          (c, idx) =>
            `${idx + 1}. **${c.target || "Teks"}** (${c.action || "revisi"}): ${c.explanation || ""}`
        )
        .join("\n");
      return `${summary ? `${summary}\n\n` : ""}Usulan perubahan draf:\n${changeList}`;
    }
    return summary || null;
  }

  // Legacy tools
  if (toolCall.name === "ask_clarification" && typeof toolCall.args?.message_to_user === "string") {
    return toolCall.args.message_to_user;
  }
  if (toolCall.name === "reject_out_of_scope" && typeof toolCall.args?.reason === "string") {
    return toolCall.args.reason;
  }
  if (toolCall.name === "extract_contract_clauses") {
    const contractType = (toolCall.args?.contract_type as string) || "Kontrak";
    const clauses = (toolCall.args?.clauses as Array<{ clause_name?: string }>) || [];
    if (clauses.length > 0) {
      const clausesList = clauses
        .map((c, idx) => `${idx + 1}. **${c.clause_name || "Pasal"}**`)
        .join("\n");
      return `Saya telah menganalisis kebutuhan Anda dan menyusun struktur awal draf **${contractType}** dengan pasal-pasal berikut:\n\n${clausesList}\n\nApakah Anda ingin melanjutkan ke pembuatan draf atau menambahkan klausul khusus lainnya?`;
    }
    return `Saya telah mengidentifikasi jenis draf untuk **${contractType}**. Sedang menyiapkan struktur draf kontrak untuk Anda.`;
  }

  return null;
}

/**
 * Extracts a readable message string from Gemini Interaction response or tool calls.
 */
export function extractAiResponseText(data: GeminiInteraction): string {
  if (data.toolCalls && data.toolCalls.length > 0) {
    for (const tc of data.toolCalls) {
      const extracted = extractToolCallText(tc);
      if (extracted) {
        return extracted;
      }
    }
  }

  return data.text || "";
}

/**
 * Updates an existing AI message in the messages list by ID, or appends a new one.
 *
 * @param messages - Current chat messages array.
 * @param aiMessageId - Unique identifier of the AI message item.
 * @param content - Updated text content for the AI message.
 * @param options - Optional configuration for date, shimmer animation, status steps, and metadata.
 * @returns A new array of chat messages with the updated or appended AI message.
 */
export function upsertAiChatMessage<T extends { id: string } = ChatMessageItem>(
  messages: T[],
  aiMessageId: string,
  content: string,
  options?: UpsertAiChatMessageOptions & Partial<T>
): T[] {
  const existingIndex = messages.findIndex((m) => m.id === aiMessageId);
  const date = options?.date !== undefined ? options.date : "";
  const isShimmer = options?.isShimmer !== undefined ? options.isShimmer : false;

  if (existingIndex !== -1) {
    const updated = [...messages];
    const prev = updated[existingIndex];
    updated[existingIndex] = {
      ...prev,
      content,
      ...(options?.date !== undefined ? { date: options.date } : {}),
      isShimmer: options?.isShimmer !== undefined ? options.isShimmer : (prev as any).isShimmer,
      statusSteps: options && "statusSteps" in options ? options.statusSteps : (prev as any).statusSteps,
      metadata: options && "metadata" in options ? options.metadata : (prev as any).metadata,
      ...options,
    };
    return updated;
  }
  return [
    ...messages,
    {
      id: aiMessageId,
      role: "ai",
      content,
      date,
      isShimmer,
      statusSteps: options?.statusSteps,
      metadata: options?.metadata ?? null,
      ...options,
    } as unknown as T,
  ];
}

/**
 * Processes extracted contract clauses by generating embeddings and matching them against legal articles.
 * Manages the regulation search shimmer text and settled status.
 *
 * @param toolCalls - Array of Gemini interaction tool calls.
 * @param onStatusUpdate - Optional callback to notify status changes to the caller.
 * @param signal - Optional AbortSignal to cancel execution if user stops response.
 * @returns Resolves with matched regulations data and statusSteps, or null if not applicable.
 */
export async function processExtractClauseAndMatchRegulations(
  toolCalls: GeminiInteractionToolCall[] | undefined,
  onStatusUpdate?: (status: ClauseMatchingStatus) => void,
  signal?: AbortSignal
): Promise<MatchRegulationsResult | null> {
  if (!toolCalls || toolCalls.length === 0 || signal?.aborted) {
    return null;
  }

  const extractClauseTool = toolCalls.find(
    (tc) => tc.name === "extract_contract_clauses"
  );
  if (!extractClauseTool) {
    return null;
  }

  const contractType =
    (extractClauseTool.args?.contract_type as string) || "Kontrak";
  const rawClauses = Array.isArray(extractClauseTool.args?.clauses)
    ? (extractClauseTool.args.clauses as Array<{
        clause_name?: string;
        semantic_query?: string;
      }>)
    : [];

  if (rawClauses.length === 0 || signal?.aborted) {
    return null;
  }

  // Phase 1: display "Mencari regulasi yang relevan..." with shimmer text
  onStatusUpdate?.({
    message: "",
    statusSteps: [
      { text: "Mencari regulasi yang relevan...", isShimmer: true },
    ],
    isShimmer: true,
  });

  const clauseChunks: DraftClauseChunk[] = rawClauses.map((c) => ({
    clause_name: c.clause_name || "Klausul",
    search_intent: c.semantic_query || c.clause_name || "Klausul Kontrak",
  }));

  if (signal?.aborted) return null;

  // Generate vector embeddings via server action
  const embeddingResult = await generateEmbeddingAction({
    chunks: clauseChunks,
    batchSize: 5,
    batchDelayMs: 300,
  });

  if (signal?.aborted) return null;

  if (!embeddingResult.success || !embeddingResult.data?.chunks) {
    console.warn(
      "[processExtractClauseAndMatchRegulations] Failed to generate embeddings:",
      embeddingResult.error
    );
    return null;
  }

  // Match embeddings against legal articles database
  const matchResult = await matchEmbeddingAction(
    embeddingResult.data.chunks,
    { matchThreshold: 0.5, matchCount: 3 }
  );

  if (signal?.aborted) return null;

  if (!matchResult.success || !matchResult.data?.chunks) {
    console.warn(
      "[processExtractClauseAndMatchRegulations] Failed to match embeddings:",
      matchResult.error
    );
    return null;
  }

  // Collect matched articles from all chunks, deduplicating them
  const matchedArticles: Array<{
    name?: string | null;
    article_number?: string | null;
    content?: string | null;
  }> = [];
  const seenArticleKeys = new Set<string>();

  for (const chunk of matchResult.data.chunks) {
    for (const reg of chunk.matched_regulations || []) {
      const key = `${reg.name || ""}-${reg.article_number || ""}`;
      if (!seenArticleKeys.has(key)) {
        seenArticleKeys.add(key);
        matchedArticles.push({
          name: reg.name,
          article_number: reg.article_number,
          content: reg.content,
        });
      }
    }
  }

  const settledStatusSteps = [
    { text: "Beberapa regulasi yang relevan berhasil ditemukan.", isShimmer: false },
  ];

  // Phase 2: update to settled text without shimmer
  onStatusUpdate?.({
    message: "",
    statusSteps: settledStatusSteps,
    isShimmer: false,
  });

  return {
    contractType,
    matchedArticles,
    statusSteps: settledStatusSteps,
  };
}
