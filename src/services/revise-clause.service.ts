import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.type";
import { createAdminClient } from "@/lib/supabase/admin";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import { EmbeddingService } from "@/services/embedding.service";
import { groqService, GroqService } from "@/services/groq.service";
import {
  reviseClauseSchema,
  type ReviseClauseInput,
} from "@/app/validations/revise-clause.validation";
import {
  type ReviseClauseInputDTO,
  type ReviseClauseResponse,
  type ReviseClauseResult,
  type ClauseRevisionType,
  GROQ_REVISE_CLAUSE_SCHEMA,
} from "@/types/revise-clause.type";
import type { DraftClauseChunk } from "@/types/embedding.type";
import type { MatchLegalArticleResult } from "@/types/legal.type";

/**
 * Business logic service managing AI-driven clause revisions for contract drafts.
 */
export class ReviseClauseService {
  constructor(
    private readonly embeddingService: EmbeddingService = new EmbeddingService(createAdminClient()),
    private readonly groq: GroqService = groqService
  ) {}

  withClient(client: SupabaseClient<Database>) {
    return new ReviseClauseService(
      new EmbeddingService(client),
      this.groq
    );
  }

  /**
   * Sanitizes input string to remove any HTML tags, ensuring pure plain text.
   */
  private stripHtmlTags(input: string): string {
    return input.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * Revises a selected contract clause using semantic RAG retrieval and Groq LLM reasoning.
   *
   * @param input - Revision payload containing selectedClause, citationId, additionalPrompt, and reviewContext.
   * @returns BaseResponse wrapping ReviseClauseResult.
   */
  async reviseClause(input: ReviseClauseInputDTO): Promise<ReviseClauseResponse> {
    try {
      // Step 1: Validate input
      const validation = reviseClauseSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data perbaikan klausul tidak valid."
        );
      }

      const {
        selectedClause,
        citationId,
        additionalPrompt,
        reviewContext,
      } = validation.data;

      // Sanitize selected clause text (remove any existing HTML tags)
      const cleanSelectedClause = this.stripHtmlTags(selectedClause);
      if (!cleanSelectedClause) {
        return createErrorResponse("Teks klausul yang dipilih tidak boleh kosong.");
      }

      // Step 2: Semantic vector embedding & statutory retrieval (RAG)
      let matchedRegulations: MatchLegalArticleResult[] = [];
      try {
        const embeddingRes = await this.embeddingService.generateChunkEmbeddings<DraftClauseChunk>({
          chunks: [{ clause_name: "Klausul Kontrak", search_intent: cleanSelectedClause }],
        });

        if (embeddingRes.success && embeddingRes.data?.chunks?.[0]?.embedding) {
          const matchRes = await this.embeddingService.matchChunkEmbeddings(
            [{ embedding: embeddingRes.data.chunks[0].embedding }],
            { matchThreshold: 0.60, matchCount: 5 }
          );

          if (matchRes.success && matchRes.data?.chunks?.[0]?.matched_regulations) {
            matchedRegulations = matchRes.data.chunks[0].matched_regulations;
          }
        }
      } catch (err) {
        console.warn("[ReviseClauseService] Semantic retrieval encountered non-critical error:", err);
      }

      // Format statutory context for the LLM
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

      // Step 3: Construct System Prompt & Instructions
      let promptContextDirectives = "";

      if (reviewContext && reviewContext.trim()) {
        promptContextDirectives += `
KONTEKS HASIL REVIEW TERDAHULU:
Klausul ini sebelumnya telah ditinjau dan memiliki catatan analisis sebagai berikut:
"""
${reviewContext.trim()}
"""
PANDUAN: Jadikan catatan hasil review di atas sebagai dasar pertimbangan untuk memperbaiki dan merumuskan klausul agar risiko atau kekurangan yang ditemukan terselesaikan dengan baik.
`;
      }

      if (additionalPrompt && additionalPrompt.trim()) {
        promptContextDirectives += `
INSTRUKSI TAMBAHAN DARI PENGGUNA:
"""
${additionalPrompt.trim()}
"""
PANDUAN FILTER & EKSEKUSI INSTRUKSI:
1. ATURAN PENYARINGAN TOPIK (GUARDRAIL TOPIK):
   - Periksa apakah instruksi pengguna di atas berkaitan dengan konteks perancangan/substansi kontrak ATAU instruksi penataan gaya/style teks (formatting/marking).
   - JIKA instruksi pengguna BERADA DI LUAR KONTEKS KONTRAK (contoh: meminta resep masakan/makanan, instruksi pemrograman/koding perangkat lunak, cerita fiksi, humor/lelucon, obrolan santai, tugas matematika, atau topik umum non-hukum lainnya):
     => JANGAN EKSEKUSI INSTRUKSI TERSEBUT! HIRAUKAN / ABAIKAN SEPENUHNYA instruksi di luar konteks tersebut. Dilarang keras memasukkan resep, kode program, atau hal non-hukum ke dalam 'revision_clause'. Tetap fokus hanya pada penyempurnaan klausul kontrak secara profesional.
   - JIKA instruksi berkaitan dengan substansi kontrak (contoh: "tambahkan klausul ganti rugi", "perjelas kewajiban pihak kedua", "ganti jangka waktu 14 hari"):
     => TERIMA DAN INTEGRASIKAN secara proporsional ke dalam perumusan revisi klausul.
   - JIKA instruksi berkaitan dengan penataan gaya/style/marking (contoh: "tebalkan teks tersebut", "buat miring pada frasa tertentu", "jadikan poin-poin/list", "garisbawahi judul"):
     => TERIMA DAN EKSEKUSI perintah formatting tersebut.

2. ATURAN EKSEKUSI MARKING/STYLING:
   - Jika instruksi pengguna meminta perubahan marking/style (tebalkan <strong>/<b>, miringkan <em>/<i>, coret <s>/<del>, garis bawahi <u>, buat daftar <ul>/<ol>, dll.):
     => EKSEKUSI PERINTAH TERSEBUT SECARA PENUH ke dalam 'revision_clause', WALAUPUN teks klausul tersebut secara hukum berstatus 'SAFE' (sudah aman) atau 'AMBIGUOUS' (ambigu/pendek).
     => Pastikan tag HTML yang diminta diterapkan pada bagian kata/frasa yang dimaksud.
`;
      } else {
        promptContextDirectives += `
PANDUAN INSTRUKSI: Pengguna tidak memberikan instruksi tambahan khusus. Rumuskan klausul revisi terbaik secara objektif dan seimbang sesuai kaidah hukum kontrak yang baik, dan PERTAHANKAN STRUKTUR TAG HTML ASLI.
`;
      }

      const systemPrompt = `Anda adalah Asisten Hukum Ahli Perancang Kontrak (Contract Drafting Expert) yang bertugas memperbaiki, menyempurnakan, atau mereformulasi klausul kontrak perjanjian di Indonesia.

TUGAS DAN KRITERIA REASONING:
1. Evaluasi teks klausul yang dipilih pengguna berdasarkan kriteria reasoning berikut:
   - "VIOLATES_LAW": Klausul berpotensi atau secara langsung melanggar hukum/peraturan perundang-undangan di Indonesia berdasarkan data regulasi. Revisi klausul agar sepenuhnya patuh pada regulasi tanpa mengurangi tujuan bisnis utama.
   - "UNFAIR_ONE_SIDED": Klausul tidak melanggar hukum perundang-undangan secara langsung, namun klausul tersebut berpotensi berat sebelah, timpang, atau secara tidak adil merugikan salah satu pihak. Revisi klausul agar proporsional dan adil bagi kedua pihak.
   - "INCOMPLETE": Teks klausul ada yang belum lengkap, mengandung placeholder rumpang seperti [...], titik-titik (...), atau garis bawah kosong (____). Lengkapi placeholder tersebut menjadi klausul yang utuh, logis, dan definitif.
   - "SAFE": Teks klausul tidak berpotensi melanggar hukum dan tidak merugikan salah satu pihak. Sempurnakan redaksionalnya agar lebih rapi, formal, dan elegan. (CATATAN: Jika pengguna meminta instruksi marking/style, tetap eksekusi style tersebut).
   - "AMBIGUOUS": Teks klausul tersebut ambigu, berupa potongan kata/frasa yang tidak utuh, atau tidak memiliki makna klausul yang jelas. Reformulasikan menjadi kalimat klausul yang bermakna dan jelas sesuai konteks perjanjian. (CATATAN: Jika pengguna meminta instruksi marking/style, tetap eksekusi style tersebut).

${promptContextDirectives}

KETENTUAN INJEKSI TAG HTML & PRESERVASI STRUKTUR:
1. Klausul terpilih ('selected_clause') disajikan bersama sitasi struktur tag HTML aslinya dari editor dokumen (misal: <p><strong>...</strong>...</p>).
2. ATURAN PRESERVASI STRUKTUR:
   - JIKA TIDAK ADA instruksi tambahan mengenai perubahan marking/styling dari pengguna:
     => Anda WAJIB memberikan struktur output tag HTML yang SAMA PERSIS dengan struktur tag HTML yang dipilih pada teks klausul (contoh: jika input menggunakan tag <p><strong>Pihak pertama</strong>...</p>, maka hasil revisi juga harus mempertahankan struktur tag <p><strong>...</strong>...</p> yang bersesuaian, hanya memperbarui teks klausulnya).
     => Jangan menghapus atau mengubah tag formatting yang sudah ada kecuali diminta secara eksplisit oleh pengguna.
   - JIKA ADA instruksi penambahan/perubahan marking/styling (seperti tebalkan, miringkan, list, dll.):
     => Terapkan tag HTML yang diminta pengguna secara presisi pada kata atau kalimat yang relevan.

3. TAG HTML YANG DIDUKUNG (TIPTAP):
   - Paragraf standar: <p>...</p>
   - Heading level 1 sampai 6: <h1>, <h2>, <h3>, <h4>, <h5>, <h6>
   - Daftar berbutir: <ul><li>...</li></ul>
   - Daftar berurutan: <ol><li>...</li></ol>
   - Huruf tebal: <strong> atau <b>
   - Huruf miring: <em> atau <i>
   - Huruf coret: <s> atau <del>
   - Garis bawah: <u>
   - Perataan teks: atribut style="text-align: left|right|center|justify" pada tag paragraf atau heading jika relevan.

ATURAN WAJIB REDAKSI KONTRAK:
- Gunakan bahasa hukum kontrak Indonesia yang baku, profesional, lugas, mengikat, dan presisi.
- DILARANG KERAS menyelipkan atau menyebutkan nama undang-undang, nomor pasal, atau dasar regulasi di dalam teks 'revision_clause'. Klausul ini harus berupa teks perjanjian murni yang siap disisipkan langsung ke dalam dokumen kontrak.
- Nilai 'selected_clause' pada output JSON harus berisi teks klausul asli tanpa tag HTML.
- Pastikan 'citation_id' bernilai sama persis dengan yang dikirimkan.`;

      const userPrompt = `PERIKSA DAN PERBAIKI KLAUSUL BERIKUT:
Citation ID: ${citationId}

Teks Klausul Terpilih (beserta struktur tag HTML asli):
"""
${selectedClause}
"""

Teks Klausul Bersih (Plain Text):
"""
${cleanSelectedClause}
"""

REFERENSI REGULASI TERKAIT:
${regulationsContext}

Berikan respon JSON terstruktur sesuai skema:
- type: salah satu dari "VIOLATES_LAW" | "UNFAIR_ONE_SIDED" | "INCOMPLETE" | "SAFE" | "AMBIGUOUS"
- selected_clause: teks klausul asli tanpa tag HTML
- revision_clause: teks hasil klausul yang direvisi dalam format tag HTML TipTap (mempertahankan struktur tag asli jika tidak ada instruksi style baru)
- citation_id: "${citationId}"`;

      // Step 4: Execute LLM completion via Groq
      const llmResponse = await this.groq.generateCompletion(
        userPrompt,
        {
          systemInstruction: systemPrompt,
          responseSchema: GROQ_REVISE_CLAUSE_SCHEMA,
          temperature: 0.1,
          maxTokens: 4096,
        },
        3
      );

      if (!llmResponse.success || !llmResponse.data?.text) {
        return createErrorResponse(
          this.mapReviseError(llmResponse.error)
        );
      }

      // Step 5: Parse and normalize structured output
      let type: ClauseRevisionType = "AMBIGUOUS";
      let revisionClauseHtml = "";
      let returnedSelectedClause = cleanSelectedClause;
      let returnedCitationId = citationId;

      try {
        const raw = llmResponse.data.text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(raw);

        if (
          parsed.type === "VIOLATES_LAW" ||
          parsed.type === "UNFAIR_ONE_SIDED" ||
          parsed.type === "INCOMPLETE" ||
          parsed.type === "SAFE" ||
          parsed.type === "AMBIGUOUS"
        ) {
          type = parsed.type;
        }

        if (parsed.revision_clause) {
          revisionClauseHtml = String(parsed.revision_clause).trim();
        }

        if (parsed.selected_clause) {
          returnedSelectedClause = this.stripHtmlTags(String(parsed.selected_clause));
        }

        if (parsed.citation_id) {
          returnedCitationId = String(parsed.citation_id);
        }
      } catch {
        // Fallback: wrap raw completion in paragraph tag
        revisionClauseHtml = `<p>${llmResponse.data.text.trim()}</p>`;
      }

      if (!revisionClauseHtml) {
        return createErrorResponse("Hasil revisi klausul kosong. Silakan coba lagi.");
      }

      // Ensure output has HTML wrapping if AI provided raw text
      if (!revisionClauseHtml.startsWith("<") && !revisionClauseHtml.endsWith(">")) {
        revisionClauseHtml = `<p>${revisionClauseHtml}</p>`;
      }

      const result: ReviseClauseResult = {
        type,
        selected_clause: returnedSelectedClause || cleanSelectedClause,
        revision_clause: revisionClauseHtml,
        citation_id: returnedCitationId || citationId,
      };

      return createSuccessResponse(result, "Klausul berhasil diperbaiki.");
    } catch (error) {
      console.error("[ReviseClauseService.reviseClause] Unexpected error:", error);
      return createErrorResponse("Terjadi kesalahan saat memproses perbaikan klausul.");
    }
  }

  /**
   * Maps raw AI error messages to user-friendly, polite Indonesian explanations.
   */
  private mapReviseError(errorMsg?: string | null): string {
    if (!errorMsg) {
      return "Gagal melakukan perbaikan terhadap klausul. Silakan coba lagi.";
    }
    const lower = errorMsg.toLowerCase();

    if (
      lower.includes("max completion tokens") ||
      lower.includes("json_validate_failed") ||
      lower.includes("failed to generate json")
    ) {
      return "Teks klausul atau instruksi terlalu panjang untuk diproses dalam satu sesi. Silakan coba pilih bagian klausul yang lebih spesifik.";
    }
    if (lower.includes("503") || lower.includes("high demand") || lower.includes("unavailable")) {
      return "Layanan server sedang mengalami lonjakan beban. Silakan coba beberapa saat lagi.";
    }
    if (lower.includes("429") || lower.includes("rate_limit") || lower.includes("resource_exhausted")) {
      return "Batas penggunaan telah tercapai. Silakan tunggu sejenak dan coba kembali.";
    }
    if (lower.includes("api key") || lower.includes("groq_api_key")) {
      return "Konfigurasi kunci API AI belum sesuai. Silakan hubungi admin.";
    }
    if (lower.includes("400") || lower.includes("invalid_request_error")) {
      return "Permintaan perbaikan klausul tidak dapat diproses. Coba lagi.";
    }

    return errorMsg;
  }
}

export const reviseClauseService = new ReviseClauseService();

export function createReviseClauseService(client?: SupabaseClient<Database>) {
  return client ? reviseClauseService.withClient(client) : reviseClauseService;
}