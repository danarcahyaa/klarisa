import { z } from "zod";

/**
 * Validation schema for individual contract chunk item (legacy pipeline).
 */
export const contractChunkItemSchema = z.object({
  content: z
    .string({ message: "Content chunk harus berupa string teks." })
    .trim()
    .min(1, "Content chunk tidak boleh kosong."),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Validation schema for document chunk (new pipeline).
 */
export const documentChunkSchema = z.object({
  chunkId: z.string({ message: "Chunk ID wajib diisi." }),
  sectionId: z.string({ message: "Section ID wajib diisi." }),
  sectionTitle: z.string({ message: "Section title wajib diisi." }),
  tagIds: z.array(z.string()),
  text: z.string({ message: "Teks chunk harus berupa string." }).min(1, "Teks chunk tidak boleh kosong."),
});

/**
 * Validation schema for contract embedding requests.
 * Supports single string, array of strings, or array of chunk objects via `content` or `chunks`.
 */
export const generateEmbeddingSchema = z
  .object({
    content: z
      .union([
        z.string().trim().min(1, "Konten teks tidak boleh kosong."),
        z.array(z.string().trim().min(1, "Item konten tidak boleh kosong.")).min(1, "Array konten tidak boleh kosong."),
        z.array(z.union([contractChunkItemSchema, documentChunkSchema])).min(1, "Array chunk tidak boleh kosong."),
      ])
      .optional(),
    chunks: z
      .array(
        z.union([
          z.string().trim().min(1, "Chunk tidak boleh kosong."),
          contractChunkItemSchema,
          documentChunkSchema,
        ])
      )
      .min(1, "Array chunk tidak boleh kosong.")
      .optional(),
    batchSize: z.number().int().min(1).max(50).optional().default(5),
    batchDelayMs: z.number().int().min(0).max(10000).optional().default(500),
  })
  .refine((data) => data.content !== undefined || data.chunks !== undefined, {
    message: "Konten teks (content) atau array chunk (chunks) wajib diisi.",
  });

