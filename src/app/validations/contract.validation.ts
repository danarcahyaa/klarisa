import { z } from "zod";

export const contractQuerySchema = z.object({
  query: z.string().trim().max(100, "Pencarian maksimal 100 karakter").optional(),
  type: z.enum(["review", "draft"]).optional(),
  shared: z.boolean().optional(),
});

export const saveDraftSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(250, "Judul maksimal 250 karakter"),
  content: z.string().trim().min(1, "Isi draft wajib diisi").max(500_000, "Isi draft terlalu panjang"),
  createVersion: z.boolean().optional().default(false),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
