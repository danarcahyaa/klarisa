"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createReviseClauseService } from "@/services/revise-clause.service";
import { createErrorResponse } from "@/lib/response";
import type {
  ReviseClauseInputDTO,
  ReviseClauseResponse,
} from "@/types/revise-clause.type";

/**
 * Server action to analyze and revise a selected clause using AI.
 *
 * @param input - Revise clause payload containing selectedClause, citationId, additionalPrompt, and reviewContext.
 * @returns BaseResponse wrapping ReviseClauseResult.
 */
export async function reviseClauseAction(
  input: ReviseClauseInputDTO
): Promise<ReviseClauseResponse> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const service = createReviseClauseService(createAdminClient());
  return service.reviseClause(input);
}
