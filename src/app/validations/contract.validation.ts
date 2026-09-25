import { z } from "zod";

export const contractQuerySchema = z.object({
  query: z.string().trim().max(100, "Pencarian maksimal 100 karakter").optional(),
  type: z.enum(["review", "draft"]).optional(),
  shared: z.boolean().optional(),
});

export const createDraftSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(250, "Judul maksimal 250 karakter").optional(),
  category: z.enum(["creative_services", "property_rental", "business_partnership", "other"]),
  subtype: z.string().trim().min(2, "Jenis kontrak wajib dipilih").max(120, "Jenis kontrak maksimal 120 karakter"),
});

export const saveDraftSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(250, "Judul maksimal 250 karakter"),
  content: z.string().trim().min(1, "Isi draft wajib diisi").max(500_000, "Isi draft terlalu panjang"),
  createVersion: z.boolean().optional().default(false),
});

export const addDraftCommentSchema = z.object({
  body: z.string().trim().min(1, "Komentar tidak boleh kosong").max(5000, "Komentar maksimal 5.000 karakter"),
  parentId: z.uuid("Balasan komentar tidak valid").optional(),
  selectedText: z.string().trim().max(5000, "Teks pilihan terlalu panjang").optional(),
}).refine((value) => value.parentId || value.selectedText, {
  message: "Pilih teks kontrak yang ingin dikomentari",
});

export const inviteDraftCollaboratorSchema = z.object({
  email: z.email("Alamat email tidak valid").trim().toLowerCase(),
});

export const draftVersionIdSchema = z.uuid("Versi draft tidak valid");

export const draftEntityIdSchema = z.uuid("Data draft tidak valid");

export const updateDraftCollaboratorSchema = z.object({
  userId: draftEntityIdSchema,
  role: z.enum(["commenter", "viewer"]),
});

export const updateDraftCommentSchema = z.object({
  body: z.string().trim().min(1, "Komentar tidak boleh kosong").max(5000, "Komentar maksimal 5.000 karakter"),
});

export const MAX_CONTRACT_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_CONTRACT_DOC_EXTENSIONS = [".docx"] as const;

export const uploadContractDocumentSchema = z.object({
  title: z.string().trim().min(1, "Judul dokumen wajib diisi").max(250, "Judul dokumen maksimal 250 karakter"),
  fileName: z
    .string()
    .trim()
    .min(1, "Nama berkas wajib ada")
    .refine(
      (name) => name.toLowerCase().endsWith(".docx"),
      "Format berkas harus berupa dokumen .docx"
    ),
  fileSize: z
    .number()
    .int()
    .min(1, "Dokumen tidak boleh kosong")
    .max(MAX_CONTRACT_FILE_SIZE_BYTES, "Ukuran dokumen tidak boleh melebihi 15 MB"),
  mimeType: z.string().trim().optional(),
  content: z.string().trim().optional(),
});

export function validateContractFile(file: File | null): import("@/types/contract.type").DocumentValidationResult {
  if (!file) {
    return {
      isValid: false,
      fileName: "",
      fileSize: 0,
      mimeType: "",
      errors: ["Silakan pilih dokumen .docx terlebih dahulu."],
    };
  }

  const fileName = file.name.trim();
  const fileSize = file.size;
  const mimeType = file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const errors: string[] = [];

  const lowerName = fileName.toLowerCase();
  const isDocxExtension = lowerName.endsWith(".docx");

  if (!isDocxExtension) {
    errors.push("Format berkas tidak didukung. Harap unggah dokumen bertipe .docx.");
  }

  if (fileSize <= 0) {
    errors.push("Berkas dokumen kosong atau rusak.");
  } else if (fileSize > MAX_CONTRACT_FILE_SIZE_BYTES) {
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(1);
    errors.push(`Ukuran dokumen (${sizeInMB} MB) melebihi batas maksimum 15 MB.`);
  }

  return {
    isValid: errors.length === 0,
    fileName,
    fileSize,
    mimeType,
    errors,
  };
}

export const saveDraftChatSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan tidak boleh kosong"),
  answer: z.string().trim().min(1, "Jawaban tidak boleh kosong"),
  chatId: z.string().uuid("ID percakapan tidak valid").optional().nullable(),
  title: z.string().trim().max(250, "Judul maksimal 250 karakter").optional().nullable(),
  lastInteractionId: z.string().trim().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type SaveDraftChatDTO = z.infer<typeof saveDraftChatSchema>;

export const updateDraftTitleSchema = z.object({
  contractId: z.string().uuid("ID kontrak tidak valid"),
  title: z
    .string()
    .trim()
    .min(1, "Judul kontrak tidak boleh kosong")
    .max(250, "Judul maksimal 250 karakter"),
});

export type UpdateDraftTitleDTO = z.infer<typeof updateDraftTitleSchema>;

export const saveDraftContentSchema = z.object({
  contractId: z.string().uuid("ID kontrak tidak valid"),
  content: z.string().max(1_000_000, "Isi draft melebihi batas ukuran"),
});

export type SaveDraftContentDTO = z.infer<typeof saveDraftContentSchema>;

export const deleteDraftSchema = z.object({
  contractId: z.string().uuid("ID kontrak tidak valid"),
});

export type DeleteDraftDTO = z.infer<typeof deleteDraftSchema>;

export const searchReviewsSchema = z.object({
  query: z
    .string()
    .max(100, "Kata kunci pencarian maksimal 100 karakter.")
    .optional(),
  page: z.number().int().min(1, "Halaman minimal 1.").default(1),
  limit: z.number().int().min(1).max(50, "Batas maksimal 50 per halaman.").default(15),
});

export type SearchReviewsInput = z.infer<typeof searchReviewsSchema>;

export const deleteReviewSchema = z.object({
  contractId: z.string().uuid("ID review kontrak tidak valid"),
});

export type DeleteReviewDTO = z.infer<typeof deleteReviewSchema>;

export const searchDraftsSchema = z.object({
  query: z
    .string()
    .max(100, "Kata kunci pencarian maksimal 100 karakter.")
    .optional(),
  page: z.number().int().min(1, "Halaman minimal 1.").default(1),
  limit: z.number().int().min(1).max(50, "Batas maksimal 50 per halaman.").default(15),
});

export type SearchDraftsInput = z.infer<typeof searchDraftsSchema>;

