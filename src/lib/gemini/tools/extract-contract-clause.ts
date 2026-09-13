export const EXTRACT_CONTRACT_CLAUSE = {
        type: "function",
        name: "extract_contract_clauses",
        description: "Mengekstrak daftar pasal dan makna hukum semantiknya sesuai regulasi Indonesia untuk pencocokan ke database vektor.",
        parameters: {
          type: "OBJECT",
          properties: {
            contract_type: {
              type: "STRING",
              description: "Tipe kontrak yang diidentifikasi (contoh: Perjanjian Kerja Waktu Tertentu, Perjanjian Sewa Menyewa Properti)."
            },
            applicable_framework: {
              type: "STRING",
              description: "Rujukan dasar hukum atau regulasi terkait di Indonesia (contoh: KUHPerdata, UU Ketenagakerjaan/Cipta Kerja, UU ITE)."
            },
            clauses: {
                type: "ARRAY",
                description: "Daftar klausul yang perlu dicocokkan ke database regulasi.",
                items: {
                    type: "OBJECT",
                    properties: {
                    clause_name: {
                        type: "STRING",
                        description: "Judul pasal (contoh: Klausul Pemutusan Hubungan Kerja)."
                    },
                    semantic_query: {
                        type: "STRING",
                        description: "Maksud dan substansi hukum spesifik yang dicari untuk matching rujukan regulasi di database vektor."
                    }
                },
                required: ["clause_name", "semantic_query"]
            }
        }
    },
    required: ["contract_type", "clauses"]
    }
}