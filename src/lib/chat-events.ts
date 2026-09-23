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
  /** Fired when user navigates to create a new chat or resets chat session. */
  RESET: "klarisa:chat-reset",
  /** Fired when active chat title is set, changed, or cleared. */
  TITLE_CHANGE: "klarisa:chat-title-change",
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

/**
 * Dispatch a custom event when the user resets or starts a new contract drafting chat.
 */
export function dispatchChatReset(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAT_EVENTS.RESET));
}

export interface ChatTitleChangeEventDetail {
  title: string | null;
  chatId?: string;
}

/**
 * Dispatch a custom event when the active chat title changes or is loaded.
 */
export function dispatchChatTitleChange(title: string | null, chatId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ChatTitleChangeEventDetail>(CHAT_EVENTS.TITLE_CHANGE, {
      detail: { title, chatId },
    })
  );
}

