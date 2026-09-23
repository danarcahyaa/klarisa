import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, TablesInsert, TablesUpdate } from "@/types/database.type";
import type { ContractDraftRow, ContractRow } from "@/types/contract.type";
import type { ClauseReviewItem } from "@/types/clause.type";

export type ContractRecord = ContractRow & {
  contract_draft: ContractDraftRow | null;
};

export class DraftRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listByUser(userId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*)")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
  }

  async listDraftsByIds(contractIds: string[]) {
    if (contractIds.length === 0) return { data: [] as ContractRecord[], error: null };
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*)")
      .in("id", contractIds)
      .eq("type", "draft")
      .order("updated_at", { ascending: false });
  }

  async createContract(payload: TablesInsert<"contracts">) {
    return this.supabase.from("contracts").insert(payload).select().single();
  }

  async deleteContract(userId: string, contractId: string) {
    // Clean up associated draft record to prevent foreign key constraints
    await this.supabase.from("contract_draft").delete().eq("contract_id", contractId);
    return this.supabase.from("contracts").delete().eq("id", contractId).eq("user_id", userId);
  }

  async findById(userId: string, contractId: string) {
    return this.supabase
      .from("contracts")
      .select("*, contract_draft(*)")
      .eq("id", contractId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  async findDraftById(contractId: string) {
    return this.supabase
      .from("contract_draft")
      .select("*")
      .eq("contract_id", contractId)
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

  async listDraftVersions(_contractId: string) {
    return { data: [] as any[], error: null };
  }

  async findDraftVersion(_contractId: string, _versionId: string) {
    return { data: null, error: null };
  }

  async deleteDraftVersions(_contractId: string) {
    return { data: null, error: null };
  }

  /**
   * Updates a contract row and updates the updated_at timestamp.
   *
   * @param contractId Unique identifier of the contract.
   * @param payload Update fields for the contracts table.
   */
  async updateContract(contractId: string, payload: TablesUpdate<"contracts">) {
    return this.supabase
      .from("contracts")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", contractId)
      .select()
      .single();
  }

  /**
   * Updates a contract_draft row and touches the parent contract updated_at timestamp.
   *
   * @param contractId Unique identifier of the contract.
   * @param payload Update fields for the contract_draft table.
   */
  async updateDraft(contractId: string, payload: TablesUpdate<"contract_draft">) {
    const now = new Date().toISOString();
    const result = await this.supabase
      .from("contract_draft")
      .update({ ...payload, updated_at: now })
      .eq("contract_id", contractId)
      .select()
      .single();

    if (result.error) return result;

    await this.supabase
      .from("contracts")
      .update({ updated_at: now })
      .eq("id", contractId);

    return result;
  }

  /**
   * Directly updates the review_metadata JSON array in contract_draft without an initial SELECT query.
   *
   * @param contractId Unique identifier of the contract.
   * @param metadata Updated array of clause review items.
   */
  async updateReviewMetadata(contractId: string, metadata: ClauseReviewItem[]) {
    const now = new Date().toISOString();
    const result = await this.supabase
      .from("contract_draft")
      .update({
        review_metadata: metadata as unknown as Json,
        updated_at: now,
      })
      .eq("contract_id", contractId)
      .select()
      .single();

    if (result.error) return result;

    await this.supabase
      .from("contracts")
      .update({ updated_at: now })
      .eq("id", contractId);

    return result;
  }

  async updateTitle(contractId: string, title: string) {
    return this.supabase
      .from("contracts")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", contractId)
      .select()
      .single();
  }

  /**
   * Updates or upserts encrypted draft content and touches the parent contract updated_at timestamp.
   *
   * @param contractId Unique identifier of the contract.
   * @param encryptedContent AES-256-GCM encrypted HTML content.
   */
  async updateDraftContent(contractId: string, encryptedContent: string) {
    const now = new Date().toISOString();
    const draftResult = await this.supabase
      .from("contract_draft")
      .upsert(
        {
          contract_id: contractId,
          content: encryptedContent,
          updated_at: now,
        },
        { onConflict: "contract_id" }
      )
      .select()
      .single();

    if (draftResult.error) {
      return draftResult;
    }

    // Touch parent contract updated_at timestamp
    await this.supabase
      .from("contracts")
      .update({ updated_at: now })
      .eq("id", contractId);

    return draftResult;
  }

  async upsertDraft(payload: TablesInsert<"contract_draft">) {
    return this.supabase.from("contract_draft").upsert(payload, { onConflict: "contract_id" }).select().single();
  }

  async updateDraftMetadata(contractId: string, metadata: TablesInsert<"contract_draft">["metadata"]) {
    return this.supabase.from("contract_draft").update({ metadata }).eq("contract_id", contractId);
  }

  async createDraftVersion(_payload: any) {
    return { data: null, error: null };
  }

  /**
   * Saves an AI chat conversation atomically using the save_chat_conversation RPC function.
   *
   * @param payload Parameters for saving the chat conversation
   */
  async saveChatConversation(payload: {
    userId: string;
    question: string;
    answer: string;
    chatId?: string | null;
    title?: string | null;
    lastInteractionId?: string | null;
    metadata?: Json | null;
  }) {
    return this.supabase.rpc("save_chat_conversation", {
      p_user_id: payload.userId,
      p_question: payload.question,
      p_answer: payload.answer,
      p_chat_id: payload.chatId ?? undefined,
      p_title: payload.title ?? undefined,
      p_last_interaction_id: payload.lastInteractionId ?? undefined,
      p_metadata: payload.metadata ?? undefined,
    });
  }

  /**
   * Creates a new contract and associated contract_draft record atomically using the create_draft_document RPC function.
   *
   * @param payload Contract and draft record details.
   */
  async createDraftDocument(payload: {
    userId: string;
    title: string;
    encryptedContent: string;
    metadata?: Json;
  }) {
    const { data, error } = await this.supabase.rpc("create_draft_document", {
      p_user_id: payload.userId,
      p_title: payload.title,
      p_content: payload.encryptedContent,
      p_metadata: payload.metadata ?? {},
    });

    if (error) {
      throw error;
    }

    const res = data as unknown as {
      contract_id: string;
      draft_id: string;
      title: string;
      success: boolean;
    };

    return {
      contractId: res.contract_id,
      title: res.title,
    };
  }

  /**
   * Find a chat row by ID.
   *
   * @param chatId Unique identifier of the chat thread.
   */
  async findChatById(chatId: string) {
    return this.supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .maybeSingle();
  }
}

export function createDraftRepository(client: SupabaseClient<Database>) {
  return new DraftRepository(client);
}
