import type { DocumentChunk } from "./common.type";
import type { ContractChunkItem } from "./contract-review.type";
import type { MatchLegalArticleResult } from "./legal.type";

/**
 * Chunk structure for AI-generated draft contract clause intents.
 */
export interface DraftClauseChunk {
  clause_name: string;
  search_intent: string;
}

/**
 * Union type representing any chunk structure (new pipeline DocumentChunk, legacy ContractChunkItem, or DraftClauseChunk).
 */
export type AnyChunkItem =
  | DocumentChunk
  | ContractChunkItem
  | DraftClauseChunk;

/**
 * Input structure for batch embedding generation.
 */
export interface GenerateEmbeddingInput<T extends AnyChunkItem = AnyChunkItem> {
  chunks: T[];
  batchSize?: number;
  batchDelayMs?: number;
}

/**
 * Options for RAG vector similarity search.
 */
export interface MatchOptions {
  matchThreshold?: number;
  matchCount?: number;
}

/**
 * Result structure of a chunk decorated with its vector embedding array.
 */
export type EmbeddedChunkResult<T extends AnyChunkItem = AnyChunkItem> = T & {
  embedding: number[];
};

/**
 * Result structure of a chunk decorated with matched legal regulations.
 */
export type MatchedChunkResult<T extends { embedding: number[] }> = Omit<
  T,
  "embedding"
> & {
  matched_regulations: MatchLegalArticleResult[];
};
