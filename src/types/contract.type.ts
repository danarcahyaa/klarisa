import type { BaseResponse } from "@/types/response.type";
import type { Json, Tables } from "@/types/database.type";
import type { ClauseReviewItem } from "@/types/clause.type";

export type ContractRow = Tables<"contracts">;
export type ContractDraftRow = Tables<"contract_draft">;
export interface DocumentDraftRow {
  id: string;
  title: string;
  version: number;
  created_at: string;
  created_by: string;
  body?: string;
  document_id?: string;
  updated_at?: string;
}
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
  reviewMetadata?: ClauseReviewItem[] | null;
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

import type { ChatRow } from "./chat.type";

export interface SaveDraftChatResult {
  chat_id: string;
  conversation_id: string;
  success: boolean;
  chat?: ChatRow | null;
}

export type {
  DocumentValidationResult,
  UploadContractDocumentDTO,
} from "./contract-review.type";
export type {
  SaveDraftChatDTO,
  UpdateDraftTitleDTO,
  SaveDraftContentDTO,
  DeleteDraftDTO,
} from "@/app/validations/contract.validation";

export interface UseDraftEditorOptions {
  initialDraft: {
    id?: string;
    title: string;
    content: string;
    updatedAt?: string | null;
    createdAt?: string | null;
  } | ContractDetail;
  backHref?: string;
  debounceMs?: number;
}

export interface UseDraftEditorReturn {
  id: string | undefined;
  title: string;
  content: string;
  updatedAt: string | null;
  isSaving: boolean;
  isSaved: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  isRenameDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  error: string | null;
  setIsRenameDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  handleContentChange: (newContent: string) => void;
  handleRename: (newTitle: string) => Promise<boolean>;
  handleDelete: () => Promise<boolean>;
}


