import type { SupabaseClient } from "@supabase/supabase-js";

import { addDraftCommentSchema, contractQuerySchema, createDraftSchema, inviteDraftCollaboratorSchema, saveDraftSchema } from "@/app/validations/contract.validation";
import { decryptContractContent, encryptContractContent } from "@/lib/contract-encryption";
import { createErrorResponse, createSuccessResponse, mapSupabaseError } from "@/lib/response";
import { sanitizeContractHtml } from "@/lib/utils";
import { DEFAULT_DRAFT_CONTENT } from "@/lib/draft-template";
import { ContractRepository, type ContractRecord } from "@/repositories/contract.repository";
import type { AddDraftCommentDTO, ContractDetail, ContractListItem, ContractMetadata, ContractQuery, CreateDraftDTO, DraftCollaborator, DraftCollaboratorRow, DraftComment, DraftCommentRow, InviteDraftCollaboratorDTO, SaveDraftDTO } from "@/types/contract.type";
import type { Database } from "@/types/database.type";

function metadataOf(value: unknown): ContractMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ContractMetadata : {};
}

function mapListItem(record: ContractRecord): ContractListItem {
  const draft = record.contract_draft;
  return {
    id: record.id,
    title: record.title,
    type: record.type === "draft" ? "draft" : "review",
    isPinned: record.is_pinned,
    updatedAt: record.updated_at,
    score: draft?.fairness_score ?? null,
    riskCount: draft?.total_clausul_risk ?? 0,
    metadata: metadataOf(draft?.metadata),
  };
}

type ProfileSummary = { full_name: string | null; avatar_url: string | null };
type DraftCommentRecord = DraftCommentRow & { profiles: ProfileSummary | null };
type DraftCollaboratorRecord = DraftCollaboratorRow & { profiles: ProfileSummary | null };

function mapComment(record: DraftCommentRecord, userId: string): DraftComment {
  return {
    id: record.id,
    authorId: record.author_id,
    authorName: record.profiles?.full_name || "Pengguna Klarisa",
    avatarUrl: record.profiles?.avatar_url ?? null,
    body: record.body,
    parentId: record.parent_id,
    selectedText: record.selected_text,
    positionStart: record.position_start,
    positionEnd: record.position_end,
    createdAt: record.created_at,
    isOwn: record.author_id === userId,
  };
}

function mapCollaborator(record: DraftCollaboratorRecord): DraftCollaborator {
  return {
    userId: record.user_id,
    name: record.profiles?.full_name || "Pengguna Klarisa",
    avatarUrl: record.profiles?.avatar_url ?? null,
    role: record.role,
  };
}

export class ContractService {
  constructor(private readonly repository: ContractRepository) {}

