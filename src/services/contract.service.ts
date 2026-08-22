import type { SupabaseClient } from "@supabase/supabase-js";

import { contractQuerySchema, createDraftSchema, saveDraftSchema } from "@/app/validations/contract.validation";
import { decryptContractContent, encryptContractContent } from "@/lib/contract-encryption";
import { createErrorResponse, createSuccessResponse, mapSupabaseError } from "@/lib/response";
import { sanitizeContractHtml } from "@/lib/utils";
import { DEFAULT_DRAFT_CONTENT, DEFAULT_DRAFT_TITLE } from "@/lib/draft-template";
import { ContractRepository, type ContractRecord } from "@/repositories/contract.repository";
import type { ContractDetail, ContractListItem, ContractMetadata, ContractQuery, CreateDraftDTO, SaveDraftDTO } from "@/types/contract.type";
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

export class ContractService {
  constructor(private readonly repository: ContractRepository) {}

  async list(userId: string, query: ContractQuery = {}) {
    const validation = contractQuerySchema.safeParse(query);
    if (!validation.success) return createErrorResponse<ContractListItem[]>(validation.error.issues[0]?.message ?? "Filter tidak valid.", []);
    const { data, error } = await this.repository.listByUser(userId);
    if (error) return createErrorResponse<ContractListItem[]>(mapSupabaseError(error.message), []);
    const keyword = validation.data.query?.toLocaleLowerCase("id-ID");
    const items = (data as ContractRecord[]).map(mapListItem).filter((item) => {
      if (validation.data.type && item.type !== validation.data.type) return false;
      if (validation.data.shared && !item.metadata.shared) return false;
      return !keyword || item.title.toLocaleLowerCase("id-ID").includes(keyword);
    });
    return createSuccessResponse(items);
  }

  async createDraft(userId: string, input: CreateDraftDTO = {}) {
    const validation = createDraftSchema.safeParse(input);
    if (!validation.success) return createErrorResponse<{ id: string }>(validation.error.issues[0]?.message ?? "Draft tidak valid.");
    const title = validation.data.title || DEFAULT_DRAFT_TITLE;
    const contractResult = await this.repository.createContract({ user_id: userId, title, type: "draft", is_pinned: false });
    if (contractResult.error || !contractResult.data) return createErrorResponse<{ id: string }>(mapSupabaseError(contractResult.error?.message ?? "Draft gagal dibuat."));
    const contractId = contractResult.data.id;
    const encrypted = encryptContractContent(DEFAULT_DRAFT_CONTENT);
    const draftResult = await this.repository.upsertDraft({
      contract_id: contractId,
      content: encrypted,
      fairness_score: null,
      total_clausul_risk: 0,
      metadata: { encryption: "aes-256-gcm", shared: false, recipients: 0, comments: 0, version: 1 },
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
    return createSuccessResponse({ id: contractId }, "Draft baru berhasil dibuat.");
  }

  async detail(userId: string, contractId?: string) {
    const result = contractId ? await this.repository.findById(userId, contractId) : await this.repository.findLatestDraft(userId);
    if (result.error) return createErrorResponse<ContractDetail>(mapSupabaseError(result.error.message));
    if (!result.data) return createErrorResponse<ContractDetail>("Dokumen tidak ditemukan.");
    const record = result.data as ContractRecord;
    if (record.type !== "draft") return createErrorResponse<ContractDetail>("Draft tidak ditemukan.");
    const listItem = mapListItem(record);
    const encryptedContent = record.contract_draft?.content ?? "";
    const versionsResult = await this.repository.listDraftVersions(record.id);
    if (versionsResult.error) return createErrorResponse<ContractDetail>(mapSupabaseError(versionsResult.error.message));
    let content = "";
    try { content = encryptedContent ? decryptContractContent(encryptedContent) : ""; } catch { content = encryptedContent; }
    const detail: ContractDetail = {
      ...listItem,
      content,
      versions: versionsResult.data ?? [],
    };
    return createSuccessResponse(detail);
  }

  async saveDraft(userId: string, contractId: string, input: SaveDraftDTO) {
    const validation = saveDraftSchema.safeParse(input);
    if (!validation.success) return createErrorResponse(validation.error.issues[0]?.message ?? "Draft tidak valid.");
    const current = await this.repository.findById(userId, contractId);
    if (current.error || !current.data || current.data.type !== "draft") return createErrorResponse("Draft tidak ditemukan atau tidak dapat disunting.");
    const content = sanitizeContractHtml(validation.data.content);
    const encrypted = encryptContractContent(content);
    const versions = await this.repository.listDraftVersions(contractId);
    const currentVersion = versions.data?.[0]?.version ?? 0;
    const nextVersion = validation.data.createVersion ? currentVersion + 1 : Math.max(currentVersion, 1);
    const draftRecord = (current.data as ContractRecord).contract_draft;
    const metadata = { ...metadataOf(draftRecord?.metadata), encryption: "aes-256-gcm", version: nextVersion };
    const [titleResult, draftResult] = await Promise.all([
      this.repository.updateTitle(userId, contractId, validation.data.title),
      this.repository.upsertDraft({ contract_id: contractId, content: encrypted, fairness_score: draftRecord?.fairness_score ?? null, total_clausul_risk: draftRecord?.total_clausul_risk ?? 0, metadata }),
    ]);
    if (titleResult.error || draftResult.error) return createErrorResponse(mapSupabaseError(titleResult.error?.message ?? draftResult.error?.message ?? "Gagal menyimpan draft."));
    if (validation.data.createVersion || currentVersion === 0) {
      const versionResult = await this.repository.createDraftVersion({ document_id: contractId, title: validation.data.title, body: encrypted, version: nextVersion, created_by: userId });
      if (versionResult.error) return createErrorResponse(mapSupabaseError(versionResult.error.message));
    }
    return createSuccessResponse({ version: nextVersion }, "Draft berhasil disimpan.");
  }

}

export function createContractService(client: SupabaseClient<Database>) {
  return new ContractService(new ContractRepository(client));
}
