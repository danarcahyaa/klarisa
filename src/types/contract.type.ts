import type { BaseResponse } from "@/types/response.type";
import type { Json, Tables } from "@/types/database.type";

export type ContractRow = Tables<"contracts">;
export type ContractDraftRow = Tables<"contract_draft">;
export type DocumentDraftRow = Tables<"document_drafts">;
export type DraftSettingsRow = Tables<"draft_settings">;
export type DraftCollaboratorRow = Tables<"draft_collaborators">;
export type DraftCommentRow = Tables<"draft_comments">;
export type ContractType = "review" | "draft";

export interface ContractMetadata {
  source_file_name?: string;
  encryption?: string;
  validation?: string;
  shared?: boolean;
  recipients?: number;
  comments?: number;
  version?: number;
  draft_category?: string;
  draft_subtype?: string;
  generation_status?: "manual_outline" | "ai_generated";
  active_version_id?: string;
  [key: string]: Json | undefined;
}

export interface ContractListItem {
  id: string;
  title: string;
  type: ContractType;
  isPinned: boolean;
  updatedAt: string;
  score: number | null;
  riskCount: number;
  metadata: ContractMetadata;
}

export interface ContractDetail extends ContractListItem {
  content: string;
  versions: DraftVersion[];
  settings: DraftSettingsRow | null;
  collaborators: DraftCollaborator[];
  comments: DraftComment[];
  permission: "owner" | "editor" | "commenter" | "viewer";
}

export interface DraftVersion {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

export interface DraftVersionContent extends DraftVersion {
  content: string;
}

export interface DraftCollaborator {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: DraftCollaboratorRow["role"];
}

export interface DraftCommentMetadata {
  selected_text?: string | null;
  document_version_id?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  [key: string]: unknown;
}

export interface DraftComment {
  id: string;
  authorId: string;
  authorName: string;
  avatarUrl: string | null;
  /** Text content of the comment (mapped from DB column `comment`) */
  body: string;
  parentId: string | null;
  selectedText: string | null;
  documentVersionId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
  isOwn: boolean;
}

export interface ContractQuery {
  query?: string;
  type?: ContractType;
  shared?: boolean;
}

export interface SaveDraftDTO {
  title: string;
  content: string;
  createVersion?: boolean;
}

export interface CreateDraftDTO {
  title?: string;
  category: "creative_services" | "property_rental" | "business_partnership" | "other";
  subtype: string;
}

export interface AddDraftCommentDTO {
  /** Text content of the comment */
  body: string;
  parentId?: string;
  selectedText?: string;
}

export interface InviteDraftCollaboratorDTO {
  email: string;
}

export interface UpdateDraftCollaboratorDTO {
  userId: string;
  role: "commenter" | "viewer";
}

export interface UpdateDraftCommentDTO {
  body: string;
}

export type ContractResponse<T> = BaseResponse<T>;
export type {
  DocumentValidationResult,
  UploadContractDocumentDTO,
} from "./contract-review.type";

