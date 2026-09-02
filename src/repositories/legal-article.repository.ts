import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.type";
import type {
  MatchLegalArticlesParams,
} from "@/types/legal.type";

export class LegalArticleRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Search for semantically similar legal articles using pgvector cosine similarity RPC.
   */
  async matchArticles(params: MatchLegalArticlesParams) {
    const queryEmbeddingString =
      typeof params.queryEmbedding === "string"
        ? params.queryEmbedding
        : JSON.stringify(params.queryEmbedding);

    return this.supabase.rpc("match_legal_articles", {
      query_embedding: queryEmbeddingString,
      match_threshold: params.matchThreshold ?? 0.5,
      match_count: params.matchCount ?? 5,
    });
  }

  /**
   * Find a single legal article by its unique ID.
   */
  async findById(id: string) {
    return this.supabase
      .from("legal_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  }

  /**
   * Retrieve all legal articles associated with a specific regulation ID.
   */
  async listByRegulationId(regulationId: string) {
    return this.supabase
      .from("legal_articles")
      .select("*")
      .eq("regulation_id", regulationId)
      .order("article_number", { ascending: true });
  }
}

/**
 * Factory function to create a new LegalArticleRepository instance with the provided Supabase client.
 */
export function createLegalArticleRepository(client: SupabaseClient<Database>) {
  return new LegalArticleRepository(client);
}
