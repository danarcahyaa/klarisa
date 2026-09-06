import type { ContractRepository } from "@/repositories/contract.repository";
import type {
  ContractSearchFilterType,
  ContractSearchResponse,
  SearchItem,
} from "@/types/contract-search.type";
import type { BaseResponse } from "@/types/response.type";
import { createErrorResponse, createSuccessResponse, mapSupabaseError } from "@/lib/response";
import { sanitizeString } from "@/lib/utils";
import { contractQuerySchema } from "@/app/validations/contract.validation";

export class ContractService {
  constructor(private readonly repository: ContractRepository) {}

  /**
   * Search contract records from database with input validation, sanitization, and response mapping.
   */
  async searchContracts(params: {
    userId?: string;
    query?: string;
    filter?: ContractSearchFilterType;
    limit?: number;
    offset?: number;
  }): Promise<ContractSearchResponse> {
    try {
      const sanitizedQuery = sanitizeString(params.query ?? "");
      const validation = contractQuerySchema.safeParse({
        query: sanitizedQuery || undefined,
        type: params.filter === "Draft" ? "draft" : params.filter === "Review" ? "review" : undefined,
      });

      if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message ?? "Parameter pencarian tidak valid.";
        return createErrorResponse(errorMessage);
      }

      const { data, count, error } = await this.repository.searchContracts({
        userId: params.userId,
        query: sanitizedQuery,
        filter: params.filter,
        limit: params.limit,
        offset: params.offset,
      });

      if (error) {
        return createErrorResponse(mapSupabaseError(error.message));
      }

      const searchItems: SearchItem[] = (data ?? []).map((row) => {
        const record = row as Record<string, any>;
        return {
          id: record.id,
          type: (record.type === "draft" ? "draft" : "review") as "draft" | "review",
          title: record.title,
          isPinned: record.is_pinned ?? false,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
          riskCount: 0,
          metadata: (record.metadata as unknown as SearchItem["metadata"]) ?? {},
        };
      });

      return createSuccessResponse({
        items: searchItems,
        totalCount: count ?? searchItems.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal melakukan pencarian dokumen.";
      return createErrorResponse(message);
    }
  }

  /**
   * Delete a contract record by ID.
   */
  async deleteContract(userId: string, contractId: string): Promise<BaseResponse<boolean>> {
    try {
      const { error } = await this.repository.deleteContract(userId, contractId);
      if (error) return createErrorResponse(mapSupabaseError(error.message));
      return createSuccessResponse(true, "Dokumen berhasil dihapus.");
    } catch (err) {
      return createErrorResponse("Gagal menghapus dokumen.");
    }
  }

  /**
   * Rename a contract document title.
   */
  async renameContract(userId: string, contractId: string, newTitle: string): Promise<BaseResponse<boolean>> {
    try {
      const sanitized = sanitizeString(newTitle);
      if (!sanitized) return createErrorResponse("Judul tidak boleh kosong.");
      const { error } = await this.repository.updateContractTitle(userId, contractId, sanitized);
      if (error) return createErrorResponse(mapSupabaseError(error.message));
      return createSuccessResponse(true, "Judul dokumen berhasil diperbarui.");
    } catch (err) {
      return createErrorResponse("Gagal memperbarui judul dokumen.");
    }
  }

  /**
   * Toggle pinned status of a contract document.
   */
  async togglePin(userId: string, contractId: string, isPinned: boolean): Promise<BaseResponse<boolean>> {
    try {
      const { error } = await this.repository.togglePinContract(userId, contractId, isPinned);
      if (error) return createErrorResponse(mapSupabaseError(error.message));
      return createSuccessResponse(true, isPinned ? "Dokumen disematkan." : "Sematkan dokumen dilepas.");
    } catch (err) {
      return createErrorResponse("Gagal mengubah status semat dokumen.");
    }
  }
}

/**
 * Factory helper function to instantiate ContractService with a ContractRepository.
 */
export function createContractService(repository: ContractRepository) {
  return new ContractService(repository);
}
