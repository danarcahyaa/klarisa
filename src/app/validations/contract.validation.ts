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
  positionStart: z.number().int().min(0).optional(),
  positionEnd: z.number().int().min(0).optional(),
}).refine((value) => value.parentId || (value.selectedText && value.positionStart !== undefined && value.positionEnd !== undefined), {
  message: "Pilih teks kontrak yang ingin dikomentari",
}).refine((value) => value.positionEnd === undefined || value.positionStart === undefined || value.positionEnd >= value.positionStart, {
  message: "Posisi teks komentar tidak valid",
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

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type AddDraftCommentInput = z.infer<typeof addDraftCommentSchema>;
export type InviteDraftCollaboratorInput = z.infer<typeof inviteDraftCollaboratorSchema>;
export type UpdateDraftCollaboratorInput = z.infer<typeof updateDraftCollaboratorSchema>;
export type UpdateDraftCommentInput = z.infer<typeof updateDraftCommentSchema>;
