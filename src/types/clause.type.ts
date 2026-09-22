import type React from "react";
import type { Tables } from "@/types/database.type";
import type { BaseResponse } from "@/types/response.type";
import type { MatchLegalArticleResult } from "./legal.type";
import type { Editor } from "@tiptap/react";

export type LegalArticlesRow = Tables<"legal_articles">;
export type ClauseReferenceItem = MatchLegalArticleResult | LegalArticlesRow;

/**
 * Categorized status for single clause review:
 * - "AMBIGUOUS": Clause is unclear, fragmented words/letters, or incomplete expression.
 * - "VIOLATES_LAW": Clause is clear and violates Indonesian regulations/laws.
 * - "UNFAIR_ONE_SIDED": Clause does not violate law, but is one-sided and harms one party.
 * - "INCOMPLETE": Clause contains unfilled placeholders like [...] or blank fields.
 */
export type ClauseReviewStatus =
  | "AMBIGUOUS"
  | "VIOLATES_LAW"
  | "UNFAIR_ONE_SIDED"
  | "INCOMPLETE"
  | "SAFE";

/**
 * Single clause review entity stored in contract_draft.review_metadata array.
 */
export interface ClauseReviewItem {
  /** Unique highlight mark ID in the TipTap editor */
  id: string;
  /** The specific clause text selected and reviewed */
  clauseText: string;
  /** Legal analysis and reasoning from AI */
  result: string;
  /** Relevant statutory articles from legal_articles or vector match results */
  references: ClauseReferenceItem[];
  /** Categorized status of the review (AMBIGUOUS, VIOLATES_LAW, UNFAIR_ONE_SIDED, INCOMPLETE) */
  status?: ClauseReviewStatus;
  /** Whether the clause has legal or compliance risk */
  hasRisk?: boolean;
  /** ISO timestamp of review creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Type contract for contract_draft.review_metadata column.
 */
export type ContractDraftReviewMetadata = ClauseReviewItem[];

/**
 * Input DTO for triggering an AI review on a selected clause.
 */
export interface ReviewClauseInputDTO {
  /** Target contract UUID */
  contractId: string;
  /** Clause text to be reviewed */
  clauseText: string;
  /** Optional highlight mark ID if already generated */
  highlightId?: string;
  /** Active reviews list from hook memory (avoids extra SELECT) */
  currentReviews?: ClauseReviewItem[];
  /** Whether to persist the review to the database (default true) */
  saveToDatabase?: boolean;
}

/**
 * DTO for persisting an updated reviews array directly.
 */
export interface SaveClauseReviewsDTO {
  /** Target contract UUID */
  contractId: string;
  /** Array of clause reviews to persist */
  reviews: ClauseReviewItem[];
}

/**
 * Input DTO for deleting a single clause review.
 */
export interface DeleteClauseReviewDTO {
  /** Target contract UUID */
  contractId: string;
  /** ID of the clause review mark to delete */
  clauseId: string;
}

/**
 * Response type for single clause review action.
 */
export type ReviewClauseResponse = BaseResponse<{
  review: ClauseReviewItem;
  reviews: ClauseReviewItem[];
}>;

/**
 * Response type for reviews array mutation.
 */
export type SaveClauseReviewsResponse = BaseResponse<{
  reviews: ClauseReviewItem[];
}>;

/**
 * Strict JSON Schema for Groq structured output on single clause review.
 * Classifies the clause into 4 distinct statuses: AMBIGUOUS, VIOLATES_LAW, UNFAIR_ONE_SIDED, INCOMPLETE.
 */
export const GROQ_CLAUSE_REVIEW_SCHEMA = {
  name: "single_clause_review",
  strict: true,
  schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["AMBIGUOUS", "VIOLATES_LAW", "UNFAIR_ONE_SIDED", "INCOMPLETE", "SAFE"],
        description:
          "Status hasil review klausul: 'AMBIGUOUS' jika teks tidak jelas/serpihan kata/huruf; 'VIOLATES_LAW' jika melanggar ketentuan hukum/UU; 'UNFAIR_ONE_SIDED' jika berat sebelah/merugikan salah satu pihak; 'INCOMPLETE' jika klausul mengandung placeholder belum diisi seperti [...] atau garis bawah; 'SAFE' jika klausul wajar, adil, seimbang, dan aman.",
      },
      explanation: {
        type: "string",
        description:
          "Penjelasan singkat mengenai maksud klausul dengan bahasa sehari-hari yang mudah dimengerti orang awam tanpa istilah teknis hukum (maksimal 2 kalimat). WAJIB dikosongkan (string kosong '') jika status adalah 'AMBIGUOUS'.",
      },
      analysis: {
        type: "string",
        description:
          "Uraian hasil review tanpa istilah teknis yang sulit (maksimal 2-3 kalimat): Untuk 'AMBIGUOUS', jelaskan singkat bahwa klausul masih ambigu/tidak lengkap. Untuk 'VIOLATES_LAW', sebutkan pasal dan UU yang dilanggar secara sederhana. Untuk 'UNFAIR_ONE_SIDED', jelaskan potensi berat sebelah dan pihak yang dirugikan. Untuk 'INCOMPLETE', sebutkan placeholder yang belum terisi. Untuk 'SAFE', cukup jelaskan secara singkat mengenai klausul tersebut.",
      },
      has_risk: {
        type: "boolean",
        description:
          "false jika status 'AMBIGUOUS' atau 'SAFE'. true jika status 'VIOLATES_LAW', 'UNFAIR_ONE_SIDED', atau 'INCOMPLETE'.",
      },
      cited_article_ids: {
        type: "array",
        items: { type: "string" },
        description:
          "Daftar ID pasal regulasi yang relevan dari database jika ada.",
      },
    },
    required: ["status", "explanation", "analysis", "has_risk", "cited_article_ids"],
    additionalProperties: false,
  },
} as const;

