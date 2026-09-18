/**
 * Gemini tool declaration for general conversational and informational output.
 * Handles greetings, contract consultations, legal explanations, and clause analysis
 * without directly modifying the contract document.
 */
export const AGENT_TEXT_OUTPUT = {
  type: "function",
  name: "agent_text_output",
  description:
    "Panggil fungsi ini untuk memberikan tanggapan teks umum kepada pengguna, termasuk membalas sapaan, memandu pengguna, menjawab pertanyaan hukum, menjelaskan isi klausul, atau memberikan saran kontrak tanpa mengubah draf dokumen secara langsung. Jangan gunakan jika topik benar-benar tidak berhubungan dengan kontrak atau peran sebagai asisten.",
  parameters: {
    type: "OBJECT",
    properties: {
      summary: {
        type: "STRING",
        description: "Ringkasan satu kalimat mengenai inti tanggapan atau maksud pesan.",
      },
      content: {
        type: "STRING",
        description:
          "Tanggapan lengkap dalam format teks atau markdown yang ramah dan terstruktur (bisa berupa sapaan, jawaban pertanyaan, atau analisis draf).",
      },
      referenced_clauses: {
        type: "ARRAY",
        description:
          "Daftar pasal/bagian kontrak yang dirujuk jika ada. Berikan array kosong [] jika berupa sapaan atau percakapan umum.",
        items: {
          type: "STRING",
        },
      },
    },
    required: ["summary", "content"],
  },
};