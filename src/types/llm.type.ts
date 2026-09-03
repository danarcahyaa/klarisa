import { ComplianceStatus } from "./legal.type";
import type { BaseResponse } from "./response.type";
import { Type } from "@google/genai";

/** Supported LLM provider for contract reasoning and text generation. */
export type LlmProvider = "gemini" | "groq";

/** Options passed to LLM completion generation calls. */
export interface GenerateCompletionOptions {
  /** Target LLM provider to handle the completion request (default: "groq"). */
  provider?: LlmProvider;
  /** System instruction or persona prompt for the model. */
  systemInstruction?: string;
  /** Instructs the model to output strict JSON. */
  jsonMode?: boolean;
  /** Structured OpenAPI / Type schema for enforced JSON output format. */
  responseSchema?: unknown;
  /** Temperature sampling setting (0.0 to 1.0). */
  temperature?: number;
  /** Maximum output token limit. */
  maxTokens?: number;
}

/** Normalized completion result output from LLM provider. */
export interface LlmCompletionResult {
  /** The generated raw text response from the model. */
  text: string;
  /** The LLM provider used for generation. */
  provider: LlmProvider;
  /** Specific model identifier name used (e.g. gemini-3.6-flash). */
  modelName: string;
}

/** Standard service response wrapper for LLM completion requests. */
export type LlmResponse = BaseResponse<LlmCompletionResult>;

/**
 * Strict OpenAPI / Type JSON schema for enforced LLM batch reasoning output generation.
 */
export const reasoningBatchSchema = {
  type: Type.ARRAY,
  description: "Daftar hasil analisis kepatuhan hukum untuk setiap klausul kontrak.",
  items: {
    type: Type.OBJECT,
    properties: {
      chunk_id: {
        type: Type.STRING,
        description: "ID spesifik klausul kontrak yang dianalisis.",
      },
      compliance_status: {
        type: Type.STRING,
        enum: ["VIOLATES_LAW", "UNFAIR_ONE_SIDED", "INCOMPLETE", "COMPLIANT"],
        description: "Status kepatuhan hukum klausul.",
      },
      matched_node_ids: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Daftar ID tag elemen HTML yang bermasalah.",
      },
      matched_regulation_ids: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Daftar ID regulasi rujukan yang melandasi temuan ini.",
      },
      legal_reasoning: {
        type: Type.STRING,
        description: "Penjelasan alasan risiko hukum secara lugas, sederhana, dan langsung ke inti masalah.",
      },
      recommendation: {
        type: Type.STRING,
        description: "Saran perbaikan konkret dan praktis.",
      },
    },
    required: [
      "chunk_id",
      "compliance_status",
      "legal_reasoning",
      "recommendation",
    ],
  },
};

/**
 * Strict JSON Schema structure specifically formatted for Groq / OpenAI Structured Outputs (`type: "json_schema"`).
 */
export const groqReasoningBatchSchema = {
  name: "contract_legal_reasoning_batch",
  strict: true,
  schema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        description: "Daftar hasil analisis kepatuhan hukum untuk setiap klausul kontrak.",
        items: {
          type: "object",
          properties: {
            chunk_id: {
              type: "string",
              description: "ID spesifik klausul kontrak yang dianalisis.",
            },
            compliance_status: {
              type: "string",
              enum: ["VIOLATES_LAW", "UNFAIR_ONE_SIDED", "INCOMPLETE", "COMPLIANT"],
              description: "Status kepatuhan hukum klausul.",
            },
            matched_node_ids: {
              type: "array",
              items: { type: "string" },
              description: "Daftar ID tag elemen HTML yang bermasalah.",
            },
            matched_regulation_ids: {
              type: "array",
              items: { type: "string" },
              description: "Daftar ID regulasi rujukan yang melandasi temuan ini.",
            },
            legal_reasoning: {
              type: "string",
              description: "Penjelasan alasan risiko hukum secara lugas, sederhana, dan langsung ke inti masalah.",
            },
            recommendation: {
              type: "string",
              description: "Saran perbaikan konkret dan praktis.",
            },
          },
          required: [
            "chunk_id",
            "compliance_status",
            "matched_node_ids",
            "matched_regulation_ids",
            "legal_reasoning",
            "recommendation",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["findings"],
    additionalProperties: false,
  },
};

/**
 * Strict JSON output schema expected from the LLM per chunk in legal reasoning.
 */
export interface LlmChunkOutput {
  chunk_id?: string;
  compliance_status: ComplianceStatus;
  matched_node_ids?: string[];
  matched_regulation_ids?: string[];
  legal_reasoning: string;
  recommendation: string;
}
