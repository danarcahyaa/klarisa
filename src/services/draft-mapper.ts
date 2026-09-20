import type {
  ContractListItem,
  ContractMetadata,
  DraftCollaborator,
  DraftCollaboratorRow,
  DraftComment,
  DraftCommentRow,
  DraftVersion,
} from "@/types/contract.type";
import type { ContractRecord } from "@/repositories/draft.repository";
import type { DocumentDraftRow } from "@/types/contract.type";

export type ProfileSummary = {
  full_name: string | null;
  avatar_url: string | null;
};

export type DraftCommentRecord = DraftCommentRow & {
  profiles: ProfileSummary | null;
};

export type DraftCollaboratorRecord = DraftCollaboratorRow & {
  profiles: ProfileSummary | null;
};

/**
 * Safely casts or defaults metadata JSON object.
 */
export function metadataOf(value: unknown): ContractMetadata {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ContractMetadata)
    : {};
}

/**
 * Maps DB contract record to contract list item model.
 */
export function mapListItem(record: ContractRecord): ContractListItem {
  const draft = record.contract_draft;
  return {
    id: record.id,
    title: record.title,
    type: record.type === "draft" ? "draft" : "review",
    isPinned: record.is_pinned,
    updatedAt: record.updated_at,
    score: (draft as any)?.fairness_score ?? null,
    riskCount: (draft as any)?.total_clausul_risk ?? 0,
    metadata: metadataOf(draft?.metadata),
  };
}

/**
 * Maps DB comment record to domain DraftComment model.
 */
export function mapComment(
  record: DraftCommentRecord,
  userId: string,
): DraftComment {
  const meta = (record.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: record.id,
    authorId: record.author_id,
    authorName: record.profiles?.full_name || "Pengguna Klarisa",
    avatarUrl: record.profiles?.avatar_url ?? null,
    body: record.comment,
    parentId: record.parent_id,
    selectedText: (meta.selected_text as string | null) ?? null,
    documentVersionId: (meta.document_version_id as string | null) ?? null,
    createdAt: record.created_at,
    resolvedAt: (meta.resolved_at as string | null) ?? null,
    isResolved: Boolean(meta.resolved_at),
    isOwn: record.author_id === userId,
  };
}

/**
 * Maps DB collaborator record to domain DraftCollaborator model.
 */
export function mapCollaborator(
  record: DraftCollaboratorRecord,
): DraftCollaborator {
  return {
    userId: record.user_id,
    name: record.profiles?.full_name || "Pengguna Klarisa",
    avatarUrl: record.profiles?.avatar_url ?? null,
    role: record.role,
  };
}

/**
 * Maps DB document draft row to domain DraftVersion model.
 */
export function mapDraftVersion(record: DocumentDraftRow): DraftVersion {
  return {
    id: record.id,
    title: record.title,
    version: record.version,
    createdAt: record.created_at,
    createdBy: record.created_by,
  };
}
