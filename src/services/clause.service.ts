import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.type";
import type { BaseResponse } from "@/types/response.type";
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
} from "@/lib/response";
import {
  reviewClauseSchema,
  saveClauseReviewsSchema,
  deleteClauseReviewSchema,
  type ReviewClauseInput,
  type SaveClauseReviewsInput,
  type DeleteClauseReviewInput,
} from "@/app/validations/clause.validation";
import {
  DraftRepository,
  createDraftRepository,
} from "@/repositories/draft.repository";
import { createLegalArticleRepository } from "@/repositories/legal-article.repository";
import { EmbeddingService } from "@/services/embedding.service";
import { groqService } from "@/services/groq.service";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type ClauseReviewItem,
  type LegalArticlesRow,
  type ReviewClauseResponse,
  type SaveClauseReviewsResponse,
  GROQ_CLAUSE_REVIEW_SCHEMA,
} from "@/types/clause.type";
import type { DraftClauseChunk } from "@/types/embedding.type";
import type { MatchLegalArticleResult } from "@/types/legal.type";

/**
 * Business logic service managing clause reviews for contract drafts.
 */
export class ClauseService {
  constructor(
    private readonly draftRepo: DraftRepository = new DraftRepository(createAdminClient()),
    private readonly embeddingService: EmbeddingService = new EmbeddingService(createAdminClient()),
    private readonly supabase: SupabaseClient<Database> = createAdminClient()
  ) {}

  withClient(client: SupabaseClient<Database>) {
    return new ClauseService(
      createDraftRepository(client),
      new EmbeddingService(client),
      client
    );
  }

  /**
   * Verifies if user has ownership or editor access to the contract draft.
   */
  private async verifyDraftAccess(_userId: string, contractId: string): Promise<boolean> {
    const draftResult = await this.draftRepo.findDraftById(contractId);
    return Boolean(draftResult.data);
  }

  /**
   * Evaluates a clause using RAG semantic retrieval + Groq LLM (Qwen 3.6 27B).
   * Persists the resulting review item into contract_draft.review_metadata array.
   *
   * @param userId - ID of authenticated user.
   * @param input  - Review clause payload.
   * @returns BaseResponse containing created/updated review item and full reviews array.
   */
  async reviewClause(
    userId: string,
    input: ReviewClauseInput
  ): Promise<ReviewClauseResponse> {
    try {
      const validation = reviewClauseSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data klausul tidak valid."
        );
      }

      const { contractId, clauseText, highlightId, currentReviews = [] } = validation.data;

      const hasAccess = await this.verifyDraftAccess(userId, contractId);
      if (!hasAccess) {
        return createErrorResponse("Anda tidak memiliki izin untuk mereview draft kontrak ini.");
      }

      // Step 1: Semantic vector embedding & statutory retrieval (RAG)
      let matchedRegulations: MatchLegalArticleResult[] = [];
      try {
        const embeddingRes = await this.embeddingService.generateChunkEmbeddings<DraftClauseChunk>({
          chunks: [{ clause_name: "Klausul Kontrak", search_intent: clauseText }],
        });

        if (embeddingRes.success && embeddingRes.data?.chunks?.[0]?.embedding) {
          const matchRes = await this.embeddingService.matchChunkEmbeddings(
            [{ embedding: embeddingRes.data.chunks[0].embedding }],
            { matchThreshold: 0.45, matchCount: 5 }
          );

          if (matchRes.success && matchRes.data?.chunks?.[0]?.matched_regulations) {
            matchedRegulations = matchRes.data.chunks[0].matched_regulations;
          }
        }
      } catch (err) {
        console.warn("[ClauseService] RAG retrieval encountered non-critical error:", err);
      }

      // Step 2: Format prompt for Groq LLM
      const regulationsContext =
        matchedRegulations.length > 0
          ? matchedRegulations
              .map(
                (art) =>
                  `[ID: ${art.id}] ${art.code ? `${art.code} - ` : (art.name ? `${art.name} - ` : "")}Pasal ${art.article_number}${
                    art.book_title ? ` (${art.book_title})` : ""
                  }:\n${art.content}`
              )
              .join("\n\n")
          : "Tidak ada pasal hukum spesifik yang ditemukan di database.";

