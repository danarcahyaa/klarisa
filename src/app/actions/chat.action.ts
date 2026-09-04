"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/response";
import { createChatService } from "@/services/chat.service";
import type { AddConversationDTO, CreateChatDTO, CreateChatWithQuestionDTO } from "@/types/chat.type";

/**
 * Server action to create a new chat session.
 * If title is omitted, uses the first question as the title.
 */
export async function createChatAction(input: CreateChatDTO) {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  const result = await chatService.createChat(user.id, input);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/review");
  }

  return result;
}

/**
 * Server action to create a new chat session with its initial question & answer pair.
 * Uses the user's first input question as the chat title automatically.
 */
export async function createChatWithQuestionAction(input: CreateChatWithQuestionDTO) {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  const result = await chatService.createChatWithQuestion(user.id, input);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/review");
  }

  return result;
}

/**
 * Server action to fetch all chat sessions belonging to the current user.
 */
export async function getUserChatsAction() {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  return chatService.getUserChats(user.id);
}

/**
 * Server action to fetch detail of a specific chat session with its messages.
 */
export async function getChatDetailAction(chatId: string) {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  return chatService.getChatDetail(user.id, chatId);
}

/**
 * Server action to add a Q&A conversation entry to a chat thread.
 */
export async function addConversationAction(input: AddConversationDTO) {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  const result = await chatService.addConversation(user.id, input);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/review");
  }

  return result;
}

/**
 * Server action to update a chat thread's title.
 */
export async function updateChatTitleAction(chatId: string, title: string) {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  const result = await chatService.updateChatTitle(user.id, chatId, title);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/review");
  }

  return result;
}

/**
 * Server action to delete a chat thread.
 */
export async function deleteChatAction(chatId: string) {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const chatService = createChatService(createAdminClient());
  const result = await chatService.deleteChat(user.id, chatId);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/review");
  }

  return result;
}