  async list(userId: string, query: ContractQuery = {}) {
    const validation = contractQuerySchema.safeParse(query);
    if (!validation.success) return createErrorResponse<ContractListItem[]>(validation.error.issues[0]?.message ?? "Filter tidak valid.", []);
    const [{ data, error }, collaborationResult] = await Promise.all([
      this.repository.listByUser(userId),
      this.repository.listCollaborations(userId),
    ]);
    if (error) return createErrorResponse<ContractListItem[]>(mapSupabaseError(error.message), []);
    if (collaborationResult.error) return createErrorResponse<ContractListItem[]>(mapSupabaseError(collaborationResult.error.message), []);
    const collaborationIds = collaborationResult.data?.map((item) => item.contract_id) ?? [];
    const sharedResult = await this.repository.listDraftsByIds(collaborationIds);
    if (sharedResult.error) return createErrorResponse<ContractListItem[]>(mapSupabaseError(sharedResult.error.message), []);
    const keyword = validation.data.query?.toLocaleLowerCase("id-ID");
    const records = [...(data as ContractRecord[]), ...((sharedResult.data ?? []) as ContractRecord[])]
      .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index);
    const items = records.map(mapListItem).filter((item) => {
      if (validation.data.type && item.type !== validation.data.type) return false;
      if (validation.data.shared && !item.metadata.shared) return false;
      return !keyword || item.title.toLocaleLowerCase("id-ID").includes(keyword);
    });
    return createSuccessResponse(items);
  }

  async createDraft(userId: string, input: CreateDraftDTO) {
    const validation = createDraftSchema.safeParse(input);
    if (!validation.success) return createErrorResponse<{ id: string }>(validation.error.issues[0]?.message ?? "Draft tidak valid.");
    const title = validation.data.title || `Draft ${validation.data.subtype}`;
    const contractResult = await this.repository.createContract({ user_id: userId, title, type: "draft", is_pinned: false });
    if (contractResult.error || !contractResult.data) return createErrorResponse<{ id: string }>(mapSupabaseError(contractResult.error?.message ?? "Draft gagal dibuat."));
    const contractId = contractResult.data.id;
    const encrypted = encryptContractContent(DEFAULT_DRAFT_CONTENT);
    const draftResult = await this.repository.upsertDraft({
      contract_id: contractId,
      content: encrypted,
      fairness_score: null,
      total_clausul_risk: 0,
      metadata: {
        encryption: "aes-256-gcm",
        shared: false,
        recipients: 0,
        comments: 0,
        version: 1,
        draft_category: validation.data.category,
        draft_subtype: validation.data.subtype,
        generation_status: "manual_outline",
      },
    });
    if (draftResult.error) {
      await this.repository.deleteContract(userId, contractId);
      return createErrorResponse<{ id: string }>(mapSupabaseError(draftResult.error.message));
    }
    const versionResult = await this.repository.createDraftVersion({ document_id: contractId, title, body: encrypted, version: 1, created_by: userId });
    if (versionResult.error) {
      await this.repository.deleteContract(userId, contractId);
      return createErrorResponse<{ id: string }>(mapSupabaseError(versionResult.error.message));
    }
    const workspaceResult = await this.repository.findOwnedWorkspace(userId);
    if (workspaceResult.error) {
      await this.repository.deleteContract(userId, contractId);
      return createErrorResponse<{ id: string }>(mapSupabaseError(workspaceResult.error.message));
    }
    const settingsResult = await this.repository.upsertDraftSettings({
      contract_id: contractId,
      workspace_id: workspaceResult.data?.id ?? null,
      status: "private",
    });
    if (settingsResult.error) {
      await this.repository.deleteContract(userId, contractId);
      return createErrorResponse<{ id: string }>(mapSupabaseError(settingsResult.error.message));
    }
    return createSuccessResponse({ id: contractId }, "Draft baru berhasil dibuat.");
  }

  async deleteDraft(userId: string, contractId: string) {
    const current = await this.repository.findById(userId, contractId);
    if (current.error) return createErrorResponse<{ id: string }>(mapSupabaseError(current.error.message));
    if (!current.data || current.data.type !== "draft") {
      return createErrorResponse<{ id: string }>("Draft tidak ditemukan atau Anda bukan pemiliknya.");
    }
    const result = await this.repository.deleteContract(userId, contractId);
    if (result.error) return createErrorResponse<{ id: string }>(mapSupabaseError(result.error.message));
    return createSuccessResponse({ id: contractId }, "Draft berhasil dihapus.");
  }

  async detail(userId: string, contractId?: string) {
    const result = contractId ? await this.repository.findDraftById(contractId) : await this.repository.findLatestDraft(userId);
    if (result.error) return createErrorResponse<ContractDetail>(mapSupabaseError(result.error.message));
    if (!result.data) return createErrorResponse<ContractDetail>("Dokumen tidak ditemukan.");
    const record = result.data as ContractRecord;
    if (record.type !== "draft") return createErrorResponse<ContractDetail>("Draft tidak ditemukan.");
    const collaboratorResult = record.user_id === userId ? null : await this.repository.findCollaborator(userId, record.id);
    if (record.user_id !== userId && (!collaboratorResult?.data || collaboratorResult.error)) {
      return createErrorResponse<ContractDetail>("Anda tidak memiliki akses ke draft ini.");
    }
    const listItem = mapListItem(record);
    const encryptedContent = record.contract_draft?.content ?? "";
    const [versionsResult, settingsResult, collaboratorsResult, commentsResult] = await Promise.all([
      this.repository.listDraftVersions(record.id),
      this.repository.getDraftSettings(record.id),
      this.repository.listCollaborators(record.id),
      this.repository.listComments(record.id),
    ]);
    const detailError = versionsResult.error ?? settingsResult.error ?? collaboratorsResult.error ?? commentsResult.error;
    if (detailError) return createErrorResponse<ContractDetail>(mapSupabaseError(detailError.message));
    let content = "";
    try { content = encryptedContent ? decryptContractContent(encryptedContent) : ""; } catch { content = encryptedContent; }
    const permission = record.user_id === userId ? "owner" : "commenter";
    const detail: ContractDetail = {
      ...listItem,
      content,
      versions: versionsResult.data ?? [],
      settings: settingsResult.data,
      collaborators: ((collaboratorsResult.data ?? []) as DraftCollaboratorRecord[]).map(mapCollaborator),
      comments: ((commentsResult.data ?? []) as DraftCommentRecord[]).map((comment) => mapComment(comment, userId)),
      permission,
    };
    return createSuccessResponse(detail);
  }

  async saveDraft(userId: string, contractId: string, input: SaveDraftDTO) {
    const validation = saveDraftSchema.safeParse(input);
    if (!validation.success) return createErrorResponse(validation.error.issues[0]?.message ?? "Draft tidak valid.");
    const current = await this.repository.findDraftById(contractId);
    if (current.error || !current.data || current.data.type !== "draft") return createErrorResponse("Draft tidak ditemukan atau tidak dapat disunting.");
    if (current.data.user_id !== userId) return createErrorResponse("Hanya pemilik yang dapat menyunting draft ini.");
    const content = sanitizeContractHtml(validation.data.content);
    const encrypted = encryptContractContent(content);
    const versions = await this.repository.listDraftVersions(contractId);
    const currentVersion = versions.data?.[0]?.version ?? 0;
    const nextVersion = validation.data.createVersion ? currentVersion + 1 : Math.max(currentVersion, 1);
    const draftRecord = (current.data as ContractRecord).contract_draft;
    const metadata = { ...metadataOf(draftRecord?.metadata), encryption: "aes-256-gcm", version: nextVersion };
    const [titleResult, draftResult] = await Promise.all([
      this.repository.updateTitle(contractId, validation.data.title),
      this.repository.upsertDraft({ contract_id: contractId, content: encrypted, fairness_score: draftRecord?.fairness_score ?? null, total_clausul_risk: draftRecord?.total_clausul_risk ?? 0, metadata }),
    ]);
    if (titleResult.error || draftResult.error) return createErrorResponse(mapSupabaseError(titleResult.error?.message ?? draftResult.error?.message ?? "Gagal menyimpan draft."));
    if (validation.data.createVersion || currentVersion === 0) {
      const versionResult = await this.repository.createDraftVersion({ document_id: contractId, title: validation.data.title, body: encrypted, version: nextVersion, created_by: userId });
      if (versionResult.error) return createErrorResponse(mapSupabaseError(versionResult.error.message));
    }
    return createSuccessResponse({ version: nextVersion }, "Draft berhasil disimpan.");
  }

  async shareDraft(userId: string, contractId: string) {
    const current = await this.repository.findById(userId, contractId);
    if (current.error || !current.data || current.data.type !== "draft") return createErrorResponse("Hanya pemilik yang dapat membagikan draft ini.");
    const record = current.data as ContractRecord;
    const collaborators = await this.repository.listCollaborators(contractId);
    if (collaborators.error) return createErrorResponse(mapSupabaseError(collaborators.error.message));
    const settings = await this.repository.getDraftSettings(contractId);
    if (settings.error) return createErrorResponse(mapSupabaseError(settings.error.message));
    const settingsResult = await this.repository.upsertDraftSettings({
      contract_id: contractId,
      workspace_id: settings.data?.workspace_id ?? null,
      status: "shared",
    });
    if (settingsResult.error) return createErrorResponse(mapSupabaseError(settingsResult.error.message));
    const metadata = {
      ...metadataOf(record.contract_draft?.metadata),
      shared: true,
      recipients: collaborators.data?.length ?? 0,
    };
    const draftResult = await this.repository.upsertDraft({
      contract_id: contractId,
      content: record.contract_draft?.content,
      fairness_score: record.contract_draft?.fairness_score,
      total_clausul_risk: record.contract_draft?.total_clausul_risk,
      metadata,
    });
    if (draftResult.error) return createErrorResponse(mapSupabaseError(draftResult.error.message));
    return createSuccessResponse({ status: "shared" as const }, "Draft siap dibagikan.");
  }

  async inviteCollaborator(userId: string, contractId: string, input: InviteDraftCollaboratorDTO) {
    const validation = inviteDraftCollaboratorSchema.safeParse(input);
    if (!validation.success) return createErrorResponse<DraftCollaborator>(validation.error.issues[0]?.message ?? "Undangan tidak valid.");
    const current = await this.repository.findById(userId, contractId);
    if (current.error || !current.data || current.data.type !== "draft") {
      return createErrorResponse<DraftCollaborator>("Hanya pemilik yang dapat mengundang pihak terkait.");
    }
    const invitedUser = await this.repository.findAuthUserByEmail(validation.data.email);
    if (invitedUser.error) return createErrorResponse<DraftCollaborator>(mapSupabaseError(invitedUser.error.message));
    if (!invitedUser.data) return createErrorResponse<DraftCollaborator>("Akun dengan email tersebut belum terdaftar di Klarisa.");
    if (invitedUser.data.id === userId) return createErrorResponse<DraftCollaborator>("Anda sudah menjadi pemilik draft ini.");
    const collaboratorResult = await this.repository.upsertCollaborator({
      contract_id: contractId,
      user_id: invitedUser.data.id,
      invited_by: userId,
      role: "commenter",
    });
    if (collaboratorResult.error || !collaboratorResult.data) {
      return createErrorResponse<DraftCollaborator>(mapSupabaseError(collaboratorResult.error?.message ?? "Pihak terkait gagal ditambahkan."));
    }
    const sharedResult = await this.shareDraft(userId, contractId);
    if (!sharedResult.success) return createErrorResponse<DraftCollaborator>(sharedResult.error ?? "Draft gagal dibagikan.");
    return createSuccessResponse(mapCollaborator(collaboratorResult.data as DraftCollaboratorRecord), "Pihak terkait berhasil ditambahkan.");
  }

  async addComment(userId: string, contractId: string, input: AddDraftCommentDTO) {
    const validation = addDraftCommentSchema.safeParse(input);
    if (!validation.success) return createErrorResponse<DraftComment>(validation.error.issues[0]?.message ?? "Komentar tidak valid.");
    const current = await this.repository.findDraftById(contractId);
    if (current.error || !current.data) return createErrorResponse<DraftComment>("Draft tidak ditemukan.");
    const collaborator = current.data.user_id === userId ? null : await this.repository.findCollaborator(userId, contractId);
    const canComment = current.data.user_id === userId || Boolean(collaborator?.data);
    if (!canComment) return createErrorResponse<DraftComment>("Anda tidak memiliki izin untuk menulis komentar.");
    if (validation.data.parentId) {
      const parent = await this.repository.findComment(contractId, validation.data.parentId);
      if (parent.error) return createErrorResponse<DraftComment>(mapSupabaseError(parent.error.message));
      if (!parent.data || parent.data.parent_id) return createErrorResponse<DraftComment>("Komentar yang ingin dibalas tidak ditemukan.");
    }
    const result = await this.repository.createComment({
      contract_id: contractId,
      author_id: userId,
      body: validation.data.body,
      parent_id: validation.data.parentId ?? null,
      selected_text: validation.data.selectedText ?? null,
      position_start: validation.data.positionStart ?? null,
      position_end: validation.data.positionEnd ?? null,
    });
    if (result.error || !result.data) return createErrorResponse<DraftComment>(mapSupabaseError(result.error?.message ?? "Komentar gagal dikirim."));
    const currentMetadata = metadataOf((current.data as ContractRecord).contract_draft?.metadata);
    await this.repository.updateDraftMetadata(contractId, {
      ...currentMetadata,
      comments: Number(currentMetadata.comments ?? 0) + 1,
    });
    return createSuccessResponse(mapComment(result.data as DraftCommentRecord, userId), "Komentar berhasil dikirim.");
  }

  async deleteComment(userId: string, contractId: string, commentId: string) {
    const current = await this.repository.findById(userId, contractId);
    if (current.error || !current.data || current.data.type !== "draft") {
      return createErrorResponse<{ id: string }>("Hanya pemilik draft yang dapat menghapus komentar beserta teks sumbernya.");
    }
    const comment = await this.repository.findComment(contractId, commentId);
    if (comment.error) return createErrorResponse<{ id: string }>(mapSupabaseError(comment.error.message));
    if (!comment.data) return createSuccessResponse({ id: commentId });
    const result = await this.repository.deleteComment(contractId, commentId);
    if (result.error) return createErrorResponse<{ id: string }>(mapSupabaseError(result.error.message));
    const metadata = metadataOf((current.data as ContractRecord).contract_draft?.metadata);
    await this.repository.updateDraftMetadata(contractId, {
      ...metadata,
      comments: Math.max(0, Number(metadata.comments ?? 0) - 1),
    });
    return createSuccessResponse({ id: commentId }, "Komentar yang kehilangan teks sumber telah dihapus.");
  }

}

export function createContractService(client: SupabaseClient<Database>) {
  return new ContractService(new ContractRepository(client));
}
