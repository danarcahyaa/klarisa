/**
 * Gemini tool declaration for contract analysis and review.
 * Evaluates contract clauses, identifies legal risks, and provides recommendations.
 */
export const AGENT_ANALYZE_REVIEW = {
  type: "function",
  name: "agent_analyze_review",
  description:
    "Panggil fungsi ini untuk melakukan analisis, review, evaluasi risiko, atau telaah komprehensif terhadap isi draf kontrak dari editor tanpa perlu embedding regulasi. Output berupa teks analisis terstruktur.",
  parameters: {
    type: "OBJECT",
    properties: {
      summary: {
        type: "STRING",
        description: "Ringkasan eksekutif satu paragraf mengenai gambaran umum draf kontrak dan status kelayakannya.",
      },
      content: {
        type: "STRING",
        description:
          "Ulasan analisis mendalam dan terstruktur mencakup: (1) Gambaran Umum & Struktur Kontrak, (2) Temuan & Potensi Risiko Klausul, (3) Saran & Rekomendasi Perbaikan dalam format markdown.",
      },
      recommendations: {
        type: "ARRAY",
        description: "Daftar rekomendasi poin perbaikan utama untuk kontrak.",
        items: {
          type: "STRING",
        },
      },
    },
    required: ["summary", "content"],
  },
};
