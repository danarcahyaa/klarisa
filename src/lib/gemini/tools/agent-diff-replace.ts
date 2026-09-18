/**
 * Gemini tool declaration for Diff & Replace contract interactions.
 * Proposes precise clause modifications, insertions, or deletions with original vs replacement snippets.
 */
export const AGENT_DIFF_REPLACE = {
  type: "function",
  name: "agent_diff_replace",
  description:
    "Panggil fungsi ini jika pengguna meminta untuk mengubah, merevisi, menyisipkan, atau menghapus klausul atau bagian tertentu pada draf kontrak secara langsung menggunakan mekanisme diff dan replace.",
  parameters: {
    type: "OBJECT",
    properties: {
      summary: {
        type: "STRING",
        description: "Ringkasan singkat mengenai seluruh perubahan yang diajukan pada draf kontrak.",
      },
      changes: {
        type: "ARRAY",
        description: "Daftar usulan perubahan spesifik per klausul pada draf kontrak.",
        items: {
          type: "OBJECT",
          properties: {
            target: {
              type: "STRING",
              description:
                "Label atau penanda bagian dokumen yang menjadi sasaran perubahan (contoh: 'Pasal 3', 'Judul Kontrak', 'Identitas Pihak Pertama', 'Ketentuan Pembayaran, dan bagian kontrak lainnya.').",
            },
            action: {
              type: "STRING",
              enum: ["replace", "insert", "delete"],
              description:
                "Jenis tindakan perubahan: 'replace' untuk menimpa teks, 'insert' untuk menambahkan teks baru, atau 'delete' untuk menghapus.",
            },
            insert_position: {
              type: "STRING",
              enum: ["before", "after"],
              nullable: true,
              description:
                "Wajib diisi jika action='insert'. Menentukan apakah teks baru disisipkan sebelum atau sesudah anchor_text/original_text.",
            },
            original_text: {
              type: "STRING",
              description:
                "Potongan teks/kalimat persis di dalam draf kontrak saat ini yang akan diganti (replace), dihapus (delete), atau dijadikan patokan titik sisip (insert).",
            },
            replacement_text: {
              type: "STRING",
              description:
                "Snippet HTML bersih yang akan dimasukkan ke dalam draf kontrak (contoh: '<p>Teks baru...</p>'). Kosongkan jika action='delete'.",
            },
            target_id: {
              type: "STRING",
              nullable: true,
              description:
                "ID highlight sementara (misal: 'hl-123') jika perubahan ini berasal dari seleksi teks (Text Selection) pengguna.",
            },
            explanation: {
              type: "STRING",
              description:
                "Penjelasan atau alasan pertimbangan hukum di balik usulan perubahan klausul tersebut.",
            },
          },
          required: ["target", "action", "original_text", "explanation"],
        },
      },
    },
    required: ["summary", "changes"],
  },
};