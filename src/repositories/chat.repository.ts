import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/types/database.type";

export class ChatRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Create a new chat thread entry in the database.
   */
  async createChat(payload: TablesInsert<"chats">) {
    return this.supabase.from("chats").insert(payload).select().single();
  }

  /**
   * List all chat threads for a given user, ordered by latest updated timestamp.
   */
  async listChatsByUser(userId: string) {
    return this.supabase
      .from("chats")
      .select("*, chat_conversations(*)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
  }

  /**
   * Search and paginate chat threads for a specific user with optional title filtering.
   */
  async searchChatsByUser(
    userId: string,
    options: { query?: string; from: number; to: number }
  ) {
    let queryBuilder = this.supabase
      .from("chats")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .range(options.from, options.to);

    if (options.query && options.query.trim().length > 0) {
      queryBuilder = queryBuilder.ilike("title", `%${options.query.trim()}%`);
    }

    return queryBuilder;
  }

  /**
   * List paginated chat threads for a specific user (lazy pagination).
   */
  async listChatsPaginated(
    userId: string,
    options: { from: number; to: number; query?: string }
  ) {
    return this.searchChatsByUser(userId, options);
  }

  /**
   * Find a specific chat thread by ID belonging to a specific user, including its conversation messages.
   */
  async findChatById(userId: string, chatId: string) {
    return this.supabase
      .from("chats")
      .select("*, chat_conversations(*)")
      .eq("id", chatId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  /**
   * Update the title of a specific chat thread.
   */
  async updateChatTitle(userId: string, chatId: string, title: string) {
    return this.supabase
      .from("chats")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", chatId)
      .eq("user_id", userId)
      .select()
      .single();
  }

  /**
   * Delete a specific chat thread (cascade deletes its conversations in database if foreign key configured).
   */
  async deleteChat(userId: string, chatId: string) {
    return this.supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);
  }

  /**
   * Insert a new Q&A conversation entry into chat_conversations table.
   */
  async createConversation(payload: TablesInsert<"chat_conversations">) {
    return this.supabase
      .from("chat_conversations")
      .insert(payload)
      .select()
      .single();
  }

  /**
   * List all conversation Q&A entries for a specific chat ID ordered chronologically.
   */
  async listConversationsByChatId(chatId: string) {
    return this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
  }

  /**
   * List paginated conversation Q&A entries for a specific chat ID.
   * Defaults to descending order (created_at DESC) so that pagination retrieves the latest conversations first.
   */
  async listPaginatedConversationsByChatId(
    chatId: string,
    options: { from: number; to: number; ascending?: boolean }
  ) {
    return this.supabase
      .from("chat_conversations")
      .select("*", { count: "exact" })
      .eq("chat_id", chatId)
      .order("created_at", { ascending: options.ascending ?? false })
      .range(options.from, options.to);
  }

  /**
   * Delete a specific conversation entry by ID.
   */
  async deleteConversation(conversationId: string) {
    return this.supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId);
  }
}

/**
 * Factory function to instantiate ChatRepository with a Supabase client.
 */
export function createChatRepository(client: SupabaseClient<Database>) {
  return new ChatRepository(client);
}
