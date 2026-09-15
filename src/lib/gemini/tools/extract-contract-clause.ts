export const EXTRACT_CONTRACT_CLAUSES = {
  type: "function",
  name: "extract_contract_clauses",
  description: "Mengekstrak daftar klausul kontrak dan kueri semantiknya untuk pencarian pasal di database vektor.",
  parameters: {
    type: "OBJECT",
    properties: {
      contract_type: {
        type: "STRING",
        description: "Jenis atau nama spesifik kontrak (contoh: 'Perjanjian Kerja Sama', 'Perjanjian Sewa Menyewa', 'Perjanjian Kerja Waktu Tertentu')."
      },
      clauses: {
        type: "ARRAY",
        description: "Daftar klausul yang perlu dicocokkan ke database regulasi.",
        items: {
          type: "OBJECT",
          properties: {
            clause_name: {
              type: "STRING",
              description: "Nama klausul (contoh: 'Hak Cipta & Lisensi', 'Ganti Rugi / Denda')."
            },
            semantic_query: {
              type: "STRING",
              description: "Substansi hukum spesifik yang dicari untuk matching vektor ke pasal regulasi Indonesia."
            }
          },
          required: ["clause_name", "semantic_query"]
        }
      }
    },
    required: ["clauses"]
  }
};