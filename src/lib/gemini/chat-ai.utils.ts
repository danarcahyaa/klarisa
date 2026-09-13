import type { GeminiInteraction } from "@/types/llm.type";

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
