"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createContractRepository } from "@/repositories/contract.repository";
import { createContractService } from "@/services/contract.service";
import { createErrorResponse } from "@/lib/response";
import type { ContractSearchFilterType, ContractSearchResponse } from "@/types/contract-search.type";
import type { BaseResponse } from "@/types/response.type";

/**
 * Server action to search contracts for the currently authenticated user from the contracts table.
 *
 * @param params - Search parameters (query, filter, limit, offset).
 * @returns BaseResponse containing search items and total count.
 */
export async function searchContractsAction(params: {
  query?: string;
  filter?: ContractSearchFilterType;
  limit?: number;
  offset?: number;
}): Promise<ContractSearchResponse> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const repository = createContractRepository(createAdminClient());
  const service = createContractService(repository);

  return service.searchContracts({
    userId: user.id,
    query: params.query,
    filter: params.filter,
    limit: params.limit,
    offset: params.offset,
  });
}

/**
 * Server action to toggle the pinned status of a contract for the authenticated user.
 *
 * @param contractId - The contract ID to pin/unpin.
 * @param isPinned   - The target pinned state.
 * @returns BaseResponse indicating success or error.
 */
export async function togglePinContractAction(
  contractId: string,
  isPinned: boolean
): Promise<BaseResponse<boolean>> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const repository = createContractRepository(createAdminClient());
  const service = createContractService(repository);

  const result = await service.togglePin(user.id, contractId, isPinned);
  if (result.success) {
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Server action to rename a contract document title for the authenticated user.
 *
 * @param contractId - The contract ID to rename.
 * @param newTitle   - The new title string.
 * @returns BaseResponse indicating success or error.
 */
export async function renameContractAction(
  contractId: string,
  newTitle: string
): Promise<BaseResponse<boolean>> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const repository = createContractRepository(createAdminClient());
  const service = createContractService(repository);

  const result = await service.renameContract(user.id, contractId, newTitle);
  if (result.success) {
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Server action to delete a contract document for the authenticated user.
 *
 * @param contractId - The contract ID to delete.
 * @returns BaseResponse indicating success or error.
 */
export async function deleteContractAction(
  contractId: string
): Promise<BaseResponse<boolean>> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const repository = createContractRepository(createAdminClient());
  const service = createContractService(repository);

  const result = await service.deleteContract(user.id, contractId);
  if (result.success) {
    revalidatePath("/dashboard/search");
    revalidatePath("/dashboard");
  }
  return result;
}
