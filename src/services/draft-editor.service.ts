import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.type";
import type { BaseResponse } from "@/types/response.type";
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
} from "@/lib/response";
import { encryptContractContent } from "@/lib/contract-encryption";
import {
  saveDraftContentSchema,
  type SaveDraftContentDTO,
} from "@/app/validations/contract.validation";
import {
  DraftRepository,
  createDraftRepository,
} from "@/repositories/draft.repository";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Service orchestrating business logic for the Draft Editor:
 * - Securing and autosaving draft content using AES-256-GCM encryption.
 */
export class DraftEditorService {
  constructor(
    private readonly repository: DraftRepository = new DraftRepository(createAdminClient())
  ) {}

  withClient(client: SupabaseClient<Database>) {
    return new DraftEditorService(createDraftRepository(client));
  }

  /**
   * Encrypts and saves modified contract draft content to Supabase.
   *
   * @param userId - ID of the authenticated user.
   * @param input - Contract ID and raw HTML content.
   * @returns BaseResponse containing contract ID and updated timestamp.
   */
  async saveDraftContent(
    userId: string,
    input: SaveDraftContentDTO
  ): Promise<BaseResponse<{ id: string; updatedAt: string }>> {
    try {
      const validation = saveDraftContentSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data konten draft tidak valid."
        );
      }

      const { contractId, content } = validation.data;

      // Retrieve draft by ID
      const current = await this.repository.findDraftById(contractId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse("Kontrak tidak ditemukan.");
      }

      // Secure content with AES-256-GCM encryption before storing in database
      const encryptedContent = encryptContractContent(content || "<p></p>");

      const result = await this.repository.updateDraftContent(contractId, encryptedContent);
      if (result.error) {
        return createErrorResponse(mapSupabaseError(result.error.message));
      }

      return createSuccessResponse(
        {
          id: contractId,
          updatedAt: result.data.updated_at,
        },
        "Perubahan draft berhasil disimpan."
      );
    } catch (error) {
      console.error("[DraftEditorService] Error in saveDraftContent:", error);
      return createErrorResponse("Terjadi kesalahan saat menyimpan perubahan draft.");
    }
  }
}

export const draftEditorService = new DraftEditorService();

export function createDraftEditorService(client?: SupabaseClient<Database>) {
  return client ? draftEditorService.withClient(client) : draftEditorService;
}
