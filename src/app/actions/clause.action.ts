"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClauseService } from "@/services/clause.service";
import { createErrorResponse } from "@/lib/response";
import type {
  ClauseReviewItem,
  ReviewClauseInputDTO,
  ReviewClauseResponse,
  SaveClauseReviewsResponse,
  DeleteClauseReviewDTO,
} from "@/types/clause.type";

/**
 * Server action to analyze a selected clause with AI and persist to review_metadata array.
 *
 * @param input - Clause review payload containing contractId and clauseText.
 * @returns BaseResponse with created review and updated reviews array.
 */
export async function reviewClauseAction(
  input: ReviewClauseInputDTO
): Promise<ReviewClauseResponse> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const service = createClauseService(createAdminClient());
  return service.reviewClause(user.id, input);
}

/**
 * Server action to save an updated reviews array directly to database without an initial query.
 *
 * @param contractId - Target contract UUID.
 * @param reviews    - Updated array of clause reviews from client hook.
 * @returns BaseResponse with persisted reviews.
 */
export async function saveClauseReviewsAction(
  contractId: string,
  reviews: ClauseReviewItem[]
): Promise<SaveClauseReviewsResponse> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const service = createClauseService(createAdminClient());
  return service.saveReviews(user.id, { contractId, reviews });
}

/**
 * Server action to delete a single clause review from the reviews array.
 *
 * @param input          - Contract and clause ID payload.
 * @param currentReviews - Current reviews array from client hook.
 * @returns BaseResponse with updated reviews list.
 */
export async function deleteClauseReviewAction(
  input: DeleteClauseReviewDTO,
  currentReviews: ClauseReviewItem[] = []
): Promise<SaveClauseReviewsResponse> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const service = createClauseService(createAdminClient());
  return service.deleteReview(user.id, input, currentReviews);
}
