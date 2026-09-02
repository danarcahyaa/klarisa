import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "@/types/database.type";
import type { ContractDraftRow, ContractRow } from "@/types/contract.type";

export type ReviewContractRecord = ContractRow & {
  contract_draft: ContractDraftRow | null;
};

export class ReviewRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async createContract(payload: TablesInsert<"contracts">) {
    return this.supabase.from("contracts").insert(payload).select().single();
  }

  async createContractReview(payload: TablesInsert<"contract_review">) {
    return this.supabase.from("contract_review").insert(payload).select().single();
  }

  async deleteContract(userId: string, contractId: string) {
    return this.supabase.from("contracts").delete().eq("id", contractId).eq("user_id", userId);
  }

  /**
   * PostgreSQL RPC Stored Procedure / Transactional upload for contracts and contract_review.
   * Executes atomic transaction in PostgreSQL via RPC `upload_contract_review`.
   * If contract_review insertion fails, PostgreSQL automatically rolls back contracts insert.
   */
  async uploadContractReviewTransaction(
    contractPayload: TablesInsert<"contracts">,
    reviewPayload: Omit<TablesInsert<"contract_review">, "contract_id">
  ) {
    const rpcParams = {
      p_user_id: contractPayload.user_id,
      p_title: contractPayload.title,
      p_type: contractPayload.type ?? "review",
      p_is_pinned: contractPayload.is_pinned ?? false,
      p_content: reviewPayload.content,
      p_fairness_score: reviewPayload.fairness_score ?? 0,
      p_total_clausul_risk: reviewPayload.total_clausul_risk ?? 0,
      p_metadata: reviewPayload.metadata ?? {},
    };

    let rpcResult = await this.supabase.rpc("save_contract_review_result" as any, rpcParams);
    if (rpcResult.error) {
      rpcResult = await this.supabase.rpc("upload_contract_review" as any, rpcParams);
    }

    if (!rpcResult.error && rpcResult.data) {
      const responseData = rpcResult.data as unknown as {
        contract_id: string;
        review_id: string;
      };
      return {
        data: {
          contract: { ...contractPayload, id: responseData.contract_id } as ContractRow,
          review: { ...reviewPayload, id: responseData.review_id, contract_id: responseData.contract_id } as TablesInsert<"contract_review">,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: rpcResult.error,
    };
  }

  async upsertDraft(payload: TablesInsert<"contract_draft">) {
    return this.supabase.from("contract_draft").upsert(payload, { onConflict: "contract_id" }).select().single();
  }

  async findById(userId: string, contractId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*), contract_review(*)")
      .eq("id", contractId)
      .eq("user_id", userId)
      .eq("type", "review")
      .maybeSingle();
  }

  async listByUser(userId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*), contract_review(*)")
      .eq("user_id", userId)
      .eq("type", "review")
      .order("updated_at", { ascending: false });
  }

  async updateDraftMetadata(contractId: string, metadata: TablesInsert<"contract_draft">["metadata"]) {
    return this.supabase.from("contract_draft").update({ metadata }).eq("contract_id", contractId);
  }
}

export function createReviewRepository(client: SupabaseClient<Database>) {
  return new ReviewRepository(client);
}