/**
 * Parsed structure of LLM JSON response adhering to GROQ_CLAUSE_REVIEW_SCHEMA.
 */
export interface StructuredClauseReviewOutput {
  status: ClauseReviewStatus;
  explanation: string;
  analysis: string;
  has_risk: boolean;
  cited_article_ids: string[];
}

/**
 * Configuration options for useClause hook.
 */
export interface UseClauseOptions {
  /** Target contract UUID */
  contractId?: string;
  /** Initial reviews array loaded with contract draft detail */
  initialReviews?: ClauseReviewItem[] | null;
  /** Tiptap Editor instance for inspecting marks and unsetting highlights */
  editor?: Editor | null;
  /** Optional callback fired when reviews list changes */
  onReviewsChange?: (reviews: ClauseReviewItem[]) => void;
}

/**
 * Return contract for useClause hook.
 */
export interface UseClauseReturn {
  /** Active array of clause reviews */
  reviews: ClauseReviewItem[];
  /** Loading state while AI is reviewing a clause */
  isReviewing: boolean;
  /** Loading state while a review is being deleted */
  isDeletingReview: boolean;
  /** User-friendly error message if review operation fails */
  reviewError: string | null;
  /** Currently selected or active review mark ID */
  activeReviewId: string | null;
  /** Set active review mark ID */
  setActiveReviewId: (id: string | null) => void;
  /** Executes AI review for selected clause text and optionally persists to database */
  handleReviewClause: (
    clauseText: string,
    highlightId: string,
    saveToDatabase?: boolean
  ) => Promise<ClauseReviewItem | null>;
  /** Deletes a review from database and removes highlight mark from editor */
  handleDeleteReview: (highlightId: string) => Promise<boolean>;
  /** Manually saves an updated reviews array directly to database */
  handleSaveReviews: (updatedReviews: ClauseReviewItem[]) => Promise<boolean>;
  /** Retrieves a saved review by its highlight mark ID */
  getReviewById: (highlightId: string) => ClauseReviewItem | null;
}

/**
 * Stages of the interactive clause review lifecycle.
 */
export type ReviewProcessStep = "preparing" | "processing" | "completed";

/**
 * Input options for useSelectionTooltip hook.
 */
export interface UseSelectionTooltipOptions {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Callback triggered when user clicks the 'Ask' button */
  onAsk: (selectedText: string, highlightId?: string) => void;
  /** Optional callback triggered when user clicks 'Review' */
  onReview?: (selectedText: string, highlightId?: string) => void;
  /** Optional callback triggered when user clicks 'Revise Clause' */
  onReviseClause?: (
    selectedText: string,
    instruction?: string,
    citationId?: string,
    reviewContext?: string,
    selectionRange?: { from: number; to: number }
  ) => void;

  /** Active reviews list from useClause */
  reviews?: ClauseReviewItem[];
  /** Loading state for AI review */
  isReviewing?: boolean;
  /** Loading state for AI clause revision */
  isRevisingClause?: boolean;

