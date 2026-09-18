import "server-only";

import { geminiService, GeminiService } from "@/services/gemini.service";
import { AGENT_CONTRACT_TOOLS } from "@/lib/gemini/tools";
import type {
  GeminiInteractionResponse,
  GeminiInteractionStreamEvent,
} from "@/types/llm.type";
import type { AgentStreamRequest } from "@/types/agent-contract.type";

/**
 * Service orchestrating Agentic Contract Interactions:
 * - Coordinates Gemini Interactions API with dedicated agent tools:
 *   (1) agent_diff_replace: text modifications with target_id
 *   (2) agent_clarification: clarifying ambiguous user requests with options
 *   (3) agent_reject_out_of_scope: polite rejection of unrelated topics
 * - Generates real-time native text streams for general conversations and consultations.
 * - Injects active text selection context when available.
 */
export class DraftAgentService {
  constructor(private readonly gemini: GeminiService = geminiService) {}

  /**
   * Constructs a comprehensive system instruction for the contract AI agent.
   *
   * @param selectedText - Snippet of text selected by user on the editor canvas.
   * @param targetId     - Highlight mark ID corresponding to the selection mark.
   * @returns Formatted system instruction string.
   */
  buildAgentSystemPrompt(
    selectedText?: string | null,
    targetId?: string | null
  ): string {
    const lines: string[] = [];

    lines.push(
      "Anda adalah Klarisa, AI pendamping draf kontrak yang cerdas, ringkas, dan to-the-point.",
      "",
      "ATURAN UTAMA GAYA KOMUNIKASI & RESPON (WAJIB DIPATUHI):",
      "1. DILARANG menyebut diri Anda sebagai 'asisten hukum' atau memperkenalkan diri secara bertele-tele.",
      "2. RESPON SINGKAT & PADAT: Jangan memberikan jawaban yang panjang atau berbelit-belit. Langsung berikan inti jawaban atau rekomendasi.",
      "3. RESPON SAPAAN: Jika pengguna hanya menyapa (misalnya: 'Halo', 'Hai', 'Selamat pagi', 'Selamat siang', 'P', dll.), respon HANYA dengan:",
      "   'Halo, ada yang bisa saya bantu hari ini?'",
      "   Dilarang menambahkan kalimat pengantar lain, perkenalan diri, atau daftar panjang hal yang bisa dibantu.",
      "4. FOKUS TO THE POINT: Saat menjawab pertanyaan hukum atau membahas isi draf kontrak, langsung berikan jawaban inti tanpa basa-basi pembuka.",
      "5. RESPON TEKS LANGSUNG (STREAMING REALTIME): Untuk percakapan umum, penjelasan arti teks/pasal, konsultasi, analisis teks, dan sapaan, respon LANGSUNG menggunakan teks markdown biasa secara mengalir (streaming) TANPA memanggil tools apa pun.",
      "",
      "ATURAN PEMILIHAN TOOLS (Hanya panggil tool jika ada kebutuhan aksi khusus):",
      "1. `agent_diff_replace`:",
      "   - Panggil tool ini JIKA DAN HANYA JIKA pengguna secara spesifik meminta untuk MENGUBAH, MEREVISI, MENAMBAHKAN, atau MENGHAPUS teks tertentu pada dokumen draf.",
      "   - PENTING: DILARANG menggunakan kata 'klausul'. Selalu gunakan kata 'teks' (misalnya: 'perubahan teks', 'teks terpilih', dll.).",
      "   - Jika tersedia Teks Terpilih (Selected Text) di bawah ini:",
      "     * Wajib cantumkan `target_id` persis seperti yang diberikan.",
      "     * Isi `original_text` sesuai dengan teks terpilih persis.",
      "     * Sediakan `replacement_text` berupa teks/HTML bersih yang sudah diperbaiki.",
      "     * Berikan `explanation` yang ringkas dan jelas dengan menggunakan istilah 'teks' (BUKAN 'klausul').",
      "   - Jenis action: 'replace' untuk menimpa, 'insert' untuk menyisipkan (sertakan insert_position 'before' atau 'after'), 'delete' untuk menghapus.",
      "",
      "2. `agent_clarification`:",
      "   - Panggil tool ini jika instruksi pengguna ambigu atau membutuhkan konfirmasi detail penting.",
      "   - Sediakan `suggested_options` berupa opsi-opsi jawaban singkat yang dapat langsung diklik.",
      "",
      "3. `agent_reject_out_of_scope`:",
      "   - Panggil tool ini HANYA JIKA permintaan pengguna benar-benar di luar konteks hukum/kontrak.",
      "   - Berikan penolakan singkat dan sopan dalam satu kalimat tanpa menyebut 'asisten hukum'.",
      "",
      "BAHASA:",
      "- Gunakan Bahasa Indonesia yang santun, ringkas, dan profesional."
    );

    if (selectedText && selectedText.trim().length > 0) {
      lines.push(
        "",
        "---",
        "KONTEKS TEKS TERPILIH SAAT INI:",
        `ID Highlight: ${targetId || "tidak_tersedia"}`,
        "Teks yang diseleksi pengguna:",
        '"""',
        selectedText.trim(),
        '"""',
        "Catatan: Pengguna sedang berfokus pada teks terpilih di atas. Berikan tanggapan, analisis, atau usulan perubahan spesifik dan ringkas terhadap bagian teks ini."
      );
    }

    return lines.join("\n");
  }

  /**
   * Executes a real-time streaming interaction with Gemini using the contract tools.
   *
   * @param request - User prompt and optional selection context.
   * @yields Stream events (text_delta, tool_call, interaction_created, interaction_completed, error).
   * @returns Final GeminiInteractionResponse.
   */
  async *streamAgentInteraction(
    request: AgentStreamRequest
  ): AsyncGenerator<GeminiInteractionStreamEvent, GeminiInteractionResponse, unknown> {
    const { prompt, selectedText, highlightId, interactionId } = request;

    const systemInstruction = this.buildAgentSystemPrompt(selectedText, highlightId);

    return yield* this.gemini.streamInteractions(prompt, {
      tools: AGENT_CONTRACT_TOOLS,
      systemInstruction,
      interactionId: interactionId || undefined,
    });
  }
}

/** Singleton instance of DraftAgentService. */
export const draftAgentService = new DraftAgentService();

/** Factory function creating a new DraftAgentService instance. */
export function createDraftAgentService(gemini?: GeminiService) {
  return new DraftAgentService(gemini);
}
