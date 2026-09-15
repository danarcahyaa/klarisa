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
 * Extracts a readable message string from Gemini Interaction response or tool calls.
 */
export function extractAiResponseText(data: GeminiInteraction): string {
  if (data.toolCalls && data.toolCalls.length > 0) {
    for (const tc of data.toolCalls) {
      if (tc.name === "ask_clarification" && typeof tc.args?.message_to_user === "string") {
        return tc.args.message_to_user;
      }
      if (tc.name === "reject_out_of_scope" && typeof tc.args?.reason === "string") {
        return tc.args.reason;
      }
      if (tc.name === "extract_contract_clauses") {
        const contractType = (tc.args?.contract_type as string) || "Kontrak";
        const clauses = (tc.args?.clauses as Array<{ clause_name?: string }>) || [];
        if (clauses.length > 0) {
          const clausesList = clauses
            .map((c, idx) => `${idx + 1}. **${c.clause_name || "Pasal"}**`)
            .join("\n");
          return `Saya telah menganalisis kebutuhan Anda dan menyusun struktur awal draf **${contractType}** dengan pasal-pasal berikut:\n\n${clausesList}\n\nApakah Anda ingin melanjutkan ke pembuatan draf atau menambahkan klausul khusus lainnya?`;
        }
        return `Saya telah mengidentifikasi jenis draf untuk **${contractType}**. Sedang menyiapkan struktur draf kontrak untuk Anda.`;
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
 * @param options - Optional configuration for date, shimmer animation, and metadata.
 * @returns A new array of chat messages with the updated or appended AI message.
 */
export function upsertAiChatMessage(
  messages: ChatMessageItem[],
  aiMessageId: string,
  content: string,
  options?: UpsertAiChatMessageOptions
): ChatMessageItem[] {
  const existingIndex = messages.findIndex((m) => m.id === aiMessageId);
  const date = options?.date !== undefined ? options.date : "";
  const isShimmer = options?.isShimmer !== undefined ? options.isShimmer : false;

  if (existingIndex !== -1) {
    const updated = [...messages];
    const prev = updated[existingIndex];
    updated[existingIndex] = {
      ...prev,
      content,
      date: options?.date !== undefined ? options.date : prev.date,
      isShimmer: options?.isShimmer !== undefined ? options.isShimmer : prev.isShimmer,
      statusSteps: options?.statusSteps !== undefined ? options.statusSteps : prev.statusSteps,
      metadata: options?.metadata !== undefined ? options.metadata : prev.metadata,
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
    },
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
