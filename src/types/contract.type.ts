import type { BaseResponse } from "@/types/response.type";
import type { Json, Tables } from "@/types/database.type";

export type ContractRow = Tables<"contracts">;
export type ContractDraftRow = Tables<"contract_draft">;
export type DocumentDraftRow = Tables<"document_drafts">;
export type ContractType = "review" | "draft";

export interface ContractMetadata {
  source_file_name?: string;
  encryption?: string;
  validation?: string;
  shared?: boolean;
  recipients?: number;
  comments?: number;
  version?: number;
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

export type ContractResponse<T> = BaseResponse<T>;
