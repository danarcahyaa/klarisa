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
  versions: DocumentDraftRow[];
  settings: DraftSettingsRow | null;
  collaborators: DraftCollaborator[];
  comments: DraftComment[];
  permission: "owner" | "editor" | "commenter" | "viewer";
}

export interface DraftCollaborator {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: DraftCollaboratorRow["role"];
}

export interface DraftComment {
  id: string;
  authorId: string;
  authorName: string;
  avatarUrl: string | null;
  body: string;
  parentId: string | null;
  selectedText: string | null;
  positionStart: number | null;
  positionEnd: number | null;
  createdAt: string;
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
  body: string;
  parentId?: string;
  selectedText?: string;
  positionStart?: number;
  positionEnd?: number;
}

export interface InviteDraftCollaboratorDTO {
  email: string;
}

export type ContractResponse<T> = BaseResponse<T>;
