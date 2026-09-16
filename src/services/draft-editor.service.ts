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
  draftEntityIdSchema,
  saveDraftContentSchema,
  updateDraftTitleSchema,
  type DeleteDraftDTO,
  type SaveDraftContentDTO,
  type UpdateDraftTitleDTO,
} from "@/app/validations/contract.validation";
import {
  DraftRepository,
  createDraftRepository,
} from "@/repositories/draft.repository";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Service orchestrating business logic for the Draft Editor:
 * - Renaming contract drafts with permission checks.
 * - Securing and autosaving draft content using AES-256-GCM encryption.
 * - Deleting contract drafts and cascading cleanup.
 */
export class DraftEditorService {
  constructor(
    private readonly repository: DraftRepository = new DraftRepository(createAdminClient())
  ) {}

  withClient(client: SupabaseClient<Database>) {
    return new DraftEditorService(createDraftRepository(client));
  }

  /**
   * Updates the title of a contract draft after validating input and user permissions.
   *
   * @param userId - ID of the authenticated user.
   * @param input - Contract ID and new title.
   * @returns BaseResponse containing the updated contract ID, title, and timestamp.
   */
  async updateDraftTitle(
    userId: string,
    input: UpdateDraftTitleDTO
  ): Promise<BaseResponse<{ id: string; title: string; updatedAt: string }>> {
    try {
      const validation = updateDraftTitleSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data judul kontrak tidak valid."
        );
      }

      const { contractId, title } = validation.data;
      const cleanTitle = title.trim();

      // Check ownership or editor collaborator permission
      const current = await this.repository.findDraftById(contractId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse("Kontrak tidak ditemukan.");
      }

      const isOwner = current.data.user_id === userId;
      if (!isOwner) {
        const collab = await this.repository.findCollaborator(userId, contractId);
        if (!collab.data || collab.data.role !== "editor") {
          return createErrorResponse("Anda tidak memiliki izin untuk mengubah nama kontrak ini.");
        }
      }

      const result = await this.repository.updateTitle(contractId, cleanTitle);
      if (result.error) {
        return createErrorResponse(mapSupabaseError(result.error.message));
      }

      return createSuccessResponse(
        {
          id: result.data.id,
          title: result.data.title,
          updatedAt: result.data.updated_at,
        },
        "Nama kontrak berhasil diperbarui."
      );
    } catch (error) {
      console.error("[DraftEditorService] Error in updateDraftTitle:", error);
      return createErrorResponse("Terjadi kesalahan saat mengubah nama kontrak.");
    }
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

      // Check access permission
      const current = await this.repository.findDraftById(contractId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse("Kontrak tidak ditemukan.");
      }

      const isOwner = current.data.user_id === userId;
      if (!isOwner) {
        const collab = await this.repository.findCollaborator(userId, contractId);
        if (!collab.data || collab.data.role !== "editor") {
          return createErrorResponse("Anda tidak memiliki izin untuk mengedit isi kontrak ini.");
        }
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

  /**
   * Deletes a contract draft and its associated records.
   * Only the contract owner is authorized to delete the contract.
   *
   * @param userId - ID of the authenticated user.
   * @param contractId - ID of the contract to delete.
   * @returns BaseResponse with deleted contract ID.
   */
  async deleteDraft(
    userId: string,
    contractId: string
  ): Promise<BaseResponse<{ id: string }>> {
    try {
      const idValidation = draftEntityIdSchema.safeParse(contractId);
      if (!idValidation.success) {
        return createErrorResponse(
          idValidation.error.issues[0]?.message ?? "ID kontrak tidak valid."
        );
      }

      const validId = idValidation.data;

      // Check ownership - only owner can delete
      const current = await this.repository.findById(userId, validId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse(
          "Kontrak tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya."
        );
      }

      const result = await this.repository.deleteContract(userId, validId);
      if (result.error) {
        return createErrorResponse(mapSupabaseError(result.error.message));
      }

      return createSuccessResponse(
        { id: validId },
        "Kontrak berhasil dihapus."
      );
    } catch (error) {
      console.error("[DraftEditorService] Error in deleteDraft:", error);
      return createErrorResponse("Terjadi kesalahan saat menghapus kontrak.");
    }
  }
}

export const draftEditorService = new DraftEditorService();

export function createDraftEditorService(client?: SupabaseClient<Database>) {
  return client ? draftEditorService.withClient(client) : draftEditorService;
}
