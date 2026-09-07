import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addDraftCommentSchema,
  contractQuerySchema,
  createDraftSchema,
  draftEntityIdSchema,
  draftVersionIdSchema,
  inviteDraftCollaboratorSchema,
  saveDraftSchema,
  updateDraftCollaboratorSchema,
  updateDraftCommentSchema,
} from "@/app/validations/contract.validation";
import {
  decryptContractContent,
  encryptContractContent,
} from "@/lib/contract-encryption";
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
} from "@/lib/response";
import { sanitizeContractHtml } from "@/lib/utils";
import { DEFAULT_DRAFT_CONTENT } from "@/lib/draft-template";
import {
  DraftRepository,
  type ContractRecord,
} from "@/repositories/draft.repository";
import type {
  AddDraftCommentDTO,
  ContractDetail,
  ContractListItem,
  ContractQuery,
  CreateDraftDTO,
  DraftCollaborator,
  DraftComment,
  DraftVersionContent,
  InviteDraftCollaboratorDTO,
  SaveDraftDTO,
  UpdateDraftCollaboratorDTO,
  UpdateDraftCommentDTO,
} from "@/types/contract.type";
import type { Database } from "@/types/database.type";
import { createClient } from "@/lib/supabase/client";
import {
  mapCollaborator,
  mapComment,
  mapDraftVersion,
  mapListItem,
  metadataOf,
  type DraftCollaboratorRecord,
  type DraftCommentRecord,
} from "./draft-mapper";

/**
 * Service orchestrating business logic for draft management,
 * versions, collaborators, and comments.
 */
export class DraftService {
  constructor(
    private readonly repository: DraftRepository = new DraftRepository(createClient()),
  ) {}

  withClient(client: SupabaseClient<Database>) {
    return new DraftService(new DraftRepository(client));
  }

  async getDraftList(userId: string, input?: ContractQuery) {
    const queryValidation = contractQuerySchema.safeParse(input ?? {});
    if (!queryValidation.success) {
      return createErrorResponse<ContractListItem[]>(
        queryValidation.error.issues[0]?.message ?? "Parameter pencarian tidak valid.",
      );
    }

    const result = await this.repository.listByUser(userId);
    if (result.error) {
      return createErrorResponse<ContractListItem[]>(
        mapSupabaseError(result.error.message),
      );
    }

    return createSuccessResponse((result.data ?? []).map(mapListItem));
  }

