import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "@/types/database.type";
import type { ContractDraftRow, ContractRow } from "@/types/contract.type";

export type ContractRecord = ContractRow & {
  contract_draft: ContractDraftRow | null;
};

export class ContractRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listByUser(userId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*)")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
  }

  async findById(userId: string, contractId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*)")
      .eq("id", contractId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  async findLatestDraft(userId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*)")
      .eq("user_id", userId)
      .eq("type", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  async listDraftVersions(contractId: string) {
    return this.supabase
      .from("document_drafts")
      .select("*")
      .eq("document_id", contractId)
      .order("version", { ascending: false });
  }

  async updateTitle(userId: string, contractId: string, title: string) {
    return this.supabase.from("contracts").update({ title }).eq("id", contractId).eq("user_id", userId).select().single();
  }

  async upsertDraft(payload: TablesInsert<"contract_draft">) {
    return this.supabase.from("contract_draft").upsert(payload, { onConflict: "contract_id" }).select().single();
  }

  async createDraftVersion(payload: TablesInsert<"document_drafts">) {
    return this.supabase.from("document_drafts").insert(payload).select().single();
  }

}
