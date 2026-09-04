import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.type";
import { ChatRepository, createChatRepository } from "@/repositories/chat.repository";
import {
  addConversationSchema,
  createChatSchema,
  createChatWithQuestionSchema,
  updateChatTitleSchema,
} from "@/app/validations/chat.validation";
import { createErrorResponse, createSuccessResponse, mapSupabaseError } from "@/lib/response";
import type {
  AddConversationDTO,
  ChatConversationRow,
  ChatResponse,
  ChatRow,
  ChatWithConversations,
  CreateChatDTO,
  CreateChatWithQuestionDTO,
} from "@/types/chat.type";

export class ChatService {
  constructor(private readonly repo: ChatRepository) {}

  /**
   * Helper function to derive a chat title from explicit title input or the first user question.
   */
  private deriveTitle(title?: string, question?: string): string {
    if (title && title.trim().length > 0) {
      return title.trim().slice(0, 255);
    }
    if (question && question.trim().length > 0) {
      return question.trim().slice(0, 100);
    }
    return "Percakapan Baru";
  }

  /**
   * Create a new chat session for an authenticated user.
   * If title is not specified, uses the user's first input question as the title.
   */
  async createChat(userId: string, data: CreateChatDTO): Promise<ChatResponse<ChatRow>> {
    const validation = createChatSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input percakapan tidak valid.";
      return createErrorResponse(firstError);
    }

    const title = this.deriveTitle(validation.data.title, validation.data.question);

    const { data: chatData, error } = await this.repo.createChat({
      user_id: userId,
      title,
    });

    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    return createSuccessResponse(chatData, "Percakapan baru berhasil dibuat.");
  }

  /**
   * Create a new chat session and insert its initial question & answer pair.
   * Automatically sets the chat title to the user's first question if title is not specified.
   */
  async createChatWithQuestion(
    userId: string,
    data: CreateChatWithQuestionDTO
  ): Promise<ChatResponse<ChatWithConversations>> {
    const validation = createChatWithQuestionSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input percakapan tidak valid.";
      return createErrorResponse(firstError);
    }

    const { question, answer, title: customTitle } = validation.data;
    const title = this.deriveTitle(customTitle, question);

    // 1. Create chat thread with derived title
    const { data: chatData, error: chatError } = await this.repo.createChat({
      user_id: userId,
      title,
    });

    if (chatError || !chatData) {
      return createErrorResponse(mapSupabaseError(chatError?.message || "Gagal membuat percakapan."));
    }

    // 2. Insert initial conversation pair
    const { data: conversationData, error: convError } = await this.repo.createConversation({
      chat_id: chatData.id,
      question: question.trim(),
      answer: answer.trim(),
    });

    if (convError || !conversationData) {
      return createErrorResponse(mapSupabaseError(convError?.message || "Gagal menyimpan pesan awal."));
    }

    const result: ChatWithConversations = {
      ...chatData,
      chat_conversations: [conversationData],
    };

    return createSuccessResponse(result, "Percakapan berhasil dimulai.");
  }

  /**
   * Retrieve all chat sessions for an authenticated user.
   */
  async getUserChats(userId: string): Promise<ChatResponse<ChatWithConversations[]>> {
    const { data, error } = await this.repo.listChatsByUser(userId);
    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    return createSuccessResponse(
      (data as ChatWithConversations[]) || [],
      "Daftar percakapan berhasil dimuat."
    );
  }

  /**
   * Retrieve a specific chat session with its full message history.
   */
  async getChatDetail(userId: string, chatId: string): Promise<ChatResponse<ChatWithConversations>> {
    if (!chatId) {
      return createErrorResponse("ID percakapan tidak valid.");
    }

    const { data, error } = await this.repo.findChatById(userId, chatId);
    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    if (!data) {
      return createErrorResponse("Percakapan tidak ditemukan atau Anda tidak memiliki akses.");
    }

    return createSuccessResponse(
      data as ChatWithConversations,
      "Detail percakapan berhasil dimuat."
    );
  }

  /**
   * Add a question & answer message pair to an existing chat.
   */
  async addConversation(
    userId: string,
    data: AddConversationDTO
  ): Promise<ChatResponse<ChatConversationRow>> {
    const validation = addConversationSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Payload pesan tidak valid.";
      return createErrorResponse(firstError);
    }

    const { chat_id, question, answer } = validation.data;

    // Verify chat ownership first
    const { data: existingChat, error: chatError } = await this.repo.findChatById(userId, chat_id);
    if (chatError || !existingChat) {
      return createErrorResponse("Percakapan tidak ditemukan atau akses ditolak.");
    }

    const { data: conversationData, error } = await this.repo.createConversation({
      chat_id,
      question: question.trim(),
      answer: answer.trim(),
    });

    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    return createSuccessResponse(conversationData, "Pesan berhasil disimpan.");
  }

  /**
   * Update the title of an existing chat session.
   */
  async updateChatTitle(
    userId: string,
    chatId: string,
    title: string
  ): Promise<ChatResponse<ChatRow>> {
    const validation = updateChatTitleSchema.safeParse({ title });
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Judul percakapan tidak valid.";
      return createErrorResponse(firstError);
    }

    const { data: updatedChat, error } = await this.repo.updateChatTitle(
      userId,
      chatId,
      validation.data.title.trim()
    );

    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    return createSuccessResponse(updatedChat, "Judul percakapan berhasil diperbarui.");
  }

  /**
   * Delete a chat session.
   */
  async deleteChat(userId: string, chatId: string): Promise<ChatResponse<null>> {
    if (!chatId) {
      return createErrorResponse("ID percakapan tidak valid.");
    }

    const { error } = await this.repo.deleteChat(userId, chatId);
    if (error) {
      return createErrorResponse(mapSupabaseError(error.message));
    }

    return createSuccessResponse(null, "Percakapan berhasil dihapus.");
  }
}

/**
 * Factory function to instantiate ChatService with a Supabase client.
 */
export function createChatService(client: SupabaseClient<Database>) {
  const repository = createChatRepository(client);
  return new ChatService(repository);
}
