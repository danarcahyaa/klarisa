import { BaseResponse } from "./response.type";
import { ComplianceStatus, LegalArticle, LegalArticlesRow, MatchLegalArticleResult } from "./legal.type";
import type { DocumentChunk, EmbeddedDocumentChunk, MatchedDocumentChunk } from "./common.type";

export type DocumentUnitType = "section" | "clause" | "paragraph" | "table" | "unknown";

export type { DocumentChunk, EmbeddedDocumentChunk, MatchedDocumentChunk };



/**
 * Metadata attached to each semantic chunk produced by the DOCX pipeline.
 */
export interface ContractChunkMetadata {
  unit_type: DocumentUnitType;
  clause_id?: string;
  chapter?: string | null;
  article?: string | null;
  sourceDoc: string;
}

/**
 * A semantic chunk from the DOCX pipeline, ready for embedding generation.
 */
export interface ContractChunkItem {
  chunk_id: string;
  content: string;
  matched_node_ids: string[];
  metadata: ContractChunkMetadata;
}

/**
 * A chunk that has been embedded with a vector representation.
 */
export interface EmbeddedChunk extends ContractChunkItem {
  embedding: number[];
}

/**
 * A chunk with its matched legal regulations fetched from the pgvector DB.
 */
export interface MatchedChunk extends ContractChunkItem {
  matched_regulations: MatchLegalArticleResult[];
}

/**
 * The reasoning result for a single analyzed contract chunk.
 * Field names match what the review result UI components expect.
 */
export interface ChunkReasoningResult {
  matched_node_ids?: string[];
  clause_text?: string;
  compliance_status: ComplianceStatus;
  /** Legal references fetched from pgvector DB and passed to LLM as context. */
  applicable_legal_references: LegalArticle[];
  /** LLM legal reasoning explanation for this clause. */
  reasoning: string;
  /** LLM concrete revision suggestion for this clause. */
  revision_recommendation: string;
}

export interface ReasoningAnalysisResult {
  is_contract: boolean;
  not_contract_reason?: string;
  total_analyzed_clauses: number;
  risky_clauses_count: number;
  findings: ChunkReasoningResult[];
  has_error?: boolean;
  error_type?: "limitation" | "reasoning";
  error_message?: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
  errors: string[];
}

export interface UploadContractDocumentDTO {
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  content?: string;
  fairnessScore?: number;
  totalRisk?: number;
  metadata?: Record<string, unknown>;
}

export interface DisplayFinding extends ChunkReasoningResult {
  findingId: string;
}

export interface UseReviewReturn {
  file: File | null;
  fileName: string;
  fileSizeFormatted: string;
  parsedHtml: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  validationResult: DocumentValidationResult | null;
  handleFileSelect: (file: File | null) => boolean;
  handleUpload: () => Promise<boolean>;
  reset: () => void;
  dismissError: () => void;
}

export interface UseReviewResultWorkspaceReturn {
  fileName: string;
  createdAt: string | null;
  highlightedHtml: string | null;
  findings: DisplayFinding[];
  activeFinding: string;
  isLoading: boolean;
  error: string | null;
  isContract: boolean;
  notContractReason: string;
  totalAnalyzed: number;
  reasoningError?: {
    hasError: boolean;
    errorType: "limitation" | "reasoning";
    errorMessage?: string;
  } | null;
  selectFromList: (findingId: string) => void;
  handleBackToReview: () => void;
}

export type ContractReviewResponse<T> = BaseResponse<T>;