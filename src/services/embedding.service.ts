import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import { chunkArray, sleep } from "@/lib/utils";
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
   * Generates vector embeddings in batches using Google Gemini API (`gemini-embedding-2`).
   * Batching prevents HTTP 429 rate limit errors while maintaining original chunk structures.
   *
   * @param input - Data payload containing chunks array and optional batch configuration.
   * @returns BaseResponse containing embedded chunks.
   */
  async generateEmbeddings<T extends AnyChunkItem>(
    input: GenerateEmbeddingInput<T>
  ): Promise<BaseResponse<{ chunks: EmbeddedChunkResult<T>[] }>> {
    try {
      const { chunks, batchSize = 5, batchDelayMs = 500 } = input;

      if (!chunks || chunks.length === 0) {
        return createErrorResponse<{ chunks: EmbeddedChunkResult<T>[] }>(
          "Tidak ada bagian dokumen yang dapat diproses.",
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

        const batchResults = await Promise.all(
          batch.map(async (chunk) => {
            const textToEmbed = "text" in chunk ? chunk.text : chunk.content;

            const response = await ai.models.embedContent({
              model: EMBEDDING_MODEL,
              contents: textToEmbed,
              config: {
                taskType: "RETRIEVAL_DOCUMENT",
                outputDimensionality: 768,
              },
            });

            const values = response.embeddings?.[0]?.values ?? [];

            return {
              ...chunk,
              embedding: values,
            } as EmbeddedChunkResult<T>;
          })
        );

        embeddedChunks.push(...batchResults);

        if (i < batches.length - 1 && batchDelayMs > 0) {
          await sleep(batchDelayMs);
        }
      }

      return createSuccessResponse(
        { chunks: embeddedChunks },
        "Embedding berhasil dibuat untuk semua bagian dokumen."
      );
    } catch (error) {
      console.error("[EmbeddingService.generateEmbeddings] error:", error);
      return createErrorResponse<{ chunks: EmbeddedChunkResult<T>[] }>(
        error instanceof Error
          ? error.message
          : "Gagal membuat embedding dokumen.",
        { chunks: [] }
      );
    }
  }

  /**
   * Performs vector similarity matching against the legal articles repository in Supabase.
   *
   * @param embeddedChunks - Chunks adorned with vector embeddings.
   * @param options         - Similarity search parameters (threshold, count).
   * @returns BaseResponse containing matched regulations for each chunk.
   */
  async matchEmbeddings<T extends { embedding: number[] }>(
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
      console.error("[EmbeddingService.matchEmbeddings] error:", error);
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
