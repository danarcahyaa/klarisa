import { z } from "zod";

/**
 * Validation schema for triggering a single clause review.
 */
export const reviewClauseSchema = z.object({
  contractId: z.string().uuid("ID kontrak harus berupa UUID yang valid."),
  clauseText: z.string().min(3, "Teks klausul minimal terdiri dari 3 karakter."),
  highlightId: z.string().optional(),
  currentReviews: z.array(z.any()).optional(),
  saveToDatabase: z.boolean().optional(),
});

export type ReviewClauseInput = z.infer<typeof reviewClauseSchema>;

/**
 * Validation schema for directly saving updated clause reviews array.
 */
export const saveClauseReviewsSchema = z.object({
  contractId: z.string().uuid("ID kontrak harus berupa UUID yang valid."),
  reviews: z.array(z.any()),
});

export type SaveClauseReviewsInput = z.infer<typeof saveClauseReviewsSchema>;

/**
 * Validation schema for deleting a single clause review by ID.
 */
export const deleteClauseReviewSchema = z.object({
  contractId: z.string().uuid("ID kontrak harus berupa UUID yang valid."),
  clauseId: z.string().min(1, "ID klausul tidak boleh kosong."),
});

export type DeleteClauseReviewInput = z.infer<typeof deleteClauseReviewSchema>;
