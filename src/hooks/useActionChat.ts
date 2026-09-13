"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteChatAction,
  getChatDetailAction,
  listConversationsAction,
  updateChatTitleAction,
} from "@/app/actions/chat.action";
import type {
  ChatMessageItem,
  UseActionChatOptions,
  UseActionChatReturn,
} from "@/types/draft.type";

export type { UseActionChatOptions, UseActionChatReturn };

/**
 * Custom React hook for managing chat actions and lifecycle:
 * retrieving chat details, renaming chat title, deleting chats, and resetting active session.
 */
export function useActionChat({
  initialChatId,
  setPrompt,
  messages,
  setMessages,
  chatId,
  setChatId,
  setFirstChatTitle,
  setInteractionId,
  setIsLoading,
  setError,
  setStreamingAiId,
}: UseActionChatOptions): UseActionChatReturn {
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(() => {
    if (initialChatId) return true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get("chat_id"));
    }
    return false;
  });
  const [hasMoreConversations, setHasMoreConversations] = useState<boolean>(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState<boolean>(false);
  const [conversationsPage, setConversationsPage] = useState<number>(1);
  const isFetchingConversationsRef = useRef<boolean>(false);

  /**
   * Reset active chat session and synchronize URL params.
   */
  const reset = useCallback(() => {
    setPrompt("");
    setMessages([]);
    setChatId(null);
    setInteractionId(null);
    setIsLoading(false);
    setIsLoadingChat(false);
    setError(null);
    setFirstChatTitle(null);
    setStreamingAiId(null);
    setHasMoreConversations(false);
    setIsLoadingMoreConversations(false);
    setConversationsPage(1);
    isFetchingConversationsRef.current = false;

    // Remove chat_id and id from URL on reset
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.has("chat_id")) {
        url.searchParams.delete("chat_id");
        changed = true;
      }
      if (changed) {
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, [setPrompt, setMessages, setChatId, setInteractionId, setIsLoading, setError, setFirstChatTitle, setStreamingAiId]);

  /**
   * Load detail chats along with their conversations from database.
   */
  const handleLoadChatDetail = useCallback(
    async (targetChatId?: string): Promise<boolean> => {
      let idToLoad = targetChatId;
      if (!idToLoad && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        idToLoad = params.get("chat_id") || undefined;
      }

      if (!idToLoad) {
        setIsLoadingChat(false);
        return false;
      }

      try {
        setIsLoadingChat(true);
        setError(null);
        setMessages([]);

        const res = await getChatDetailAction(idToLoad);
        if (!res.success || !res.data) {
          throw new Error(res.error ?? "Gagal memuat detail percakapan.");
        }

        const chatData = res.data;
        setChatId(chatData.id);

        if (chatData.title) {
          setFirstChatTitle(chatData.title);
        }
        if (chatData.last_interaction_id) {
          setInteractionId(chatData.last_interaction_id);
        }

        if (chatData.chat_conversations && chatData.chat_conversations.length > 0) {
          const loadedMessages: ChatMessageItem[] = [];
          for (const conv of chatData.chat_conversations) {
            loadedMessages.push({
              id: `q-${conv.id}`,
              role: "user",
              content: conv.question,
              date: conv.created_at,
            });
            loadedMessages.push({
              id: `a-${conv.id}`,
              role: "ai",
              content: conv.answer,
              date: conv.created_at,
            });
          }
          setMessages(loadedMessages);
          setConversationsPage(1);
          setHasMoreConversations(Boolean(chatData.hasMoreConversations));
        } else {
          setMessages([]);
          setConversationsPage(1);
          setHasMoreConversations(false);
        }

        // Sync URL query param to chat_id
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.get("chat_id") !== chatData.id) {
            url.searchParams.set("chat_id", chatData.id);
            window.history.replaceState(null, "", url.toString());
          }
        }

        return true;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat riwayat percakapan.";
        setError(msg);
        return false;
      } finally {
        setIsLoadingChat(false);
      }
    },
    [setChatId, setFirstChatTitle, setInteractionId, setMessages, setError]
  );

  /**
   * Load previous (older) page of conversation messages for lazy pagination when scrolling to top.
   */
  const handleLoadMoreConversations = useCallback(async (): Promise<boolean> => {
    if (!chatId || !hasMoreConversations || isLoadingMoreConversations || isFetchingConversationsRef.current) {
      return false;
    }

    try {
      isFetchingConversationsRef.current = true;
      setIsLoadingMoreConversations(true);

      const nextPage = conversationsPage + 1;
      const res = await listConversationsAction({
        chat_id: chatId,
        page: nextPage,
        limit: 15,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error ?? "Gagal memuat percakapan sebelumnya.");
      }

      const { conversations, hasMore } = res.data;
      if (conversations && conversations.length > 0) {
        const olderMessages: ChatMessageItem[] = [];
        for (const conv of conversations) {
          olderMessages.push({
            id: `q-${conv.id}`,
            role: "user",
            content: conv.question,
            date: conv.created_at,
          });
          olderMessages.push({
            id: `a-${conv.id}`,
            role: "ai",
            content: conv.answer,
            date: conv.created_at,
          });
        }

        // Prepend older messages chronologically at the top, avoiding duplicates
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlderMessages = olderMessages.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlderMessages, ...prev];
        });
        setConversationsPage(nextPage);
        setHasMoreConversations(hasMore);
        return true;
      } else {
        setHasMoreConversations(false);
        return false;
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memuat percakapan sebelumnya."
      );
      return false;
    } finally {
      setIsLoadingMoreConversations(false);
      isFetchingConversationsRef.current = false;
    }
  }, [chatId, hasMoreConversations, isLoadingMoreConversations, conversationsPage, setMessages]);

  /**
   * Rename an existing chat thread.
   */
  const handleRenameChat = useCallback(
    async (targetChatId: string, newTitle: string): Promise<boolean> => {
      try {
        const trimmed = newTitle.trim();
        if (!trimmed) {
          throw new Error("Nama percakapan tidak boleh kosong.");
        }

        const res = await updateChatTitleAction(targetChatId, trimmed);
        if (!res.success) {
          throw new Error(res.error ?? "Gagal mengubah nama percakapan.");
        }

        if (targetChatId === chatId) {
          setFirstChatTitle(trimmed);
        }
        toast.success("Nama percakapan berhasil diperbarui.");
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Terjadi kesalahan saat mengganti nama percakapan."
        );
        return false;
      }
    },
    [chatId, setFirstChatTitle]
  );

  /**
   * Delete an existing chat thread.
   */
  const handleDeleteChat = useCallback(
    async (targetChatId: string): Promise<boolean> => {
      try {
        const res = await deleteChatAction(targetChatId);
        if (!res.success) {
          throw new Error(res.error ?? "Gagal menghapus percakapan.");
        }

        if (targetChatId === chatId) {
          reset();
        }
        toast.success("Percakapan berhasil dihapus.");
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus percakapan."
        );
        return false;
      }
    },
    [chatId, reset]
  );

  // Automatically load chat detail on mount if chat_id or id is present in URL or initial options
  useEffect(() => {
    let targetId = initialChatId ?? null;
    if (!targetId && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      targetId = params.get("chat_id");
    }

    if (targetId && messages.length === 0) {
      handleLoadChatDetail(targetId);
    }
  }, [initialChatId, handleLoadChatDetail, messages.length]);

  return {
    isLoadingChat,
    hasMoreConversations,
    isLoadingMoreConversations,
    handleLoadChatDetail,
    handleLoadMoreConversations,
    handleRenameChat,
    handleDeleteChat,
    reset,
  };
}
