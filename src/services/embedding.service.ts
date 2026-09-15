import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import { chunkArray, formatLimitationErrorMessage, sleep } from "@/lib/utils";
import { createLegalArticleRepository } from "@/repositories/legal-article.repository";
import type { BaseResponse } from "@/types/response.type";
import type { Database } from "@/types/database.type";
import type {
  AnyChunkItem,
  EmbeddedChunkResult,
  GenerateEmbeddingInput,
  MatchedChunkResult,
  MatchOptions,
} from "@/types/embedding.type";
import type { MatchLegalArticleResult } from "@/types/legal.type";
import { EMBEDDING_MODEL } from "@/constants";

/**
 * Business logic service for vector embedding generation and RAG similarity matching.
 */
export class EmbeddingService {
  constructor(private client?: SupabaseClient<Database>) {}

  /**
   * Generates vector embeddings for chunks in batches using Google Gemini API (`gemini-embedding-2`).
   * Batching prevents HTTP 429 rate limit errors while maintaining original chunk structures.
   *
   * @param input - Data payload containing chunks array and optional batch configuration.
   * @returns BaseResponse containing embedded chunks.
   */
  async generateChunkEmbeddings<T extends AnyChunkItem>(
    input: GenerateEmbeddingInput<T>
  ): Promise<BaseResponse<{ chunks: EmbeddedChunkResult<T>[] }>> {
    try {
      const { chunks, batchSize = 5, batchDelayMs = 500 } = input;

      if (!chunks || chunks.length === 0) {
        return createErrorResponse<{ chunks: EmbeddedChunkResult<T>[] }>(
          "Tidak ada bagian yang bisa diproses.",
          { chunks: [] }
        );
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return createErrorResponse<{ chunks: EmbeddedChunkResult<T>[] }>(
          "API key Gemini tidak ditemukan pada konfigurasi server.",
          { chunks: [] }
        );
      }

      const ai = new GoogleGenAI({ apiKey });
      const batches = chunkArray(chunks, batchSize);
      const embeddedChunks: EmbeddedChunkResult<T>[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        for (const chunk of batch) {
          const textToEmbed =
            "search_intent" in chunk
              ? chunk.search_intent
              : "text" in chunk
              ? chunk.text
              : chunk.content;
          const values = await this.embedContentWithRetry(ai, textToEmbed);

          embeddedChunks.push({
            ...chunk,
            embedding: values,
          } as EmbeddedChunkResult<T>);

          if (batchDelayMs > 0) {
            await sleep(batchDelayMs);
          }
        }
      }

      return createSuccessResponse(
        { chunks: embeddedChunks },
        "Embedding berhasil dibuat untuk semua bagian dokumen."
      );
    } catch (error) {
      console.error("[EmbeddingService.generateChunkEmbeddings] error:", error);
      const rawMsg = error instanceof Error ? error.message : "Gagal membuat embedding dokumen.";
      return createErrorResponse<{ chunks: EmbeddedChunkResult<T>[] }>(
        formatLimitationErrorMessage(rawMsg),
        { chunks: [] }
      );
    }
  }

  /**
   * Executes Gemini embedContent API call with automatic retry logic for HTTP 429 rate limit errors using exponential backoff.
   *
   * @param ai             - Initialized GoogleGenAI instance.
   * @param text           - Text content to convert into vector embeddings.
   * @param maxRetries     - Maximum retry attempts (default: 3).
   * @param initialDelayMs - Base delay in milliseconds for exponential backoff (default: 1500ms).
   */
  private async embedContentWithRetry(
    ai: GoogleGenAI,
    text: string,
    maxRetries = 3,
    initialDelayMs = 1500
  ): Promise<number[]> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const response = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: text,
          config: {
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: 768,
          },
        });

        return response.embeddings?.[0]?.values ?? [];
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null
            ? JSON.stringify(error)
            : String(error);

        const is429 =
          errorMsg.includes("429") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("Quota") ||
          errorMsg.includes("rate");

        if (is429 && attempt < maxRetries) {
          attempt++;
          const backoffMs = initialDelayMs * Math.pow(2, attempt - 1);
          console.warn(
            `[EmbeddingService] Rate limit 429 encountered (Attempt ${attempt}/${maxRetries}). Retrying in ${backoffMs}ms...`
          );
          await sleep(backoffMs);
        } else {
          throw error;
        }
      }
    }
    return [];
  }

  /**
   * Performs vector similarity matching for chunk embeddings against the legal articles repository in Supabase.
   *
   * @param embeddedChunks - Chunks adorned with vector embeddings.
   * @param options         - Similarity search parameters (threshold, count).
   * @returns BaseResponse containing matched regulations for each chunk.
   */
  async matchChunkEmbeddings<T extends { embedding: number[] }>(
    embeddedChunks: T[],
    options: MatchOptions = {}
  ): Promise<BaseResponse<{ chunks: MatchedChunkResult<T>[] }>> {
    try {
      if (!embeddedChunks || embeddedChunks.length === 0) {
        return createErrorResponse<{ chunks: MatchedChunkResult<T>[] }>(
          "Tidak ada embedding yang dapat dicocokkan.",
          { chunks: [] }
        );
      }

      const supabase = this.client ?? createAdminClient();
      const legalArticleRepo = createLegalArticleRepository(supabase);

      const matchThreshold = options.matchThreshold ?? 0.5;
      const matchCount = options.matchCount ?? 3;

      const matchedChunks = await Promise.all(
        embeddedChunks.map(async (chunk) => {
          const { data, error } = await legalArticleRepo.matchArticles({
            queryEmbedding: chunk.embedding,
            matchThreshold,
            matchCount,
          });

          const matchedRegulations: MatchLegalArticleResult[] =
            !error && Array.isArray(data)
              ? (data as MatchLegalArticleResult[])
              : [];

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { embedding: _embedding, ...chunkWithoutEmbedding } = chunk;

          return {
            ...chunkWithoutEmbedding,
            matched_regulations: matchedRegulations,
          } as MatchedChunkResult<T>;
        })
      );

      return createSuccessResponse(
        { chunks: matchedChunks },
        "Pencarian regulasi berhasil dilakukan."
      );
    } catch (error) {
      console.error("[EmbeddingService.matchChunkEmbeddings] error:", error);
      return createErrorResponse<{ chunks: MatchedChunkResult<T>[] }>(
        error instanceof Error
          ? error.message
          : "Gagal mencocokkan regulasi hukum.",
        { chunks: [] }
      );
    }
  }
}

/**
 * Factory function to create an EmbeddingService instance.
 */
export function createEmbeddingService(client?: SupabaseClient<Database>) {
  return new EmbeddingService(client);
}

export const embeddingService = new EmbeddingService();
