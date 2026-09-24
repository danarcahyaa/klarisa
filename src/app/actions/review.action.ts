"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/response";
import { createReviewService } from "@/services/review.service";
import type { UploadContractDocumentDTO } from "@/types/contract.type";
import type { SearchReviewsDTO } from "@/types/contract-review.type";

export async function uploadReviewDocumentAction(input: UploadContractDocumentDTO) {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return createErrorResponse<{ id: string }>("Sesi Anda telah berakhir.");

  const reviewService = createReviewService(createAdminClient());
  const result = await reviewService.uploadReviewDocument(user.id, input);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/review");
    revalidatePath("/dashboard/search");
  }
  return result;
}

export async function getReviewDetailAction(contractId: string) {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return createErrorResponse("Sesi Anda telah berakhir.");

  const reviewService = createReviewService(createAdminClient());
  return reviewService.getReviewDetail(user.id, contractId);
}

/**
 * Server action to search and paginate review documents belonging to the current user.
 */
export async function searchUserReviewsAction(params: SearchReviewsDTO = {}) {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const reviewService = createReviewService(createAdminClient());
  return reviewService.searchReviews(user.id, params);
}
