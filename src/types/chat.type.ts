import type { BaseResponse } from "./response.type";
import type { Tables, TablesInsert } from "./database.type";

/**
 * Chat table row model derived from Supabase database schema.
 */
export type ChatRow = Tables<"chats">;

/**
 * Chat insert model for creating new chat threads.
 */
export type ChatInsert = TablesInsert<"chats">;

/**
 * ChatConversation table row model derived from Supabase database schema.
 */
export type ChatConversationRow = Tables<"chat_conversations">;

/**
 * ChatConversation insert model for inserting Q&A pairs into a chat thread.
 */
export type ChatConversationInsert = TablesInsert<"chat_conversations">;

/**
 * Composite model representing a Chat thread along with its array of Q&A conversations.
 */
export type ChatWithConversations = ChatRow & {
  chat_conversations: ChatConversationRow[];
  hasMoreConversations?: boolean;
  totalConversations?: number;
};

/**
 * DTO for paginating conversation messages within a specific chat.
 */
export interface ListConversationsDTO {
  chat_id: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated response structure for conversation messages within a chat.
 */
export interface PaginatedConversationsData {
  conversations: ChatConversationRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * DTO for creating a new chat thread. Title is optional; if omitted, first question text is used as title.
 */
export interface CreateChatDTO {
  title?: string;
  question?: string;
}

/**
 * DTO for creating a new chat and automatically inserting its first question & answer pair.
 */
export interface CreateChatWithQuestionDTO {
  question: string;
  answer: string;
  title?: string;
}

/**
 * DTO for adding a question & answer conversation pair to an existing chat.
 */
export interface AddConversationDTO {
  chat_id: string;
  question: string;
  answer: string;
}

/**
 * DTO for searching and paginating chat threads.
 */
export interface SearchChatsDTO {
  query?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated response structure for chat listings.
 */
export interface PaginatedChatsData {
  chats: ChatRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Generic chat response wrapped in BaseResponse contract.
 */
export type ChatResponse<T = unknown> = BaseResponse<T>;
