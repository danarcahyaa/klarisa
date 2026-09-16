import type { ChatRow } from "@/types/chat.type";

/**
 * Custom event identifiers for cross-component chat synchronization.
 */
export const CHAT_EVENTS = {
  CREATED: "klarisa:chat-created",
  UPDATED: "klarisa:chat-updated",
  DELETED: "klarisa:chat-deleted",
  /** Fired when the user selects a chat from the sidebar to open its detail. */
  SELECT: "klarisa:chat-select",
} as const;

export interface ChatCreatedEventDetail {
  chat: ChatRow;
}

export interface ChatUpdatedEventDetail {
  chatId: string;
  title: string;
}

export interface ChatDeletedEventDetail {
  chatId: string;
}

export interface ChatSelectEventDetail {
  chatId: string;
}

/**
 * Dispatch a custom event when a new chat session has been created and saved in the database.
 *
 * @param chat The newly created ChatRow model.
 */
export function dispatchChatCreated(chat: ChatRow): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ChatCreatedEventDetail>(CHAT_EVENTS.CREATED, {
      detail: { chat },
    })
  );
}

/**
 * Dispatch a custom event when a chat title has been renamed.
 *
 * @param chatId The identifier of the updated chat thread.
 * @param title The new title text.
 */
export function dispatchChatUpdated(chatId: string, title: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ChatUpdatedEventDetail>(CHAT_EVENTS.UPDATED, {
      detail: { chatId, title },
    })
  );
}

/**
 * Dispatch a custom event when a chat thread has been deleted.
 *
 * @param chatId The identifier of the deleted chat thread.
 */
export function dispatchChatDeleted(chatId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ChatDeletedEventDetail>(CHAT_EVENTS.DELETED, {
      detail: { chatId },
    })
  );
}

/**
 * Dispatch a custom event when the user selects a chat from the sidebar to open its detail.
 * Listened by ChatAI to load the selected chat without a full page navigation.
 *
 * @param chatId The identifier of the chat to open.
 */
export function dispatchChatSelect(chatId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ChatSelectEventDetail>(CHAT_EVENTS.SELECT, {
      detail: { chatId },
    })
  );
}