  async getDraftDetail(userId: string, contractId: string) {
    const idValidation = draftEntityIdSchema.safeParse(contractId);
    if (!idValidation.success) {
      return createErrorResponse<ContractDetail>(
        idValidation.error.issues[0]?.message ?? "Draft tidak valid.",
      );
    }

    const current = await this.repository.findDraftById(idValidation.data);
    if (current.error) {
      return createErrorResponse<ContractDetail>(
        mapSupabaseError(current.error.message),
      );
    }
    if (!current.data) {
      return createErrorResponse<ContractDetail>("Draft tidak ditemukan.");
    }

    const draftRecord = current.data as ContractRecord;
    const isOwner = draftRecord.user_id === userId;
    const collaboratorResult = isOwner
      ? null
      : await this.repository.findCollaborator(userId, idValidation.data);

    if (collaboratorResult?.error) {
      return createErrorResponse<ContractDetail>(
        mapSupabaseError(collaboratorResult.error.message),
      );
    }
    if (!isOwner && !collaboratorResult?.data) {
      return createErrorResponse<ContractDetail>(
        "Anda tidak memiliki akses ke draft ini.",
      );
    }

    const permission = isOwner
      ? "owner"
      : (collaboratorResult?.data?.role ?? "viewer");
    const meta = metadataOf(draftRecord.contract_draft?.metadata);

    const [versionsResult, collaboratorsResult, commentsResult] =
      await Promise.all([
        this.repository.listDraftVersions(idValidation.data),
        this.repository.listCollaborators(idValidation.data),
        this.repository.listComments(idValidation.data),
      ]);

    if (versionsResult.error || collaboratorsResult.error || commentsResult.error) {
      const err =
        versionsResult.error ||
        collaboratorsResult.error ||
        commentsResult.error;
      return createErrorResponse<ContractDetail>(mapSupabaseError(err!.message));
    }

    const activeVersionId = meta.active_version_id;

    let encryptedContent = draftRecord.contract_draft?.content || "";
    if (activeVersionId) {
      const activeVersion = (versionsResult.data ?? []).find(
        (v) => v.id === activeVersionId,
      );
      if (activeVersion?.body) {
        encryptedContent = activeVersion.body;
      }
    }

    let content = DEFAULT_DRAFT_CONTENT;
    if (encryptedContent) {
      try {
        content = await decryptContractContent(encryptedContent);
      } catch {
        return createErrorResponse<ContractDetail>(
          "Gagal membuka isi draft. Silakan coba lagi.",
        );
      }
    }

    const detail: ContractDetail = {
      id: draftRecord.id,
      title: draftRecord.title,
      type: draftRecord.type === "draft" ? "draft" : "review",
      isPinned: draftRecord.is_pinned,
      updatedAt: draftRecord.updated_at,
      score: draftRecord.contract_draft?.fairness_score ?? null,
      riskCount: draftRecord.contract_draft?.total_clausul_risk ?? 0,
      metadata: meta,
      content,
      permission,
      versions: (versionsResult.data ?? []).map(mapDraftVersion),
      collaborators: (
        (collaboratorsResult.data ?? []) as DraftCollaboratorRecord[]
      ).map(mapCollaborator),
      comments: ((commentsResult.data ?? []) as DraftCommentRecord[])
        .filter((comment) => {
          if (!activeVersionId) return true;
          const commentMeta =
            (comment.metadata as Record<string, unknown> | null) ?? {};
          return commentMeta.document_version_id === activeVersionId;
        })
        .map((comment) => mapComment(comment, userId)),
      settings: null,
    };

    return createSuccessResponse(detail);
  }

  async createDraft(userId: string, input: CreateDraftDTO) {
    const validation = createDraftSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse<{ id: string }>(
        validation.error.issues[0]?.message ?? "Data draft tidak valid.",
      );
    }

    const created = await this.repository.createContract({
      user_id: userId,
      title: validation.data.title || "Draft Baru",
      type: "draft",
    });

    if (created.error || !created.data) {
      return createErrorResponse<{ id: string }>(
        mapSupabaseError(created.error?.message ?? "Gagal membuat draft baru."),
      );
    }

