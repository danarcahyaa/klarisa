import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.type";
import type { ContractSearchFilterType } from "@/types/contract-search.type";

export class ContractRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Search contract documents from Supabase database filtered by user, title query, and category filter.
   */
  async searchContracts(params: {
    userId?: string;
    query?: string;
    filter?: ContractSearchFilterType;
    limit?: number;
    offset?: number;
  }) {
    let dbQuery = this.supabase
      .from("contracts")
      .select("*", { count: "exact" });

    if (params.userId) {
      dbQuery = dbQuery.eq("user_id", params.userId);
    }

    if (params.filter === "Draft") {
      dbQuery = dbQuery.eq("type", "draft");
    } else if (params.filter === "Review") {
      dbQuery = dbQuery.eq("type", "review");
    }

    if (params.query && params.query.trim().length > 0) {
      dbQuery = dbQuery.ilike("title", `%${params.query.trim()}%`);
    }

    dbQuery = dbQuery
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    return dbQuery;
  }

  /**
   * Delete a contract record by ID and user ID.
   */
  async deleteContract(userId: string, contractId: string) {
    return this.supabase
      .from("contracts")
      .delete()
      .eq("id", contractId)
      .eq("user_id", userId);
  }

  /**
   * Update title of a contract document.
   */
  async updateContractTitle(userId: string, contractId: string, newTitle: string) {
    return this.supabase
      .from("contracts")
      .update({ title: newTitle })
      .eq("id", contractId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();
  }

  /**
   * Toggle pinned status of a contract document.
   */
  async togglePinContract(userId: string, contractId: string, isPinned: boolean) {
    return this.supabase
      .from("contracts")
      .update({ is_pinned: isPinned })
      .eq("id", contractId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();
  }
}

/**
 * Factory helper function to instantiate ContractRepository with a Supabase client.
 */
export function createContractRepository(supabase: SupabaseClient<Database>) {
  return new ContractRepository(supabase);
}
