"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteChatAction,
  getChatDetailAction,
  listConversationsAction,
  updateChatTitleAction,
} from "@/app/actions/chat.action";
import {
  dispatchChatUpdated,
  dispatchChatDeleted,
  dispatchChatReset,
  CHAT_EVENTS,
  type ChatDeletedEventDetail,
} from "@/lib/chat-events";
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
  const router = useRouter();
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(() => {
    if (initialChatId !== undefined) return Boolean(initialChatId);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get("chat_id") || params.get("id"));
    }
    return false;
  });
  const [hasMoreConversations, setHasMoreConversations] = useState<boolean>(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState<boolean>(false);
  const [conversationsPage, setConversationsPage] = useState<number>(1);
  const isFetchingConversationsRef = useRef<boolean>(false);
  const loadingChatIdRef = useRef<string | null>(null);

  /**
   * Reset active chat session and synchronize URL params.
   */
  const reset = useCallback(() => {
    loadingChatIdRef.current = null;
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

    // Clean URL query parameters (chat_id and id) on reset using Next.js router
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("chat_id") || url.searchParams.has("id")) {
        router.replace("/dashboard/create");
      }
    }
  }, [router, setPrompt, setMessages, setChatId, setInteractionId, setIsLoading, setError, setFirstChatTitle, setStreamingAiId]);

  /**
   * Load detail chats along with their conversations from database.
   */
  const handleLoadChatDetail = useCallback(
    async (targetChatId?: string): Promise<boolean> => {
      let idToLoad = targetChatId;
      if (!idToLoad && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        // Normalize: if legacy ?id= is found, convert to chat_id
        if (params.has("id")) {
          const legacyId = params.get("id");
          params.delete("id");
          if (legacyId && !params.has("chat_id")) {
            params.set("chat_id", legacyId);
          }
          const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
          window.history.replaceState(null, "", cleanUrl);
        }
        idToLoad = params.get("chat_id") || undefined;
      }

      if (!idToLoad) {
        setIsLoadingChat(false);
        return false;
      }

      loadingChatIdRef.current = idToLoad;

      try {
        setIsLoadingChat(true);
        setError(null);
        setMessages([]);

        const res = await getChatDetailAction(idToLoad);
        // If another chat load was requested while this network request was in-flight, discard stale result
        if (loadingChatIdRef.current !== idToLoad) {
          return false;
        }

        if (!res.success || !res.data) {
          // If chat id is invalid, ngawur, deleted, or unauthorized -> redirect to /dashboard/create
          reset();
          router.replace("/dashboard/create");
          toast.error("Percakapan tidak ditemukan.");
          return false;
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
            const convMeta = conv.metadata as Record<string, unknown> | null;
            loadedMessages.push({
              id: `a-${conv.id}`,
              role: "ai",
              content: conv.answer,
              date: conv.created_at,
              statusSteps: (convMeta?.statusSteps as any) ?? undefined,
              metadata: convMeta ?? null,
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

        // Sync URL query param to chat_id and clean legacy id param
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          let changed = false;
          if (url.searchParams.get("chat_id") !== chatData.id) {
            url.searchParams.set("chat_id", chatData.id);
            changed = true;
          }
          if (url.searchParams.has("id")) {
            url.searchParams.delete("id");
            changed = true;
          }
          if (changed) {
            window.history.replaceState(null, "", url.toString());
          }
        }

        return true;
      } catch (err) {
        if (loadingChatIdRef.current === idToLoad) {
          // If error loading or chat id is wrong/invalid, redirect to /dashboard/create
          reset();
          router.replace("/dashboard/create");
          toast.error("Percakapan tidak ditemukan.");
        }
        return false;
      } finally {
        if (loadingChatIdRef.current === idToLoad) {
          setIsLoadingChat(false);
        }
      }
    },
    [router, reset, setChatId, setFirstChatTitle, setInteractionId, setMessages, setError]
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
          const convMeta = conv.metadata as Record<string, unknown> | null;
          olderMessages.push({
            id: `a-${conv.id}`,
            role: "ai",
            content: conv.answer,
            date: conv.created_at,
            statusSteps: (convMeta?.statusSteps as any) ?? undefined,
            metadata: convMeta ?? null,
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
        dispatchChatUpdated(targetChatId, trimmed);
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

        dispatchChatDeleted(targetChatId);
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

  // Automatically load chat detail on mount or when initialChatId changes.
  // The else-if reset branch is intentionally removed: cleanup when URL clears is
  // handled directly in handleChatReset (chat-ai.tsx) which calls reset() directly,
  // avoiding spurious resets when a new chat is created in empty create mode.
  useEffect(() => {
    const targetId = initialChatId ?? null;

    if (targetId && targetId !== chatId && loadingChatIdRef.current !== targetId) {
      void handleLoadChatDetail(targetId);
    }
  }, [initialChatId, chatId, handleLoadChatDetail]);

  // Synchronize on browser history navigation (back/forward popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("chat_id") || params.get("id");
      if (targetId && targetId !== chatId) {
        void handleLoadChatDetail(targetId);
      } else if (!targetId && chatId) {
        reset();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [chatId, handleLoadChatDetail, reset]);

  // Listen for chat deletion events dispatched by the sidebar or other components.
  // If the deleted chat is the currently active one, reset the ChatAI state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleChatDeleted = (event: Event) => {
      const { chatId: deletedChatId } = (event as CustomEvent<ChatDeletedEventDetail>).detail;
      if (deletedChatId && deletedChatId === chatId) {
        dispatchChatReset();
      }
    };
    window.addEventListener(CHAT_EVENTS.DELETED, handleChatDeleted);
    return () => {
      window.removeEventListener(CHAT_EVENTS.DELETED, handleChatDeleted);
    };
  }, [chatId, reset]);

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
