import type { Tables } from "@/types/database.type";

export type LegalArticlesRow = Tables<"legal_articles">;

export interface MatchLegalArticlesParams {
  queryEmbedding: number[] | string;
  matchThreshold?: number;
  matchCount?: number;
}

export interface MatchLegalArticleResult {
  id: string;
  regulation_id: string;
  code?: string | null;
  name?: string | null;
  book_title: string | null;
  chapter_title: string | null;
  section_title: string | null;
  article_number: string;
  content: string;
  explanation: string | null;
  similarity: number;
}

export interface LegalArticle {
  code?: string | null;
  name?: string | null;
  book_title?: string | null;
  chapter_title?: string | null;
  section_title?: string | null;
  article_number: string;
  content: string;
}

export type ComplianceStatus =
  | "VIOLATES_LAW"
  | "UNFAIR_ONE_SIDED"
  | "COMPLIANT"
  | "INCOMPLETE"
  | "AMBIGUOUS"
  | "SAFE";


