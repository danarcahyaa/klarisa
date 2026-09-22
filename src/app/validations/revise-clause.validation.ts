import { z } from "zod";

/**
 * Validation schema for revising a contract clause.
 */
export const reviseClauseSchema = z.object({
  selectedClause: z.string().min(1, "Klausul yang dipilih tidak boleh kosong."),
  citationId: z.string().min(1, "Citation ID tidak boleh kosong."),
  additionalPrompt: z.string().optional(),
  reviewContext: z.string().optional(),
});

export type ReviseClauseInput = z.infer<typeof reviseClauseSchema>;