      const systemPrompt = `Anda adalah Asisten Analis Klausul Kontrak yang bertugas membantu orang awam memahami klausul kontrak secara cepat, objektif, dan jelas.

TUGAS ANDA:
1. Penjelasan Klausul: Jelaskan maksud dan isi klausul secara singkat, padat, dan jelas dengan bahasa sehari-hari yang mudah dimengerti orang awam (maksimal 2 kalimat, tanpa istilah teknis hukum).
2. Analisis Kondisi & Anomali: Jelaskan secara deskriptif dan normal (DILARANG menggunakan kata atau judul kaku seperti "Status Anomali"). Sampaikan secara mengalir apakah klausul tersebut wajar, sah secara hukum, berat sebelah/timpang, atau melanggar aturan.
3. Deteksi Placeholder / Bagian Kosong: Jika di dalam klausul terdapat placeholder (seperti tanda kurung siku [...], [Nama], [Tanggal], [Nominal]), garis bawah (___), atau titik-titik, sampaikan dengan jelas bahwa bagian tersebut masih belum diisi atau masih kosong dan perlu dilengkapi.
4. Ringkas & Padat: Masing-masing bagian berikan respon yang ringkas dan padat (maksimal 2 kalimat).
5. DILARANG memberikan rekomendasi perbaikan kalimat atau saran klausul pengganti.
6. Cantumkan ID pasal regulasi pada cited_article_ids jika terdapat pasal yang benar-benar relevan dari database, atau kosongkan jika tidak ada.`;

      const userPrompt = `TINJAU KLAUSUL BERIKUT:
"""
${clauseText}
"""

REFERENSI REGULASI TERKAIT:
${regulationsContext}

Berikan respons terstruktur sesuai skema JSON:
- explanation: penjelasan klausul secara singkat, padat, dan jelas bagi orang awam.
- anomaly_analysis: penjelasan deskriptif apakah klausul aman/sah, timpang sebelah, melanggar aturan, atau ada placeholder/bagian yang belum diisi/kosong (tanpa kata "Status Anomali").
- cited_article_ids: daftar ID pasal regulasi yang relevan jika ada.`;

      // Step 3: Execute Groq LLM call with retry
      const llmResponse = await groqService.generateCompletion(
        userPrompt,
        {
          systemInstruction: systemPrompt,
          responseSchema: GROQ_CLAUSE_REVIEW_SCHEMA,
          temperature: 0.1,
        },
        3
      );

      // Abort immediately without saving if AI review fails
      if (!llmResponse.success || !llmResponse.data?.text) {
        return createErrorResponse(
          llmResponse.error || "Gagal melakukan analisis terhadap klausul. Silakan coba lagi."
        );
      }

      let explanationText = "";
      let anomalyText = "";
      let citedIds: string[] = [];

      try {
        const raw = llmResponse.data.text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(raw);
        if (parsed.explanation) {
          explanationText = parsed.explanation;
        }
        if (parsed.anomaly_analysis) {
          anomalyText = parsed.anomaly_analysis;
        } else if (parsed.anomaly_status) {
          anomalyText = parsed.anomaly_status;
        } else if (parsed.legal_reasoning && !explanationText) {
          explanationText = parsed.legal_reasoning;
        }
        if (Array.isArray(parsed.cited_article_ids)) {
          citedIds = parsed.cited_article_ids;
        }
      } catch {
        explanationText = llmResponse.data.text.trim();
      }

      if (!explanationText && !anomalyText) {
        return createErrorResponse(
          "Hasil penjelasan klausul tidak valid atau kosong. Silakan coba lagi."
        );
      }

      // Step 4: Determine referenced statutory articles
      let finalReferences: MatchLegalArticleResult[] = [];
      if (citedIds.length > 0) {
        finalReferences = matchedRegulations.filter((art) => citedIds.includes(art.id));
      }

      // Fallback matching: if cited IDs empty, check if article number is mentioned in text
      if (finalReferences.length === 0 && matchedRegulations.length > 0) {
        const combinedLower = `${explanationText} ${anomalyText}`.toLowerCase();
        finalReferences = matchedRegulations.filter((art) => {
          const num = art.article_number.toLowerCase().trim();
          return num && combinedLower.includes(num);
        });
      }

      // If still empty but matchedRegulations exist, attach top 2 as context references
      if (finalReferences.length === 0 && matchedRegulations.length > 0) {
        finalReferences = matchedRegulations.slice(0, 2);
      }

      // Step 5: Format final result string (descriptive paragraphs without rigid labels)
      const fullResultString =
        explanationText && anomalyText
          ? `${explanationText}\n\n${anomalyText}`
          : explanationText || anomalyText;