  /** Callback to trigger AI review for a clause */
  onReviewClause?: (
    clauseText: string,
    highlightId: string,
    saveToDatabase?: boolean
  ) => Promise<ClauseReviewItem | null>;
  /** Callback to delete a review */
  onDeleteReview?: (highlightId: string) => Promise<boolean>;
  /** Function to look up review by highlight ID */
  getReviewById?: (highlightId: string) => ClauseReviewItem | null;
}

/**
 * Return contract for useSelectionTooltip hook.
 */
export interface UseSelectionTooltipReturn {
  isReviewOpen: boolean;
  isForceHidden: boolean;
  canvasBoundary: Element | null;
  activeHighlightId: string | null;
  activeReviewResult: ClauseReviewItem | null;
  reviewStep: ReviewProcessStep | undefined;
  selectedTextString: string;
  isExistingReview: boolean;
  saveReviewEnabled: boolean;
  handleToggleSaveReview: (enabled: boolean) => void;
  handleStartNewReview: () => void;
  handleReviewOpenChange: (open: boolean) => void;
  handleReviewClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleReviseClauseClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleAskClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleStartReview: () => Promise<ClauseReviewItem | null>;
  handleDeleteReview: () => void;
}

/**
 * Sub-phase of the clause review processing state.
 */
export type ReviewProcessingPhase =
  | "fetching_regulations"
  | "reviewing_clause"
  | "completed";

/**
 * Result data contract for an analyzed clause displayed in review popover.
 */
export interface ClauseReviewResult {
  status?: ClauseReviewStatus;
  summary?: string;
  reasoning?: string;
  result?: string;
  recommendation?: string;
  hasRisk?: boolean;
  references?: Array<{
    code?: string | null;
    name?: string | null;
    title?: string;
    article_number?: string;
    content?: string;
    [key: string]: any;
  }>;
}

/**
 * Configuration options for useReviewMarker hook.
 */
export interface UseReviewMarkerOptions {
  /** The clause text selected in the editor */
  selectedText?: string;
  /** Controlled open state */
  open?: boolean;
  /** Callback triggered when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Optional explicit process step if controlled externally */
  step?: ReviewProcessStep;
  /** Optional explicit review result if provided by caller */
  result?: ClauseReviewResult | null;
  /** Optional callback triggered when popover is dismissed */
  onDismiss?: () => void;
  /** Optional boundary element to constrain popover within */
  collisionBoundary?: Element | null | Array<Element | null>;
  /** Callback triggered when user clicks 'Hapus review' in the result step */
  onDeleteReview?: () => void;
  /** Optional callback to execute live AI review */
  onStartReview?: () => Promise<any>;
  /** Whether to show the bottom footer with action buttons (default: true) */
  showFooter?: boolean;
  /** Preferred placement side ('top' | 'bottom') */
  side?: "top" | "bottom";
  /** Preferred alignment ('start' | 'center' | 'end') */
  align?: "start" | "center" | "end";
}

/**
 * Return contract for useReviewMarker hook.
 */
export interface UseReviewMarkerReturn {
  isOpen: boolean;
  currentStep: ReviewProcessStep;
  processingPhase: ReviewProcessingPhase;
  activeBoundary: Element | null | Array<Element | null> | undefined;
  currentResult: ClauseReviewResult | null;
  activeText?: string;
  showFooter: boolean;
  handleClose: () => void;
  handleOpenChange: (nextOpen: boolean) => void;
  handleDeleteReview: () => void;
}

/**
 * Props for ReviewMarkerPopover component.
 */
export interface ReviewMarkerPopoverProps extends UseReviewMarkerOptions {
  /** Optional trigger element (e.g. 'Review Klausul' button) */
  children?: React.ReactNode;
}

/**
 * Props for ReviseMarkerPopover component.
 */
export interface ReviseMarkerPopoverProps {
  /** Controls open state of the popover */
  open?: boolean;
  /** Callback triggered when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Preferred placement side */
  side?: "top" | "bottom";
  /** Preferred alignment */
  align?: "start" | "center" | "end";
  /** Boundary element to constrain popover within */
  collisionBoundary?: Element | null | Array<Element | null>;
  /** Callback triggered when user clicks 'Mulai' */
  onStartRevise?: (instruction?: string) => void;
  /** Optional placeholder text for the instruction input */
  placeholder?: string;
  /** Optional custom trigger element */
  children?: React.ReactNode;
}

