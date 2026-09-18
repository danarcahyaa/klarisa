/**
 * Gemini tool declaration for requesting clarification from the user with contract draft context.
 * Used when user instructions are ambiguous or need specific confirmation based on active contract clauses.
 */
export const AGENT_CLARIFICATION = {
  type: "function",
  name: "agent_clarification",
  description:
    "Panggil fungsi ini untuk meminta klarifikasi kepada pengguna jika instruksi belum spesifik, ambigu, atau memerlukan konfirmasi detail lebih lanjut berdasarkan konteks draf kontrak saat ini.",
  parameters: {
    type: "OBJECT",
    properties: {
      question: {
        type: "STRING",
        description:
          "Pertanyaan ramah dan spesifik untuk menanyakan klarifikasi yang dibutuhkan terkait draf kontrak.",
      },
      draft_context: {
        type: "STRING",
        description:
          "Kutipan atau konteks klausul/bagian draf kontrak yang sedang dibahas atau memerlukan klarifikasi.",
      },
      suggested_options: {
        type: "ARRAY",
        description:
          "Daftar opsi pilihan cepat yang disarankan untuk mempermudah pengguna memilih jawaban langsung.",
        items: {
          type: "STRING",
        },
      },
    },
    required: ["question"],
  },
};