      const now = new Date().toISOString();
      const reviewId = highlightId || `clause-${Date.now()}`;

      const newReviewItem: ClauseReviewItem = {
        id: reviewId,
        clauseText,
        result: fullResultString,
        references: finalReferences,
        createdAt: now,
        updatedAt: now,
      };

      // Step 6: Update reviews array directly from hook state without SELECT query
      const existingIdx = currentReviews.findIndex((r) => r.id === reviewId);
      let updatedReviews: ClauseReviewItem[];

      if (existingIdx >= 0) {
        updatedReviews = currentReviews.map((item, idx) =>
          idx === existingIdx
            ? {
                ...item,
                clauseText,
                result: fullResultString,
                references: finalReferences,
                updatedAt: now,
              }
            : item
        );
      } else {
        updatedReviews = [...currentReviews, newReviewItem];
      }

      // Step 7: Persist array to database
      const saveResult = await this.draftRepo.updateReviewMetadata(contractId, updatedReviews);
      if (saveResult.error) {
        return createErrorResponse(mapSupabaseError(saveResult.error.message));
      }

      return createSuccessResponse(
        {
          review: newReviewItem,
          reviews: updatedReviews,
        },
        "Klausul berhasil di-review."
      );
    } catch (error) {
      console.error("[ClauseService.reviewClause] Unexpected error:", error);
      return createErrorResponse("Terjadi kesalahan saat memproses review klausul.");
    }
  }

  /**
   * Directly persists updated reviews array to contract_draft.review_metadata without SELECT.
   *
   * @param userId     - ID of authenticated user.
   * @param input      - Contract ID and updated reviews array.
   * @returns BaseResponse with persisted reviews list.
   */
  async saveReviews(
    userId: string,
    input: SaveClauseReviewsInput
  ): Promise<SaveClauseReviewsResponse> {
    try {
      const validation = saveClauseReviewsSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data review tidak valid."
        );
      }

      const { contractId, reviews } = validation.data;

      const hasAccess = await this.verifyDraftAccess(userId, contractId);
      if (!hasAccess) {
        return createErrorResponse("Anda tidak memiliki izin untuk mengubah draft kontrak ini.");
      }

      const saveResult = await this.draftRepo.updateReviewMetadata(
        contractId,
        reviews as ClauseReviewItem[]
      );

      if (saveResult.error) {
        return createErrorResponse(mapSupabaseError(saveResult.error.message));
      }

      return createSuccessResponse(
        { reviews: reviews as ClauseReviewItem[] },
        "Review klausul berhasil disimpan."
      );
    } catch (error) {
      console.error("[ClauseService.saveReviews] Error:", error);
      return createErrorResponse("Terjadi kesalahan saat menyimpan review klausul.");
    }
  }

  /**
   * Deletes a review item from a provided reviews array and updates database.
   *
   * @param userId         - ID of authenticated user.
   * @param input          - Target contract and clause ID.
   * @param currentReviews - Active reviews array from hook state.
   * @returns BaseResponse with updated reviews list.
   */
  async deleteReview(
    userId: string,
    input: DeleteClauseReviewInput,
    currentReviews: ClauseReviewItem[] = []
  ): Promise<SaveClauseReviewsResponse> {
    try {
      const validation = deleteClauseReviewSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data tidak valid."
        );
      }

      const { contractId, clauseId } = validation.data;

      const hasAccess = await this.verifyDraftAccess(userId, contractId);
      if (!hasAccess) {
        return createErrorResponse("Anda tidak memiliki izin untuk menghapus review ini.");
      }

      const updatedReviews = currentReviews.filter((r) => r.id !== clauseId);

      const saveResult = await this.draftRepo.updateReviewMetadata(contractId, updatedReviews);
      if (saveResult.error) {
        return createErrorResponse(mapSupabaseError(saveResult.error.message));
      }

      return createSuccessResponse(
        { reviews: updatedReviews },
        "Review klausul berhasil dihapus."
      );
    } catch (error) {
      console.error("[ClauseService.deleteReview] Error:", error);
      return createErrorResponse("Terjadi kesalahan saat menghapus review klausul.");
    }
  }
}

export const clauseService = new ClauseService();

export function createClauseService(client?: SupabaseClient<Database>) {
  return client ? clauseService.withClient(client) : clauseService;
}
