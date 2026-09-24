import type { SupabaseClient } from "@supabase/supabase-js";

import {
  uploadContractDocumentSchema,
  searchReviewsSchema,
  deleteReviewSchema,
} from "@/app/validations/contract.validation";
import { decryptContractContent, encryptContractContent } from "@/lib/contract-encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
} from "@/lib/response";
import {
  buildDocumentOutlinePrompt,
  chunkArray,
  formatRegulationsForPrompt,
  isLimitationError,
  sanitizeString,
  serializeSectionWithTags,
  sleep,
} from "@/lib/utils";
import { ReviewRepository, createReviewRepository } from "@/repositories/review.repository";
import { geminiService } from "@/services/gemini.service";
import { groqService } from "@/services/groq.service";
import type { Database } from "@/types/database.type";
import type { UploadContractDocumentDTO } from "@/types/contract.type";
import {
  type ChunkReasoningResult,
  type MatchedChunk,
  type MatchedDocumentChunk,
  type PaginatedReviewsData,
  type ReasoningAnalysisResult,
  type ReviewSearchItem,
  type SearchReviewsDTO,
} from "@/types/contract-review.type";
import type { ComplianceStatus, LegalArticle, MatchLegalArticleResult } from "@/types/legal.type";
import type { DocumentSection } from "@/types/common.type";
import {
  groqReasoningBatchSchema,
  reasoningBatchSchema,
  type LlmChunkOutput,
  type LlmProvider,
} from "@/types/llm.type";
import type { BaseResponse } from "@/types/response.type";

/**
 * Calculates dynamic LLM batch size based on total analyzable chunks count.
 * Rules:
 * 1. 1 - 4 chunks   -> batch size = 2
 * 2. 5 - 10 chunks  -> batch size = 3
 * 3. 11 - 18 chunks -> batch size = 2
 * 4. 19+ chunks     -> batch size = 3
 */
function calculateDynamicBatchSize(totalChunks: number): number {
  if (totalChunks <= 4) return 2;
  if (totalChunks <= 10) return 3;
  if (totalChunks <= 18) return 2;
  return 3;
}

/** Delay between sequential LLM batch calls for rate-limiting safety (ms). */
const RATE_LIMIT_DELAY_MS = 1500;

/** Unit types that are eligible for legal compliance reasoning. */
const ANALYZABLE_UNIT_TYPES = new Set(["clause", "fallback"]);

/** Compliance statuses that are counted as risky in contract findings. */
const RISKY_STATUSES = new Set<ComplianceStatus>([
  "VIOLATES_LAW",
  "UNFAIR_ONE_SIDED",
  "INCOMPLETE",
]);

/** Constant empty reasoning result structure for fast fallback returns. */
const EMPTY_REASONING_RESULT: ReasoningAnalysisResult = {
  total_analyzed_clauses: 0,
  risky_clauses_count: 0,
  findings: [],
};

/**
 * Service orchestrating contract review document uploads and AI legal compliance reasoning.
 */
export class ReviewService {
  private readonly repository: ReviewRepository;

  constructor(client: SupabaseClient<Database> = createAdminClient()) {
    this.repository = createReviewRepository(client);
  }

  /**
   * Validates the upload payload, encrypts contract content and metadata, and persists a contract review record
   * via the `save_contract_review_result` (or `upload_contract_review`) PostgreSQL RPC transaction.
   *
   * @param userId  - The authenticated user's ID.
   * @param input   - The validated upload DTO.
   * @returns BaseResponse containing the created contract ID.
   */
  async uploadReviewDocument(
    userId: string,
    input: UploadContractDocumentDTO
  ): Promise<BaseResponse<{ id: string }>> {
    const validation = uploadContractDocumentSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse(
        validation.error.issues[0]?.message ?? "Data dokumen tidak valid."
      );
    }

    const { title, fileName, fileSize, content } = validation.data;
    const fairnessScore = input.fairnessScore ?? 0;
    const totalRisk = input.totalRisk ?? 0;
    const rawMetadata = {
      source_file_name: fileName,
      file_size: fileSize,
      ...(input.metadata ?? {}),
    };

    // Encrypt contract content and reasoning metadata before persisting to database
    const encryptedContent = content ? encryptContractContent(content) : "";
    const encryptedMetadata = {
      payload: encryptContractContent(JSON.stringify(rawMetadata)),
      encryption: "aes-256-gcm",
    };