    return createSuccessResponse(
      { id: created.data.id },
      "Draft baru berhasil dibuat.",
    );
  }

  async saveDraft(userId: string, contractId: string, input: SaveDraftDTO) {
    const idValidation = draftEntityIdSchema.safeParse(contractId);
    if (!idValidation.success) {
      return createErrorResponse<{ activeVersionId: string; version: number }>(
        idValidation.error.issues[0]?.message ?? "Draft tidak valid.",
      );
    }

    const validation = saveDraftSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse<{ activeVersionId: string; version: number }>(
        validation.error.issues[0]?.message ?? "Isi draft tidak valid.",
      );
    }

    const current = await this.repository.findDraftById(contractId);
    if (current.error || !current.data) {
      return createErrorResponse<{ activeVersionId: string; version: number }>(
        "Draft tidak ditemukan.",
      );
    }

    if (current.data.user_id !== userId) {
      return createErrorResponse<{ activeVersionId: string; version: number }>(
        "Anda tidak memiliki izin untuk menyimpan perubahan draft.",
      );
    }

    const sanitizedHtml = sanitizeContractHtml(validation.data.content);

    let encryptedContent = "";
    try {
      encryptedContent = await encryptContractContent(sanitizedHtml);
    } catch {
      return createErrorResponse<{ activeVersionId: string; version: number }>(
        "Gagal mengamankan isi draft.",
      );
    }

    const currentMeta = metadataOf(
      (current.data as ContractRecord).contract_draft?.metadata,
    );
    let activeVersionId = currentMeta.active_version_id || "";
    let versionNumber = Number(currentMeta.version ?? 1);

    if (validation.data.createVersion || !activeVersionId) {
      versionNumber = validation.data.createVersion
        ? versionNumber + 1
        : Math.max(1, versionNumber);

      const createdVersion = await this.repository.createDraftVersion({
        document_id: contractId,
        created_by: userId,
        title: validation.data.title,
        body: encryptedContent,
        version: versionNumber,
      });

      if (createdVersion.error || !createdVersion.data) {
        return createErrorResponse<{ activeVersionId: string; version: number }>(
          mapSupabaseError(
            createdVersion.error?.message ?? "Gagal menyimpan versi draft.",
          ),
        );
      }
      activeVersionId = createdVersion.data.id;
    }

    const updated = await this.repository.updateDraftMetadata(contractId, {
      ...currentMeta,
      version: versionNumber,
      active_version_id: activeVersionId,
    });

    if (updated.error) {
      return createErrorResponse<{ activeVersionId: string; version: number }>(
        mapSupabaseError(updated.error.message),
      );
    }

    return createSuccessResponse(
      { activeVersionId, version: versionNumber },
      validation.data.createVersion
        ? `Versi ${String(versionNumber).padStart(2, "0")} tersimpan.`
        : "Perubahan draft disimpan.",
    );
  }

  async deleteDraft(userId: string, contractId: string) {
    const idValidation = draftEntityIdSchema.safeParse(contractId);
    if (!idValidation.success) {
      return createErrorResponse<{ id: string }>(
        idValidation.error.issues[0]?.message ?? "Draft tidak valid.",
      );
    }

    const result = await this.repository.deleteContract(userId, contractId);
    if (result.error) {
      return createErrorResponse<{ id: string }>(
        mapSupabaseError(result.error.message),
      );
    }

    return createSuccessResponse({ id: contractId }, "Draft berhasil dihapus.");
  }

  async getDraftVersion(userId: string, contractId: string, versionId: string) {
    const idValidation = draftVersionIdSchema.safeParse(versionId);
    if (!idValidation.success) {
      return createErrorResponse<DraftVersionContent>(
        idValidation.error.issues[0]?.message ?? "Versi draft tidak valid.",
      );
    }

    const versionResult = await this.repository.findDraftVersion(
      contractId,
      versionId,
    );
    if (versionResult.error || !versionResult.data) {
      return createErrorResponse<DraftVersionContent>(
        mapSupabaseError(
          versionResult.error?.message ?? "Versi draft tidak ditemukan.",
        ),
      );
    }

    let content = DEFAULT_DRAFT_CONTENT;
    if (versionResult.data.body) {
      try {
        content = await decryptContractContent(versionResult.data.body);
      } catch {
        return createErrorResponse<DraftVersionContent>(
          "Gagal dekripsi isi versi draft.",
        );
      }
    }

    return createSuccessResponse({
      id: versionResult.data.id,
      title: versionResult.data.title,
      version: versionResult.data.version,
      createdAt: versionResult.data.created_at,
      createdBy: versionResult.data.created_by,
      content,
    });
  }

  async restoreDraftVersion(
    userId: string,
    contractId: string,
    versionId: string,
  ) {
    const versionResult = await this.getDraftVersion(
      userId,
      contractId,
      versionId,
    );
    if (!versionResult.success || !versionResult.data) {
      return createErrorResponse<DraftVersionContent>(
        versionResult.error ?? "Versi draft tidak ditemukan.",
      );
    }

    const saveResult = await this.saveDraft(userId, contractId, {
      title: versionResult.data.title,
      content: versionResult.data.content,
      createVersion: true,
    });

    if (!saveResult.success) {
      return createErrorResponse<DraftVersionContent>(
        saveResult.error ?? "Gagal memulihkan versi draft.",
      );
    }

    return createSuccessResponse(
      versionResult.data,
      "Versi berhasil dipulihkan.",
    );
  }

  async inviteCollaborator(
    userId: string,
    contractId: string,
    input: InviteDraftCollaboratorDTO,
  ) {
    const validation = inviteDraftCollaboratorSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse<DraftCollaborator>(
        validation.error.issues[0]?.message ?? "Email tidak valid.",
      );
    }

    const targetUser = await this.repository.findAuthUserByEmail(
      validation.data.email,
    );
    if (targetUser.error || !targetUser.data) {
      return createErrorResponse<DraftCollaborator>(
        "Pengguna dengan email tersebut tidak ditemukan.",
      );
    }

    const result = await this.repository.upsertCollaborator({
      contract_id: contractId,
      user_id: targetUser.data.id,
      invited_by: userId,
      role: "commenter",
    });

    if (result.error || !result.data) {
      return createErrorResponse<DraftCollaborator>(
        mapSupabaseError(result.error?.message ?? "Gagal menambahkan pihak terkait."),
      );
    }

    return createSuccessResponse(
      mapCollaborator(result.data as DraftCollaboratorRecord),
      "Pihak terkait berhasil ditambahkan.",
    );
  }

  async updateCollaboratorRole(
    userId: string,
    contractId: string,
    input: UpdateDraftCollaboratorDTO,
  ) {
    const validation = updateDraftCollaboratorSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse<DraftCollaborator>(
        validation.error.issues[0]?.message ?? "Data pihak terkait tidak valid.",
      );
    }

    const result = await this.repository.updateCollaboratorRole(
      contractId,
      validation.data.userId,
      validation.data.role,
    );

    if (result.error || !result.data) {
      return createErrorResponse<DraftCollaborator>(
        mapSupabaseError(result.error?.message ?? "Gagal memperbarui akses."),
      );
    }

    return createSuccessResponse(
      mapCollaborator(result.data as DraftCollaboratorRecord),
      "Peran pihak terkait berhasil diperbarui.",
    );
  }

  async removeCollaborator(
    userId: string,
    contractId: string,
    targetUserId: string,
  ) {
    const idValidation = draftEntityIdSchema.safeParse(targetUserId);
    if (!idValidation.success) {
      return createErrorResponse<{ userId: string; shared: boolean }>(
        idValidation.error.issues[0]?.message ?? "Pengguna tidak valid.",
      );
    }

    const result = await this.repository.deleteCollaborator(
      contractId,
      idValidation.data,
    );
    if (result.error) {
      return createErrorResponse<{ userId: string; shared: boolean }>(
        mapSupabaseError(result.error.message),
      );
    }

    const remaining = await this.repository.listCollaborators(contractId);
    const isShared = (remaining.data?.length ?? 0) > 0;

    return createSuccessResponse(
      { userId: idValidation.data, shared: isShared },
      "Akses pihak terkait dicabut.",
    );
  }

  async addComment(
    userId: string,
    contractId: string,
    input: AddDraftCommentDTO,
  ) {
    const validation = addDraftCommentSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse<DraftComment>(
        validation.error.issues[0]?.message ?? "Komentar tidak valid.",
      );
    }

    const current = await this.repository.findDraftById(contractId);
    if (current.error || !current.data) {
      return createErrorResponse<DraftComment>("Draft tidak ditemukan.");
    }

    const currentMetadata = metadataOf(
      (current.data as ContractRecord).contract_draft?.metadata,
    );
    const activeVersionId = currentMetadata.active_version_id;

    const result = await this.repository.createComment({
      contract_id: contractId,
      author_id: userId,
      comment: validation.data.body,
      parent_id: validation.data.parentId ?? null,
      metadata: {
        document_version_id: activeVersionId ?? null,
        selected_text: validation.data.selectedText ?? null,
        resolved_at: null,
        resolved_by: null,
      },
    });

    if (result.error || !result.data) {
      return createErrorResponse<DraftComment>(
        mapSupabaseError(result.error?.message ?? "Komentar gagal dikirim."),
      );
    }

    return createSuccessResponse(
      mapComment(result.data as DraftCommentRecord, userId),
      "Komentar berhasil dikirim.",
    );
  }

  async deleteComment(userId: string, contractId: string, commentId: string) {
    const idValidation = draftEntityIdSchema.safeParse(commentId);
    if (!idValidation.success) {
      return createErrorResponse<{ id: string }>(
        idValidation.error.issues[0]?.message ?? "Komentar tidak valid.",
      );
    }

    const result = await this.repository.deleteComment(contractId, commentId);
    if (result.error) {
      return createErrorResponse<{ id: string }>(
        mapSupabaseError(result.error.message),
      );
    }

    return createSuccessResponse({ id: commentId }, "Komentar dihapus.");
  }

  async updateComment(
    userId: string,
    contractId: string,
    commentId: string,
    input: UpdateDraftCommentDTO,
  ) {
    const idValidation = draftEntityIdSchema.safeParse(commentId);
    if (!idValidation.success) {
      return createErrorResponse<DraftComment>(
        idValidation.error.issues[0]?.message ?? "Komentar tidak valid.",
      );
    }

    const validation = updateDraftCommentSchema.safeParse(input);
    if (!validation.success) {
      return createErrorResponse<DraftComment>(
        validation.error.issues[0]?.message ?? "Komentar tidak valid.",
      );
    }

    const result = await this.repository.updateComment(
      contractId,
      commentId,
      validation.data.body,
    );
    if (result.error || !result.data) {
      return createErrorResponse<DraftComment>(
        mapSupabaseError(result.error?.message ?? "Gagal mengedit komentar."),
      );
    }

    return createSuccessResponse(
      mapComment(result.data as DraftCommentRecord, userId),
      "Komentar diperbarui.",
    );
  }

  async setCommentResolved(
    userId: string,
    contractId: string,
    commentId: string,
    isResolved: boolean,
  ) {
    const idValidation = draftEntityIdSchema.safeParse(commentId);
    if (!idValidation.success) {
      return createErrorResponse<DraftComment>(
        idValidation.error.issues[0]?.message ?? "Komentar tidak valid.",
      );
    }

    const resolvedAt = isResolved ? new Date().toISOString() : null;
    const resolvedBy = isResolved ? userId : null;

    const result = await this.repository.setCommentResolved(
      contractId,
      commentId,
      resolvedAt,
      resolvedBy,
    );
    if (result.error) {
      return createErrorResponse<DraftComment>(
        mapSupabaseError(result.error.message),
      );
    }

    const commentRecord = await this.repository.findComment(
      contractId,
      commentId,
    );
    if (commentRecord.error || !commentRecord.data) {
      return createErrorResponse<DraftComment>("Komentar tidak ditemukan.");
    }

    return createSuccessResponse(
      mapComment(commentRecord.data as DraftCommentRecord, userId),
      isResolved ? "Komentar ditandai selesai." : "Komentar dibuka kembali.",
    );
  }

  /**
   * Alias for getDraftList — used by dashboard page and layout.
   */
  async list(userId: string, query?: ContractQuery) {
    return this.getDraftList(userId, query);
  }

  /**
   * Alias for getDraftDetail — used by create page.
   */
  async detail(userId: string, contractId: string) {
    return this.getDraftDetail(userId, contractId);
  }

  /**
   * Marks a draft as shared by updating its metadata flag.
   * Used by shareDraftAction in draft.action.ts.
   */
  async shareDraft(userId: string, contractId: string) {
    const idValidation = draftEntityIdSchema.safeParse(contractId);
    if (!idValidation.success) {
      return createErrorResponse<{ status: "shared" }>(
        idValidation.error.issues[0]?.message ?? "Draft tidak valid.",
      );
    }

    const current = await this.repository.findDraftById(contractId);
    if (current.error || !current.data) {
      return createErrorResponse<{ status: "shared" }>("Draft tidak ditemukan.");
    }

    if ((current.data as ContractRecord).user_id !== userId) {
      return createErrorResponse<{ status: "shared" }>(
        "Anda tidak memiliki izin untuk membagikan draft ini.",
      );
    }

    const currentMeta = metadataOf(
      (current.data as ContractRecord).contract_draft?.metadata,
    );
    const updatedMeta = { ...currentMeta, shared: true };

    const updateResult = await this.repository.updateDraftMeta(
      contractId,
      updatedMeta,
    );
    if (updateResult.error) {
      return createErrorResponse<{ status: "shared" }>(
        mapSupabaseError(updateResult.error.message),
      );
    }

    return createSuccessResponse(
      { status: "shared" as const },
      "Draft berhasil dibagikan.",
    );
  }
}


export const draftService = new DraftService();

export function createDraftService(client?: SupabaseClient<Database>) {
  return client ? draftService.withClient(client) : draftService;
}
