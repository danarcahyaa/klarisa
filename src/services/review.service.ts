import type { SupabaseClient } from "@supabase/supabase-js";

import { uploadContractDocumentSchema } from "@/app/validations/contract.validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import {
  buildDocumentOutlinePrompt,
  chunkArray,
  formatRegulationsForPrompt,
  serializeSectionWithTags,
  sleep,
} from "@/lib/utils";
import { ReviewRepository, createReviewRepository } from "@/repositories/review.repository";
import { llmService } from "@/services/llm.service";
import type { Database } from "@/types/database.type";
import type { UploadContractDocumentDTO } from "@/types/contract.type";
import {
  type ChunkReasoningResult,
  type MatchedChunk,
  type MatchedDocumentChunk,
  type ReasoningAnalysisResult,
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

/**
 * Service orchestrating contract review document uploads and AI legal compliance reasoning.
 */
export class ReviewService {
  private readonly repository: ReviewRepository;

  constructor(client: SupabaseClient<Database> = createAdminClient()) {
    this.repository = createReviewRepository(client);
  }

  /**
   * Validates the upload payload and persists a contract review record via
   * the `save_contract_review_result` (or `upload_contract_review`) PostgreSQL RPC transaction.
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
    const metadata = {
      source_file_name: fileName,
      file_size: fileSize,
      ...(input.metadata ?? {}),
    };

    const { data, error } = await this.repository.uploadContractReviewTransaction(
      {
        user_id: userId,
        title,
        type: "review",
        is_pinned: false,
      },
      {
        content: content ?? "",
        fairness_score: fairnessScore,
        total_clausul_risk: totalRisk,
        metadata,
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
   * Fetches the complete contract review details by contract ID for rendering in result workspace.
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
    const metadata = (review?.metadata as Record<string, unknown>) ?? {};
    const findings = metadata.findings ?? null;

    return createSuccessResponse(
      {
        id: data.id,
        title: data.title,
        content: review?.content ?? "",
        fairnessScore: review?.fairness_score ?? 0,
        totalRisk: review?.total_clausul_risk ?? 0,
        metadata,
        findings,
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
        return createSuccessResponse(this.emptyReasoningResult());
      }

      console.log(
        `[ReviewService] processReasoning: Menerima total ${matchedChunks.length} chunk dari hasil pencarian regulasi.`
      );

      const sections = Array.isArray(sectionsOrRawText) ? sectionsOrRawText : [];
      const sectionsMap = this.buildSectionsMap(sections);
      const outlineText = buildDocumentOutlinePrompt(sections);

      const analyzableChunks = this.filterAnalyzableChunks(matchedChunks);
      console.log(
        `[ReviewService] processReasoning: ${analyzableChunks.length} dari ${matchedChunks.length} chunk memiliki rujukan hukum dan siap dieksekusi.`
      );

      if (analyzableChunks.length === 0) {
        return createSuccessResponse(
          this.emptyReasoningResult("Tidak ditemukan klausul kontrak yang dapat dianalisis.")
        );
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
        return createSuccessResponse<ReasoningAnalysisResult>(
          {
            is_contract: true,
            total_analyzed_clauses: findings.length,
            risky_clauses_count: riskyClauses.length,
            findings: riskyClauses,
          },
          `Analisis terhenti lebih awal (${batchErrorMessage}), namun ${riskyClauses.length} klausul berisiko berhasil terdeteksi.`
        );
      }

      // Scenario B: Error occurred and NO risky findings were collected
      if (hasBatchError && riskyClauses.length === 0) {
        return createErrorResponse<ReasoningAnalysisResult>(
          `Gagal memproses analisis kepatuhan hukum: ${batchErrorMessage}`,
          this.emptyReasoningResult(`Analisis terhenti karena kesalahan: ${batchErrorMessage}`)
        );
      }

      // Scenario C: Reasoning completed normally
      return createSuccessResponse<ReasoningAnalysisResult>(
        {
          is_contract: true,
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
        this.emptyReasoningResult("Terjadi kesalahan tidak terduga.")
      );
    }
  }

  /**
   * Constructs an empty ReasoningAnalysisResult fallback structure.
   *
   * @param reason - Optional explanation for empty result.
   */
  private emptyReasoningResult(reason?: string): ReasoningAnalysisResult {
    return {
      is_contract: false,
      not_contract_reason:
        reason ?? "Dokumen tidak mengandung bagian klausul yang dapat dianalisis.",
      total_analyzed_clauses: 0,
      risky_clauses_count: 0,
      findings: [],
    };
  }

  /**
   * Maps an array of DocumentSection objects by their sectionId for fast lookup.
   *
   * @param sections - Array of parsed document sections.
   */
  private buildSectionsMap(sections: DocumentSection[]): Map<string, DocumentSection> {
    const map = new Map<string, DocumentSection>();
    sections.forEach((sec) => map.set(sec.sectionId, sec));
    return map;
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
   * Builds the system prompt for the legal reasoning model.
   */
  private buildBatchSystemPrompt(): string {
    return `Anda adalah analis hukum kontrak Indonesia yang profesional, kritis, dan lugas. Tugas Anda adalah menganalisis setiap klausul kontrak berdasarkan keabsahan hukum, kelengkapan, serta keberimbangan hak dan kewajiban para pihak.

PRINSIP ANALISIS & PENULISAN:
1. Dilarang menggunakan istilah teknis internal seperti "chunk", "node", "prompt", atau "JSON". Sebutlah sebagai "Klausul ini", "Pasal ini", atau "Ketentuan ini".
2. Gunakan bahasa yang sederhana, jelas, dan lugas yang mudah dipahami oleh orang awam.
3. Dilarang mengulang atau menyalin bunyi pasal UU secara panjang lebar di dalam 'legal_reasoning'. Fokuskan penjelasan pada alasan praktis dan dampak hukumnya.
4. Gunakan HANYA ID regulasi yang ada pada daftar rujukan.
5. Pilih ID tag elemen HTML yang secara spesifik menjadi sumber masalah ke dalam 'matched_node_ids'.

ATURAN KONTEKS & FUNGSI KLAUSUL (PENTING):
1. PEMBUKAAN / IDENTITAS PARA PIHAK (PREAMBLE):
   - Hanya dinilai dari kejelasan dan keabsahan identitas para pihak serta kewenangan bertindak.
   - DILARANG menganggap klausul pembukaan/identitas 'INCOMPLETE' atau melanggar UU hanya karena pasal upah, tempat kerja, atau sanksi diatur di pasal-pasal berikutnya.
   - Jika identitas sah dan jelas, berikan status "COMPLIANT".
2. KLAUSUL SUBSTANTIF (HAK, KEWAJIBAN, SANKSI, PEMUTUSAN, DLL):
   - Evaluasi secara mendalam apakah klausul tersebut seimbang (fair) atau berat sebelah.
   - Berikan status "UNFAIR_ONE_SIDED" jika sanksi/denda/ganti rugi hanya dibebankan kepada satu pihak, atau hak pemutusan sepihak tanpa kompensasi hanya dimiliki satu pihak.
   - Berikan status "VIOLATES_LAW" jika klausul menyampingkan hak normatif undang-undang atau melanggar regulasi yang berlaku.
   - Berikan status "INCOMPLETE" HANYA JIKA klausul itu sendiri memuat frasa menggantung, rujukan pasal internal yang hilang, atau norma acuan yang tidak jelas batasannya.
   - Berikan status "COMPLIANT" jika klausul seimbang, jelas, dan sah secara hukum.`;
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

      const llmResponse = await llmService.generateCompletion(userPrompt, {
        provider,
        systemInstruction: systemPrompt,
        responseSchema,
        temperature: 0.1,
      });

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
      const matchedNodeIds =
        llmOutput.matched_node_ids && llmOutput.matched_node_ids.length > 0
          ? llmOutput.matched_node_ids
          : defaultTagIds;

      const regIds = new Set(llmOutput.matched_regulation_ids ?? []);
      let matchedRegs: MatchLegalArticleResult[] = item.chunk.matched_regulations.filter((r) =>
        regIds.has(r.id)
      );

      if (matchedRegs.length === 0 && item.chunk.matched_regulations.length > 0) {
        matchedRegs = item.chunk.matched_regulations.slice(0, 3);
      }

      const applicableLegalReferences: LegalArticle[] = matchedRegs.map((reg) => ({
        name: reg.name,
        book_title: reg.book_title,
        chapter_title: reg.chapter_title,
        section_title: reg.section_title,
        article_number: reg.article_number,
        content: reg.content,
      }));

      return {
        matched_node_ids: matchedNodeIds,
        clause_text: item.rawChunkText.slice(0, 300),
        compliance_status: llmOutput.compliance_status,
        applicable_legal_references: applicableLegalReferences,
        reasoning: llmOutput.legal_reasoning,
        revision_recommendation: llmOutput.recommendation,
      };
    });
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