    const { data, error } = await this.repository.uploadContractReviewTransaction(
      {
        user_id: userId,
        title,
        type: "review",
        is_pinned: false,
      },
      {
        content: encryptedContent,
        fairness_score: fairnessScore,
        total_clausul_risk: totalRisk,
        metadata: encryptedMetadata,
      }
    );

    if (error || !data) {
      console.error("[ReviewService.uploadReviewDocument] Error:", error);
      return createErrorResponse(
        "Gagal menyimpan dokumen kontrak. Silakan coba lagi."
      );
    }

    return createSuccessResponse(
      { id: (data.contract as { id: string }).id },
      "Dokumen kontrak berhasil diunggah."
    );
  }

  /**
   * Fetches the complete contract review details by contract ID, decrypting encrypted content and metadata.
   *
   * @param userId     - The authenticated user's ID.
   * @param contractId - The contract ID to retrieve.
   * @returns BaseResponse containing contract detail and review findings.
   */
  async getReviewDetail(userId: string, contractId: string) {
    const { data, error } = await this.repository.findById(userId, contractId);
    if (error || !data) {
      return createErrorResponse("Dokumen review tidak ditemukan.");
    }

    const review = (data as any).contract_review;
    const rawContent = review?.content ?? "";
    let content = "";
    if (rawContent) {
      try {
        content = decryptContractContent(rawContent);
      } catch {
        content = rawContent;
      }
    }

    const rawMetadata = (review?.metadata as Record<string, unknown>) ?? {};
    let metadata: Record<string, unknown> = rawMetadata;

    if (
      rawMetadata &&
      typeof rawMetadata === "object" &&
      "payload" in rawMetadata &&
      typeof rawMetadata.payload === "string"
    ) {
      try {
        const decryptedStr = decryptContractContent(rawMetadata.payload);
        metadata = JSON.parse(decryptedStr);
      } catch (err) {
        console.error("[ReviewService.getReviewDetail] Metadata decryption failed:", err);
        metadata = rawMetadata;
      }
    }

    const findings = metadata.findings ?? null;

    return createSuccessResponse(
      {
        id: data.id,
        title: data.title,
        content,
        fairnessScore: review?.fairness_score ?? 0,
        totalRisk: review?.total_clausul_risk ?? 0,
        metadata,
        findings,
        createdAt: data.created_at || (review as any)?.created_at || null,
      },
      "Data review berhasil didapatkan."
    );
  }

  /**
   * Runs legal compliance reasoning over matched contract chunks in batches using LLM (Gemini 3.6 Flash).
   * Immediately halts batch execution if an error occurs.
   * If risky clauses were already detected prior to the error, returns success with partial findings.
   * If no risky clauses were detected, returns error response.
   *
   * @param sectionsOrRawText - Array of parsed document sections or raw text string.
   * @param matchedChunks      - Array of matched chunks containing vector-matched legal articles.
   * @param provider           - LLM provider choice (default: "groq").
   * @returns BaseResponse containing the full or partial ReasoningAnalysisResult.
   */
  async processReasoning(
    sectionsOrRawText: DocumentSection[] | string,
    matchedChunks: (MatchedDocumentChunk | MatchedChunk)[],
    provider: LlmProvider = "groq"
  ): Promise<BaseResponse<ReasoningAnalysisResult>> {
    try {
      if (!matchedChunks || matchedChunks.length === 0) {
        console.log("[ReviewService] processReasoning: Tidak ada chunk yang diterima untuk dieksekusi.");
        return createSuccessResponse(EMPTY_REASONING_RESULT);
      }

      console.log(
        `[ReviewService] processReasoning: Menerima total ${matchedChunks.length} chunk dari hasil pencarian regulasi.`
      );

      const sections = Array.isArray(sectionsOrRawText) ? sectionsOrRawText : [];
      const sectionsMap = new Map(sections.map((sec) => [sec.sectionId, sec]));
      const outlineText = buildDocumentOutlinePrompt(sections);

      const analyzableChunks = this.filterAnalyzableChunks(matchedChunks);
      console.log(
        `[ReviewService] processReasoning: ${analyzableChunks.length} dari ${matchedChunks.length} chunk memiliki rujukan hukum dan siap dieksekusi.`
      );

      if (analyzableChunks.length === 0) {
        return createSuccessResponse(EMPTY_REASONING_RESULT);
      }

      const { findings, hasBatchError, batchErrorMessage } =
        await this.analyzeChunksInBatches(
          analyzableChunks,
          sectionsMap,
          outlineText,
          provider
        );

      const riskyClauses = findings.filter((f) =>
        RISKY_STATUSES.has(f.compliance_status)
      );

      // Scenario A: Error occurred, but risky findings were already detected in earlier batches
      if (hasBatchError && riskyClauses.length > 0) {
        const isLimitation = isLimitationError(batchErrorMessage);
        return createSuccessResponse<ReasoningAnalysisResult>(
          {
            total_analyzed_clauses: findings.length,
            risky_clauses_count: riskyClauses.length,
            findings: riskyClauses,
            has_error: true,
            error_type: isLimitation ? "limitation" : "reasoning",
            error_message: batchErrorMessage,
          },
          `Analisis terhenti lebih awal (${batchErrorMessage}), namun ${riskyClauses.length} klausul berisiko berhasil terdeteksi.`
        );
      }

      // Scenario B: Error occurred and NO risky findings were collected
      if (hasBatchError && riskyClauses.length === 0) {
        const isLimitation = isLimitationError(batchErrorMessage);
        return createErrorResponse<ReasoningAnalysisResult>(
          `Gagal memproses analisis kepatuhan hukum: ${batchErrorMessage}`,
          {
            ...EMPTY_REASONING_RESULT,
            has_error: true,
            error_type: isLimitation ? "limitation" : "reasoning",
            error_message: batchErrorMessage,
          }
        );
      }

      // Scenario C: Reasoning completed normally
      return createSuccessResponse<ReasoningAnalysisResult>(
        {
          total_analyzed_clauses: findings.length,
          risky_clauses_count: riskyClauses.length,
          findings: riskyClauses,
        },
        "Analisis kepatuhan hukum berhasil diselesaikan."
      );
    } catch (error) {
      console.error("[ReviewService.processReasoning] Unexpected error:", error);
      return createErrorResponse<ReasoningAnalysisResult>(
        error instanceof Error
          ? error.message
          : "Gagal menjalankan analisis kepatuhan hukum.",
        EMPTY_REASONING_RESULT
      );
    }
  }

  /**
   * Filters out chunks that lack meaningful text content or valid unit types.
   *
   * @param chunks - Array of matched chunks.
   */
  private filterAnalyzableChunks<T extends MatchedDocumentChunk | MatchedChunk>(
    chunks: T[]
  ): T[] {
    return chunks.filter((chunk) => {
      const text =
        "text" in chunk && typeof chunk.text === "string"
          ? chunk.text
          : "content" in chunk && typeof chunk.content === "string"
          ? chunk.content
          : "";
      if (!text || text.trim().length < 20) return false;

      if (
        "metadata" in chunk &&
        chunk.metadata &&
        typeof chunk.metadata === "object" &&
        "unit_type" in chunk.metadata &&
        typeof (chunk.metadata as { unit_type?: string }).unit_type === "string"
      ) {
        return ANALYZABLE_UNIT_TYPES.has(
          (chunk.metadata as { unit_type: string }).unit_type
        );
      }

      return true;
    });
  }

  /**
   * Groups analyzable chunks into batches and executes sequential LLM reasoning calls.
   * Immediately halts batch execution if an error occurs.
   *
   * @param analyzableChunks - Chunks ready for analysis.
   * @param sectionsMap      - Map of sections by section ID.
   * @param outlineText      - Formatted outline prompt header.
   * @param provider         - Target LLM provider.
   */
  private async analyzeChunksInBatches(
    analyzableChunks: (MatchedDocumentChunk | MatchedChunk)[],
    sectionsMap: Map<string, DocumentSection>,
    outlineText: string,
    provider: LlmProvider
  ): Promise<{
    findings: ChunkReasoningResult[];
    hasBatchError: boolean;
    batchErrorMessage: string;
  }> {
    const findings: ChunkReasoningResult[] = [];
    const batchSize = calculateDynamicBatchSize(analyzableChunks.length);
    const chunkBatches = chunkArray(analyzableChunks, batchSize);
    const systemPrompt = this.buildBatchSystemPrompt();
    let hasBatchError = false;
    let batchErrorMessage = "";

    console.log(
      `[ReviewService] Memulai analisis LLM untuk ${analyzableChunks.length} klausul dalam ${chunkBatches.length} batch (batch size dinamis: ${batchSize}).`
    );

    for (let batchIdx = 0; batchIdx < chunkBatches.length; batchIdx++) {
      const currentBatch = chunkBatches[batchIdx];
      const batchItems = this.prepareBatchItems(currentBatch, sectionsMap);
      const userPrompt = this.buildBatchUserPrompt(outlineText, batchItems);

      const startChunkIdx = batchIdx * batchSize + 1;
      const endChunkIdx = Math.min((batchIdx + 1) * batchSize, analyzableChunks.length);
      console.log(
        `[ReviewService] Mengeksekusi Batch ${batchIdx + 1}/${chunkBatches.length} (Memproses Chunk #${startChunkIdx} s/d #${endChunkIdx} | ${currentBatch.length} chunk)...`
      );

      const { outputs, error } = await this.executeLlmBatchCall(
        userPrompt,
        systemPrompt,
        provider
      );

      if (error) {
        console.error(
          `[ReviewService.analyzeChunksInBatches] Batch ${batchIdx + 1}/${chunkBatches.length} gagal:`,
          error
        );
        hasBatchError = true;
        batchErrorMessage = error;
        // Halts further batch processing immediately
        break;
      }

      const batchFindings = this.mapBatchOutputsToFindings(batchItems, outputs);
      findings.push(...batchFindings);

      console.log(
        `[ReviewService] Batch ${batchIdx + 1}/${chunkBatches.length} berhasil dieksekusi. Ditemukan ${batchFindings.length} hasil analisis.`
      );

      if (batchIdx < chunkBatches.length - 1) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }

    console.log(
      `[ReviewService] Selesai mengeksekusi ${chunkBatches.length} batch. Total temuan terkumpul: ${findings.length}.`
    );

    return { findings, hasBatchError, batchErrorMessage };
  }

  /**
   * Prepares structured prompt payload items for a single batch of chunks.
   *
   * @param batch       - Sub-array of matched chunks for the current batch.
   * @param sectionsMap - Map of sections by section ID.
   */
  private prepareBatchItems(
    batch: (MatchedDocumentChunk | MatchedChunk)[],
    sectionsMap: Map<string, DocumentSection>
  ) {
    return batch.map((chunk) => {
      const chunkId = "chunkId" in chunk ? chunk.chunkId : chunk.chunk_id;
      const sectionId = "sectionId" in chunk ? chunk.sectionId : chunkId;
      const rawChunkText =
        "text" in chunk && typeof chunk.text === "string"
          ? chunk.text
          : "content" in chunk && typeof chunk.content === "string"
          ? chunk.content
          : "";

      const targetSection = sectionsMap.get(sectionId);
      const defaultTagIds = "tagIds" in chunk ? chunk.tagIds : chunk.matched_node_ids;
      const taggedClauseText = targetSection
        ? serializeSectionWithTags(targetSection)
        : `[${(defaultTagIds ?? []).join(", ")}] ${rawChunkText}`;

      const regulationsPromptText = formatRegulationsForPrompt(chunk.matched_regulations);

      return {
        chunk,
        chunkId,
        rawChunkText,
        taggedClauseText,
        regulationsPromptText,
      };
    });
  }

  /**
   * Strips technical tag codes (e.g. `(tag-12)`, `[tag-13]`, `tag-14`) from human-facing reasoning text.
   */
  private stripTagIdsFromText(text: string): string {
    if (!text) return "";
    return text
      .replace(/\(\s*tag-\d+\s*\)/gi, "")
      .replace(/\[\s*tag-\d+\s*\]/gi, "")
      .replace(/\{\s*tag-\d+\s*\}/gi, "")
      .replace(/\btag-\d+\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,;:!?])/g, "$1")
      .trim();
  }

  /**
   * Builds the system prompt for the legal reasoning model (optimized for Qwen & Gemini).
   */
  private buildBatchSystemPrompt(): string {
    return `Anda adalah Asisten Pakar Hukum Kontrak & Compliance Indonesia yang sangat teliti, objektif, dan kritis. Tugas Anda adalah melakukan analisis kepatuhan hukum (legal compliance & fairness review) terhadap klausul-klausul kontrak secara akurat.

METODOLOGI ANALISIS BERTAHAP (CHAIN-OF-THOUGHT):
Lakukan analisis internal secara sistematis sebelum menghasilkan output:
1. Identifikasi Jenis & Fungsi Klausul: Tentukan apakah klausul merupakan pembukaan/identitas, ketentuan umum, hak & kewajiban, sanksi, pemutusan, atau kerahasiaan.
2. Evaluasi Keabsahan & Keseimbangan: Bandingkan hak dan kewajiban antara Pihak Pertama dan Pihak Kedua. Periksa apakah ada pasal perundang-undangan yang dilanggar.
3. Penentuan Status & Pemetaan Tag: Tentukan status kepatuhan (pilih 1 dari 4 status enum) dan cari elemen tag HTML (tag-XX) yang secara presisi menjadi akar masalah.
4. Perumusan Penjelasan & Solusi: Tuliskan alasan hukum yang ringkas, mudah dipahami awam, serta berikan rekomendasi revisi konkret.

KRITERIA KLASIFIKASI STATUS KEPATUHAN (DISCIPLINED ENUM):
- VIOLATES_LAW: Klausul secara eksplisit melanggar regulasi/undang-undang Indonesia yang berlaku (misal: pengabaian hak normatif buruh/hak cipta, pembatalan sepihak melanggar KUHPerdata/UU Ketenagakerjaan). Wajib menyertakan minimal 1 ID regulasi yang dilanggar.
- UNFAIR_ONE_SIDED: Klausul sah secara hukum, tetapi secara ekonomi/hukum SANGAT BERAT SEBELAH atau tidak seimbang (misal: sanksi/denda/ganti rugi hanya dibebankan ke satu pihak, hak akhiri perjanjian sepihak tanpa ganti rugi hanya dimiliki satu pihak).
- INCOMPLETE: Klausul memiliki cacat draft (misal: merujuk pasal internal yang hilang, mengandung nilai/persentase yang belum diisi [...], atau norma acuan yang tidak jelas/menggantung).
- COMPLIANT: Klausul jelas, seimbang, tidak melanggar hukum, ATAU merupakan teks di luar konteks hukum (misal: resep makanan, iklan, catatan acak, dan lainnya).

PRINSIP BAHASA & PENULISAN:
1. BAHASA ALAMI & POPULER: Dilarang keras menyebutkan istilah internal teknis seperti "chunk", "node", "prompt", "JSON", atau kode tag (seperti "(tag-12)", "[tag-13]"). Gunakan rujukan "Klausul ini", "Pasal ini", atau "Ketentuan ini".
2. RINGKAS & LANGSUNG KE INTI: Pada 'legal_reasoning', jelaskan dampak risiko hukumnya secara langsung dalam 2-3 kalimat. Dilarang mengutip/menyalin ulang isi pasal undang-undang secara panjang lebar.
3. SOLUSI PRAKTIS: Pada 'recommendation', berikan usulan formula revisi kalimat atau tindakan pencegahan konkret.

ATURAN HASIL MATCHING (PENTING):
1. Teks bukan klausul hukum / luar konteks (misal: resep makanan, , dan lainnya): Wajib diberi status COMPLIANT dan matched_node_ids: [].
2. 'matched_node_ids':
   - Untuk status VIOLATES_LAW, UNFAIR_ONE_SIDED, atau INCOMPLETE: Masukkan HANYA tag ID spesifik (misal: ["tag-14"]) yang memuat baris/kalimat bermasalah. DILARANG memasukkan seluruh tag ID jika hanya 1 kalimat yang bermasalah. DILARANG MENULISKAN KODE TAG DALAM TEKS PENJELASAN!
   - Untuk status COMPLIANT: WAJIB diisi dengan array kosong [].
2. 'matched_regulation_ids':
   - Untuk status VIOLATES_LAW atau rujukan hukum spesifik: Salin persis nilai UUID dari [ID: <uuid>] regulasi yang benar-benar dilanggar/dirujuk (tanpa embel-embel "ID: ").
   - Untuk status lain atau jika tidak ada regulasi spesifik yang dilanggar: WAJIB diisi dengan array kosong [].`;
  }

  /**
   * Builds the user prompt combining document outline and batched clause items.
   *
   * @param outlineText - Formatted document outline string.
   * @param batchItems  - Prepared batch chunk items.
   */
  private buildBatchUserPrompt(
    outlineText: string,
    batchItems: { chunkId: string; taggedClauseText: string; regulationsPromptText: string }[]
  ): string {
    const chunksText = batchItems
      .map(
        (item, idx) => `=== CHUNK ${idx + 1} [ID: ${item.chunkId}] ===
KLAUSUL KONTRAK (BER-TAG):
${item.taggedClauseText}

REGULASI HUKUM RUJUKAN:
${item.regulationsPromptText}`
      )
      .join("\n\n");

    return `${outlineText}

---

LIST CHUNK KONTRAK YANG HARUS DIANALISIS (TOTAL: ${batchItems.length}):

${chunksText}`;
  }

  /**
   * Calls the LLM service with structured JSON output schema and parses raw output.
   * Returns parsed outputs or an error message if the call fails.
   *
   * @param userPrompt   - Complete user prompt with clause & legal reference context.
   * @param systemPrompt - System prompt context.
   * @param provider     - Target LLM provider.
   */
  private async executeLlmBatchCall(
    userPrompt: string,
    systemPrompt: string,
    provider: LlmProvider
  ): Promise<{ outputs: LlmChunkOutput[]; error: string | null }> {
    try {
      const responseSchema =
        provider === "groq" ? groqReasoningBatchSchema : reasoningBatchSchema;

      const completionOptions = {
        systemInstruction: systemPrompt,
        responseSchema,
        temperature: 0.1,
      };

      const llmResponse =
        provider === "gemini"
          ? await geminiService.generateCompletion(userPrompt, completionOptions)
          : await groqService.generateCompletion(userPrompt, completionOptions);

      if (llmResponse.success && llmResponse.data) {
        const outputs = this.parseLlmBatchOutput(llmResponse.data.text);
        return { outputs, error: null };
      } else {
        const errorMsg =
          llmResponse.error ?? "Layanan AI mengalami kendala saat menganalisis klausul.";
        console.error(
          "[ReviewService.executeLlmBatchCall] LLM error:",
          errorMsg
        );
        return { outputs: [], error: errorMsg };
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Gagal terhubung ke layanan AI.";
      console.error(
        "[ReviewService.executeLlmBatchCall] LLM call failed:",
        error
      );
      return { outputs: [], error: errorMsg };
    }
  }

  /**
   * Safely parses raw LLM output text into structured LlmChunkOutput objects.
   *
   * @param raw - Raw LLM completion text.
   */
  private parseLlmBatchOutput(raw: string): LlmChunkOutput[] {
    try {
      const stripped = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      if (!stripped) return [];

      const validStatuses: ComplianceStatus[] = [
        "VIOLATES_LAW",
        "UNFAIR_ONE_SIDED",
        "INCOMPLETE",
        "COMPLIANT",
      ];

      const sanitizeItem = (item: unknown): LlmChunkOutput | null => {
        if (!item || typeof item !== "object") return null;
        const parsedItem = item as Partial<LlmChunkOutput> & {
          reasoning?: string;
          revision_recommendation?: string;
        };
        if (
          !parsedItem.compliance_status ||
          !validStatuses.includes(parsedItem.compliance_status)
        ) {
          return null;
        }
        return {
          chunk_id: parsedItem.chunk_id,
          compliance_status: parsedItem.compliance_status,
          matched_node_ids: Array.isArray(parsedItem.matched_node_ids)
            ? parsedItem.matched_node_ids
            : [],
          matched_regulation_ids: Array.isArray(parsedItem.matched_regulation_ids)
            ? parsedItem.matched_regulation_ids
            : [],
          legal_reasoning:
            parsedItem.legal_reasoning ?? parsedItem.reasoning ?? "",
          recommendation:
            parsedItem.recommendation ?? parsedItem.revision_recommendation ?? "",
        };
      };

      const extractFromParsed = (parsed: unknown): LlmChunkOutput[] => {
        if (!parsed || typeof parsed !== "object") return [];
        if (Array.isArray(parsed)) {
          return parsed.map(sanitizeItem).filter(Boolean) as LlmChunkOutput[];
        }
        const obj = parsed as Record<string, unknown>;
        const candidateKeys = ["findings", "clauses", "items", "data", "results", "chunks", "analyses"];
        for (const key of candidateKeys) {
          if (Array.isArray(obj[key])) {
            const sanitized = (obj[key] as unknown[]).map(sanitizeItem).filter(Boolean) as LlmChunkOutput[];
            if (sanitized.length > 0) return sanitized;
          }
        }
        for (const val of Object.values(obj)) {
          if (Array.isArray(val)) {
            const sanitized = val.map(sanitizeItem).filter(Boolean) as LlmChunkOutput[];
            if (sanitized.length > 0) return sanitized;
          }
        }
        const single = sanitizeItem(obj);
        return single ? [single] : [];
      };

      try {
        const parsedDirect = JSON.parse(stripped);
        const extracted = extractFromParsed(parsedDirect);
        if (extracted.length > 0) return extracted;
      } catch {
        // Direct parse failed, proceed to delimiter extraction
      }

      const firstBracket = stripped.indexOf("[");
      const firstBrace = stripped.indexOf("{");

      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        const lastBracket = stripped.lastIndexOf("]");
        if (lastBracket > firstBracket) {
          try {
            const jsonString = stripped.slice(firstBracket, lastBracket + 1);
            const parsedArray = JSON.parse(jsonString);
            const extracted = extractFromParsed(parsedArray);
            if (extracted.length > 0) return extracted;
          } catch (e) {
            console.warn("[ReviewService.parseLlmBatchOutput] Array slice parse failed:", e);
          }
        }
      }

      if (firstBrace !== -1) {
        const lastBrace = stripped.lastIndexOf("}");
        if (lastBrace > firstBrace) {
          try {
            const jsonString = stripped.slice(firstBrace, lastBrace + 1);
            const parsedObj = JSON.parse(jsonString);
            const extracted = extractFromParsed(parsedObj);
            if (extracted.length > 0) return extracted;
          } catch (e) {
            console.warn("[ReviewService.parseLlmBatchOutput] Object slice parse failed:", e);
          }
        }
      }

      return [];
    } catch (err) {
      console.error("[ReviewService.parseLlmBatchOutput] Failed to parse JSON response:", err);
      return [];
    }
  }

  /**
   * Maps LLM batch chunk outputs back to ChunkReasoningResult objects for the UI.
   *
   * @param batchItems   - Array of batch items processed.
   * @param batchOutputs - Array of parsed LLM chunk outputs.
   */
  private mapBatchOutputsToFindings(
    batchItems: ReturnType<typeof this.prepareBatchItems>,
    batchOutputs: LlmChunkOutput[]
  ): ChunkReasoningResult[] {
    const outputMap = new Map<string, LlmChunkOutput>();
    batchOutputs.forEach((out) => {
      if (out.chunk_id) {
        outputMap.set(out.chunk_id, out);
      }
    });

    return batchItems.map((item, itemIdx) => {
      let llmOutput = outputMap.get(item.chunkId) ?? batchOutputs[itemIdx] ?? null;

      if (!llmOutput) {
        console.warn(`[ReviewService] Fallback applied for chunk ${item.chunkId}`);
        llmOutput = {
          chunk_id: item.chunkId,
          compliance_status: "INCOMPLETE",
          legal_reasoning:
            "Analisis tidak dapat diselesaikan secara otomatis karena format respon AI tidak valid.",
          recommendation: "Tinjau klausul ini secara manual bersama konsultan hukum.",
        };
      }

      const defaultTagIds =
        "tagIds" in item.chunk ? item.chunk.tagIds : item.chunk.matched_node_ids;

      let matchedNodeIds: string[] = [];
      if (llmOutput.compliance_status === "COMPLIANT") {
        matchedNodeIds = [];
      } else if (
        Array.isArray(llmOutput.matched_node_ids) &&
        llmOutput.matched_node_ids.length > 0
      ) {
        const validAvailableNodeIds = new Set(defaultTagIds ?? []);
        matchedNodeIds = llmOutput.matched_node_ids
          .map((id) => id.trim())
          .filter(
            (id) =>
              id.length > 0 &&
              (validAvailableNodeIds.size === 0 || validAvailableNodeIds.has(id))
          );

        if (matchedNodeIds.length === 0 && defaultTagIds && defaultTagIds.length > 0) {
          matchedNodeIds = defaultTagIds;
        }
      } else if (defaultTagIds && defaultTagIds.length > 0) {
        matchedNodeIds = defaultTagIds;
      }

      const rawRegIds = (llmOutput.matched_regulation_ids ?? []).map((id) =>
        id.replace(/^ID:\s*/i, "").trim().toLowerCase()
      );
      const regIdSet = new Set(rawRegIds);

      // 1. Direct UUID or Article Number match from LLM's matched_regulation_ids
      let matchedRegs: MatchLegalArticleResult[] = item.chunk.matched_regulations.filter(
        (r) => {
          if (!r) return false;
          const normalizedId = (r.id ?? "").toLowerCase().trim();
          const normalizedArticle = (r.article_number ?? "").toLowerCase().trim();
          const articleDigits = normalizedArticle.replace(/\D/g, "");

          if (normalizedId && regIdSet.has(normalizedId)) return true;
          if (normalizedArticle && regIdSet.has(normalizedArticle)) return true;

          if (articleDigits && articleDigits.length > 1) {
            for (const rawId of rawRegIds) {
              if (rawId.includes(articleDigits) || rawId.includes(normalizedArticle)) {
                return true;
              }
            }
          }
          return false;
        }
      );

      // 2. Text Scanning Fallback: Check if reasoning text explicitly mentions article number or law title
      if (matchedRegs.length === 0 && item.chunk.matched_regulations.length > 0) {
        const reasoningLower = (llmOutput.legal_reasoning ?? "").toLowerCase();

        matchedRegs = item.chunk.matched_regulations.filter((r) => {
          if (!r) return false;
          const articleNum = (r.article_number ?? "").toLowerCase().trim();
          const articleDigits = articleNum.replace(/\D/g, "");
          const nameLower = (r.name ?? "").toLowerCase().trim();

          const articleMentioned =
            (articleNum && reasoningLower.includes(articleNum)) ||
            (articleDigits.length > 1 && reasoningLower.includes(`pasal ${articleDigits}`));

          const nameMentioned = nameLower.length > 3 && reasoningLower.includes(nameLower);

          return articleMentioned || (nameMentioned && articleMentioned);
        });
      }

      // 3. Status-based Fallback for VIOLATES_LAW or UNFAIR_ONE_SIDED with statutory mentions
      const mentionsLawInText = /\b(pasal|undang-undang|uu|kuhperdata|peraturan)\b/i.test(
        llmOutput.legal_reasoning ?? ""
      );

      if (
        matchedRegs.length === 0 &&
        item.chunk.matched_regulations.length > 0 &&
        (llmOutput.compliance_status === "VIOLATES_LAW" ||
          (llmOutput.compliance_status === "UNFAIR_ONE_SIDED" && mentionsLawInText))
      ) {
        matchedRegs = item.chunk.matched_regulations.slice(0, 1);
      }

      const applicableLegalReferences: LegalArticle[] = matchedRegs.map((reg) => ({
        name: reg.name,
        book_title: reg.book_title,
        chapter_title: reg.chapter_title,
        section_title: reg.section_title,
        article_number: reg.article_number,
        content: reg.content,
      }));

      const reasoningText = this.stripTagIdsFromText(llmOutput.legal_reasoning);
      const recommendationText = this.stripTagIdsFromText(llmOutput.recommendation);

      return {
        matched_node_ids: matchedNodeIds,
        clause_text: item.rawChunkText.slice(0, 300),
        compliance_status: llmOutput.compliance_status,
        applicable_legal_references: applicableLegalReferences,
        reasoning: reasoningText,
        revision_recommendation: recommendationText,
      };
    });
  }

  /**
   * Search and paginate review contracts for an authenticated user.
   */
  async searchReviews(
    userId: string,
    params: SearchReviewsDTO
  ): Promise<BaseResponse<PaginatedReviewsData>> {
    const validation = searchReviewsSchema.safeParse(params);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Parameter pencarian tidak valid.";
      return createErrorResponse(firstError);
    }

    const { query, page, limit } = validation.data;
    const sanitizedQuery = query ? sanitizeString(query) : undefined;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.repository.searchReviewsByUser(userId, {
      query: sanitizedQuery,
      from,
      to,
    });

    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    const total = count ?? 0;
    const hasMore = total > to + 1;

    const reviews: ReviewSearchItem[] = ((data as any[]) || []).map((row) => ({
      id: row.id,
      title: row.title,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return createSuccessResponse(
      {
        reviews,
        total,
        page,
        limit,
        hasMore,
      },
      "Daftar review berhasil dimuat."
    );
  }

  /**
   * Delete a contract review belonging to the authenticated user.
   */
  async deleteReview(
    userId: string,
    contractId: string
  ): Promise<BaseResponse<boolean>> {
    const validation = deleteReviewSchema.safeParse({ contractId });
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "ID review kontrak tidak valid.";
      return createErrorResponse(firstError);
    }

    const { error } = await this.repository.deleteContract(userId, validation.data.contractId);
    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    return createSuccessResponse(true, "Review kontrak berhasil dihapus.");
  }
}

/**
 * Factory function to create a ReviewService instance.
 *
 * @param client - Optional Supabase client instance.
 */
export function createReviewService(client?: SupabaseClient<Database>) {
  return new ReviewService(client);
}
