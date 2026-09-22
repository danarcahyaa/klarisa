import type { BaseResponse } from "@/types/response.type";

/**
 * Categorized reasoning type for clause revision:
 * - "VIOLATES_LAW": Clause substantively violates statutory regulations/laws in Indonesia.
 * - "UNFAIR_ONE_SIDED": Clause does not violate law, but is one-sided and unfairly prejudices one party.
 * - "INCOMPLETE": Clause contains unfilled placeholders like [...] or blank fields that need completion.
 * - "SAFE": Clause is fair, balanced, and legal without risks.
 * - "AMBIGUOUS": Clause is unclear, fragmented words/letters, or lacks coherent clause meaning.
 */
export type ClauseRevisionType =
  | "VIOLATES_LAW"
  | "UNFAIR_ONE_SIDED"
  | "INCOMPLETE"
  | "SAFE"
  | "AMBIGUOUS";

/**
 * Input DTO for triggering an AI clause revision.
 */
export interface ReviseClauseInputDTO {
  /** The specific clause text selected on the editor (stripped of HTML tags) */
  selectedClause: string;
  /** Unique highlight mark ID in the TipTap editor */
  citationId: string;
  /** Optional additional user instructions for revision */
  additionalPrompt?: string;
  /** Optional previous review context if this clause has already been reviewed */
  reviewContext?: string;
}

/**
 * Output structure from AI clause revision.
 */
export interface ReviseClauseResult {
  /** Categorized reasoning type */
  type: ClauseRevisionType;
  /** The clean original clause text selected by the user */
  selected_clause: string;
  /** The revised clause formatted in standard TipTap-supported HTML tags */
  revision_clause: string;
  /** The matching citation/mark ID on the editor */
  citation_id: string;
}

/**
 * Standardized API response for clause revision.
 */
export type ReviseClauseResponse = BaseResponse<ReviseClauseResult>;

/**
 * Strict JSON Schema for Groq structured output on clause revision.
 */
export const GROQ_REVISE_CLAUSE_SCHEMA = {
  name: "revise_clause_result",
  strict: true,
  schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["VIOLATES_LAW", "UNFAIR_ONE_SIDED", "INCOMPLETE", "SAFE", "AMBIGUOUS"],
        description:
          "Klasifikasi reasoning klausul: VIOLATES_LAW jika melanggar hukum; UNFAIR_ONE_SIDED jika berat sebelah; INCOMPLETE jika ada placeholder/bagian belum lengkap; SAFE jika aman dan seimbang; AMBIGUOUS jika tidak jelas/terpotong.",
      },
      selected_clause: {
        type: "string",
        description: "Teks klausul asli yang dipilih pengguna tanpa tag HTML.",
      },
      revision_clause: {
        type: "string",
        description:
          "Rumusan klausul revisi dalam tag HTML yang valid sesuai formatting TipTap. DILARANG menyebutkan nama undang-undang atau nomor pasal di dalam teks revisi ini.",
      },
      citation_id: {
        type: "string",
        description: "Citation ID yang sama persis dengan citation_id input.",
      },
    },
    required: ["type", "selected_clause", "revision_clause", "citation_id"],
    additionalProperties: false,
  },
} as const;
