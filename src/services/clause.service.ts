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
import { EmbeddingService } from "@/services/embedding.service";
import { groqService } from "@/services/groq.service";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type ClauseReviewItem,
  type ClauseReviewStatus,
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

      const {
        contractId,
        clauseText,
        highlightId,
        currentReviews = [],
        saveToDatabase,
      } = validation.data;

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

      const systemPrompt = `Anda adalah Asisten Analis Klausul Kontrak yang bertugas membantu memahami klausul kontrak secara cepat, objektif, dan jelas.

TUGAS ANDA:
Klasifikasikan teks klausul yang diberikan ke dalam SALAH SATU dari 5 status berikut dan berikan hasil review terstruktur:

1. "AMBIGUOUS":
   - Pilih status ini jika teks yang dipilih pengguna TIDAK JELAS, hanya sebagian kalimat tidak utuh, hanya serpihan huruf/kata yang terpotong, atau tidak memiliki makna yang lengkap.
   - PENTING: Untuk status AMBIGUOUS, DILARANG menjelaskan teks/klausul yang dipilih pengguna! Set 'explanation' menjadi string kosong "".
   - Pada 'analysis': Jelaskan secara singkat (1-2 kalimat) bahwa klausul atau teks yang dipilih masih ambigu, tidak lengkap, atau berupa potongan kata sehingga maknanya tidak dapat dianalisis.
   - 'has_risk': WAJIB bernilai false.

2. "VIOLATES_LAW":
   - Pilih status ini jika klausul sudah jelas dan isinya secara substantif berpotensi melanggar hukum atau peraturan perundang-undangan di Indonesia.
   - Pada 'explanation': Jelaskan isi dan maksud klausul secara singkat dan padat (1-2 kalimat).
   - Pada 'analysis': Jelaskan secara singkat pasal mana yang dilanggar dan pada undang-undang mana (1-2 kalimat).
   - 'has_risk': WAJIB bernilai true.
   - Cantumkan ID pasal yang relevan dari referensi regulasi di 'cited_article_ids' jika tersedia.

3. "UNFAIR_ONE_SIDED":
   - Pilih status ini jika klausul tidak melanggar ketentuan perundang-undangan secara langsung, namun berpotensi berat sebelah, timpang, atau secara tidak adil merugikan salah satu pihak.
   - Pada 'explanation': Jelaskan isi dan maksud klausul secara singkat dan padat (1-2 kalimat).
   - Pada 'analysis': Jelaskan secara singkat mengapa klausul tersebut berpotensi berat sebelah dan pihak mana yang berpotensi dirugikan (1-2 kalimat).
   - 'has_risk': WAJIB bernilai true.

4. "INCOMPLETE":
   - Pilih status ini HANYA jika di dalam teks klausul SECARA NYATA terdapat placeholder kosong atau bagian yang belum diisi, seperti tanda kurung siku [...], [Nama], [Tanggal], [Nominal], garis bawah kosong (___), atau titik-titik (...) yang belum dilengkapi.
   - PENTING: DILARANG menganggap klausul tidak lengkap hanya karena tidak mencantumkan jadwal pembayaran, mekanisme teknis lanjutan, atau kalimat terbilang (misal kata 'Rupiah' setelah 'Rp'). Hal-hal tersebut lumrah diatur di pasal lain. Jika teks klausul sudah merupakan kalimat utuh tanpa tanda placeholder/kosong, JANGAN pilih INCOMPLETE!
   - Pada 'explanation': Jelaskan isi dan maksud klausul secara singkat dan padat (1-2 kalimat).
   - Pada 'analysis': Jelaskan secara singkat tanda placeholder/bagian kosong mana yang nyata tertulis dan belum diisi (1-2 kalimat).
   - 'has_risk': WAJIB bernilai true.

5. "SAFE":
   - Pilih status ini jika klausul jelas, wajar/seimbang bagi para pihak, tidak melanggar hukum, dan tidak memiliki placeholder kosong.
   - PENTING: Evaluasi HANYA apa yang tertulis dalam potongan klausul ini. Jangan mencari-cari kekurangan seperti jadwal pembayaran atau pasal pelengkap lain yang biasanya ada di pasal terpisah. Jika klausul menyatakan nilai pembayaran atau hak/kewajiban standar secara wajar, pilih SAFE!
   - Pada 'explanation': Jelaskan isi dan maksud klausul secara singkat dan jelas (1-2 kalimat).
   - Pada 'analysis': Cukup sampaikan bahwa klausul ini wajar, jelas, dan aman.
   - 'has_risk': WAJIB bernilai false.

ATURAN WAJIB BAHASA & EVALUASI:
- Evaluasi klausul HANYA berdasarkan isi klausul itu sendiri, bukan menuntut seluruh kontrak berada dalam satu klausul.
- DILARANG KERAS menggunakan kata-kata teknis atau istilah hukum rumit (seperti wanprestasi, force majeure, klausula eksonerasi, ganti rugi imateriel, yurisdiksi, dll) pada SEMUA tipe hasil review. Gunakan bahasa sehari-hari yang santai, lugas, dan mudah dipahami orang awam.
- Pastikan klausul dijelaskan secara singkat terlebih dahulu pada 'explanation', KECUALI jika statusnya "AMBIGUOUS" ('explanation' harus string kosong "").
- DILARANG memberikan saran revisi redaksional atau klausul alternatif.`;

      const userPrompt = `TINJAU KLAUSUL BERIKUT:
"""
${clauseText}
"""

REFERENSI REGULASI TERKAIT:
${regulationsContext}

Berikan respons terstruktur sesuai skema JSON:
- status: salah satu dari "AMBIGUOUS" | "VIOLATES_LAW" | "UNFAIR_ONE_SIDED" | "INCOMPLETE" | "SAFE"
- explanation: penjelasan maksud klausul dengan bahasa awam yang mudah dipahami (WAJIB kosong jika AMBIGUOUS)
- analysis: uraian hasil review tanpa istilah teknis (pasal & UU jika VIOLATES_LAW; kerugian sepihak jika UNFAIR_ONE_SIDED; bagian placeholder yang belum lengkap jika INCOMPLETE; keterangan ambigu jika AMBIGUOUS; pernyataan aman jika SAFE)
- has_risk: boolean (false jika AMBIGUOUS atau SAFE; true jika VIOLATES_LAW, UNFAIR_ONE_SIDED, atau INCOMPLETE)
- cited_article_ids: daftar ID regulasi yang dilanggar/dirujuk jika ada`;

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

      let status: ClauseReviewStatus = "AMBIGUOUS";
      let explanationText = "";
      let analysisText = "";
      let hasRisk = false;
      let citedIds: string[] = [];

      try {
        const raw = llmResponse.data.text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(raw);

        // Normalize status enum
        if (
          parsed.status === "AMBIGUOUS" ||
          parsed.status === "VIOLATES_LAW" ||
          parsed.status === "UNFAIR_ONE_SIDED" ||
          parsed.status === "INCOMPLETE" ||
          parsed.status === "SAFE"
        ) {
          status = parsed.status;
        } else if (parsed.status === "AMBIGOUS") {
          status = "AMBIGUOUS";
        }

        if (parsed.explanation && status !== "AMBIGUOUS") {
          explanationText = String(parsed.explanation).trim();
        }

        if (parsed.analysis) {
          analysisText = String(parsed.analysis).trim();
        } else if (parsed.anomaly_analysis) {
          analysisText = String(parsed.anomaly_analysis).trim();
        }

        // Automatic risk assignment: true for VIOLATES_LAW, UNFAIR_ONE_SIDED, and INCOMPLETE; false for AMBIGUOUS and SAFE
        hasRisk =
          status === "VIOLATES_LAW" ||
          status === "UNFAIR_ONE_SIDED" ||
          status === "INCOMPLETE";

        if (Array.isArray(parsed.cited_article_ids)) {
          citedIds = parsed.cited_article_ids;
        }
      } catch {
        analysisText = llmResponse.data.text.trim();
        hasRisk = false;
      }

      if (!explanationText && !analysisText) {
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
        const combinedLower = `${explanationText} ${analysisText}`.toLowerCase();
        finalReferences = matchedRegulations.filter((art) => {
          const num = art.article_number.toLowerCase().trim();
          return num && combinedLower.includes(num);
        });
      }

      // If still empty but matchedRegulations exist, attach top 2 as context references only for VIOLATES_LAW
      if (status === "VIOLATES_LAW" && finalReferences.length === 0 && matchedRegulations.length > 0) {
        finalReferences = matchedRegulations.slice(0, 2);
      }

      // Step 5: Format final result string
      // If SAFE: only the brief clause explanation without extra labels
      // If AMBIGUOUS: only the brief ambiguity notice (no clause explanation prefix)
      // Otherwise: brief clause explanation first, followed by the specific analysis
      let fullResultString = "";
      if (status === "SAFE") {
        fullResultString = explanationText || analysisText || "Klausul ini wajar, seimbang, dan aman.";
      } else if (status === "AMBIGUOUS") {
        fullResultString =
          analysisText ||
          "Teks yang dipilih masih ambigu atau tidak lengkap sehingga tidak dapat dianalisis.";
      } else {
        fullResultString =
          explanationText && analysisText
            ? `${explanationText}\n\n${analysisText}`
            : explanationText || analysisText;
      }

      const now = new Date().toISOString();
      const reviewId = highlightId || `clause-${Date.now()}`;

      const newReviewItem: ClauseReviewItem = {
        id: reviewId,
        clauseText,
        result: fullResultString,
        references: finalReferences,
        status,
        hasRisk,
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
                status,
                hasRisk,
                updatedAt: now,
              }
            : item
        );
      } else {
        updatedReviews = [...currentReviews, newReviewItem];
      }

      // Step 7: Persist array to database if saveToDatabase is true (or not specified)
      if (saveToDatabase !== false) {
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
      }

      // If saveToDatabase is false, return new review item without persisting to database
      return createSuccessResponse(
        {
          review: newReviewItem,
          reviews: currentReviews,
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
