import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, TablesInsert } from "@/types/database.type";
import type { ContractDraftRow, ContractRow } from "@/types/contract.type";

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

  async listCollaborations(userId: string) {
    return this.supabase
      .from("draft_collaborators")
      .select("contract_id, role")
      .eq("user_id", userId);
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
      .from("contracts")
      .select("*, contract_draft(*)")
      .eq("id", contractId)
      .eq("type", "draft")
      .maybeSingle();
  }

  async findCollaborator(userId: string, contractId: string) {
    return this.supabase
      .from("draft_collaborators")
      .select("*")
      .eq("contract_id", contractId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  async listCollaborators(contractId: string) {
    return this.supabase
      .from("draft_collaborators")
      .select("*, profiles!draft_collaborators_user_id_fkey(full_name, avatar_url)")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });
  }

  async upsertCollaborator(payload: TablesInsert<"draft_collaborators">) {
    return this.supabase
      .from("draft_collaborators")
      .upsert(payload, { onConflict: "contract_id,user_id" })
      .select("*, profiles!draft_collaborators_user_id_fkey(full_name, avatar_url)")
      .single();
  }

  async updateCollaboratorRole(contractId: string, userId: string, role: "commenter" | "viewer") {
    return this.supabase
      .from("draft_collaborators")
      .update({ role })
      .eq("contract_id", contractId)
      .eq("user_id", userId)
      .select("*, profiles!draft_collaborators_user_id_fkey(full_name, avatar_url)")
      .maybeSingle();
  }

  async deleteCollaborator(contractId: string, userId: string) {
    return this.supabase
      .from("draft_collaborators")
      .delete()
      .eq("contract_id", contractId)
      .eq("user_id", userId);
  }

  async findAuthUserByEmail(email: string) {
    const result = await this.supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (result.error) return { data: null, error: result.error };
    return {
      data: result.data.users.find((user) => user.email?.toLocaleLowerCase("id-ID") === email) ?? null,
      error: null,
    };
  }

  async listComments(contractId: string) {
    return this.supabase
      .from("draft_comments")
      .select("*, profiles!draft_comments_author_id_fkey(full_name, avatar_url)")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });
  }

  async createComment(payload: TablesInsert<"draft_comments">) {
    return this.supabase
      .from("draft_comments")
      .insert(payload)
      .select("*, profiles!draft_comments_author_id_fkey(full_name, avatar_url)")
      .single();
  }

  async findComment(contractId: string, commentId: string) {
    return this.supabase
      .from("draft_comments")
      .select("*, profiles!draft_comments_author_id_fkey(full_name, avatar_url)")
      .eq("id", commentId)
      .eq("contract_id", contractId)
      .maybeSingle();
  }

  async updateComment(contractId: string, commentId: string, comment: string) {
    return this.supabase
      .from("draft_comments")
      .update({ comment })
      .eq("id", commentId)
      .eq("contract_id", contractId)
      .select("*, profiles!draft_comments_author_id_fkey(full_name, avatar_url)")
      .maybeSingle();
  }

  async setCommentResolved(contractId: string, commentId: string, resolvedAt: string | null, resolvedBy: string | null) {
    // Since resolved_at/by are not standalone columns, they are stored in metadata
    const current = await this.supabase
      .from("draft_comments")
      .select("metadata")
      .eq("id", commentId)
      .eq("contract_id", contractId)
      .maybeSingle();
    const existingMeta = (current.data?.metadata as Record<string, unknown>) ?? {};
    const updatedMeta = { ...existingMeta, resolved_at: resolvedAt, resolved_by: resolvedBy };
    return this.supabase
      .from("draft_comments")
      .update({ metadata: updatedMeta })
      .eq("id", commentId)
      .eq("contract_id", contractId);
  }

  async deleteComment(contractId: string, commentId: string) {
    return this.supabase
      .from("draft_comments")
      .delete()
      .eq("id", commentId)
      .eq("contract_id", contractId);
  }

  async findOwnedWorkspace(userId: string) {
    return this.supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
  }

  async upsertDraftSettings(payload: TablesInsert<"draft_settings">) {
    return this.supabase
      .from("draft_settings")
      .upsert(payload, { onConflict: "contract_id" })
      .select()
      .single();
  }

  async getDraftSettings(contractId: string) {
    return this.supabase
      .from("draft_settings")
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

  async listDraftVersions(contractId: string) {
    return this.supabase
      .from("document_drafts")
      .select("*")
      .eq("document_id", contractId)
      .order("version", { ascending: false });
  }

  async findDraftVersion(contractId: string, versionId: string) {
    return this.supabase
      .from("document_drafts")
      .select("*")
      .eq("document_id", contractId)
      .eq("id", versionId)
      .maybeSingle();
  }

  async deleteDraftVersions(contractId: string) {
    return this.supabase
      .from("document_drafts")
      .delete()
      .eq("document_id", contractId);
  }

  async updateTitle(contractId: string, title: string) {
    return this.supabase.from("contracts").update({ title }).eq("id", contractId).eq("type", "draft").select().single();
  }

  async upsertDraft(payload: TablesInsert<"contract_draft">) {
    return this.supabase.from("contract_draft").upsert(payload, { onConflict: "contract_id" }).select().single();
  }

  async updateDraftMetadata(contractId: string, metadata: TablesInsert<"contract_draft">["metadata"]) {
    return this.supabase.from("contract_draft").update({ metadata }).eq("contract_id", contractId);
  }

  async createDraftVersion(payload: TablesInsert<"document_drafts">) {
    return this.supabase.from("document_drafts").insert(payload).select().single();
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
      p_chat_id: payload.chatId ?? null,
      p_title: payload.title ?? null,
      p_last_interaction_id: payload.lastInteractionId ?? null,
      p_metadata: payload.metadata ?? null,
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
}

export function createDraftRepository(client: SupabaseClient<Database>) {
  return new DraftRepository(client);
}
