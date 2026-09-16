"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createChatAction,
  deleteChatAction,
  updateChatTitleAction,
} from "@/app/actions/chat.action";
import { useChatSearch, type UseChatSearchOptions } from "@/hooks/useChatSearch";
import {
  dispatchChatCreated,
  dispatchChatUpdated,
  dispatchChatDeleted,
} from "@/lib/chat-events";
import type { CreateChatDTO } from "@/types/chat.type";

/**
 * Custom React hook for managing chat threads, search, pagination, and mutations.
 */
export function useChat(searchOptions?: UseChatSearchOptions) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const search = useChatSearch(searchOptions);

  /**
   * Create a new chat session and optionally redirect.
   */
  const handleCreateChat = useCallback(
    async (dto: CreateChatDTO, redirectToChat = true) => {
      try {
        setIsSubmitting(true);
        setActionError(null);

        const res = await createChatAction(dto);
        if (!res.success || !res.data) {
          throw new Error(res.error || "Gagal membuat percakapan.");
        }

        toast.success("Percakapan berhasil dibuat.");
        dispatchChatCreated(res.data);
        await search.refresh();
        if (redirectToChat) {
          router.push(`/dashboard/create?chat_id=${res.data.id}`);
        }
        return res.data;
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
        setActionError(errMsg);
        toast.error(errMsg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, search]
  );

  /**
   * Rename an existing chat thread.
   */
  const handleRenameChat = useCallback(
    async (chatId: string, newTitle: string) => {
      try {
        setIsSubmitting(true);
        setActionError(null);

        const res = await updateChatTitleAction(chatId, newTitle);
        if (!res.success) {
          throw new Error(res.error || "Gagal mengubah judul percakapan.");
        }

        toast.success("Judul percakapan berhasil diubah.");
        dispatchChatUpdated(chatId, newTitle);
        await search.refresh();
        return true;
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
        setActionError(errMsg);
        toast.error(errMsg);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [search]
  );

  /**
   * Delete an existing chat thread.
   */
  const handleDeleteChat = useCallback(
    async (chatId: string, currentChatId?: string) => {
      try {
        setIsSubmitting(true);
        setActionError(null);

        const res = await deleteChatAction(chatId);
        if (!res.success) {
          throw new Error(res.error || "Gagal menghapus percakapan.");
        }

        toast.success("Percakapan berhasil dihapus.");
        dispatchChatDeleted(chatId);
        await search.refresh();
        return true;
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
        setActionError(errMsg);
        toast.error(errMsg);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, search]
  );

  return {
    ...search,
    // Explicit aliases for list chats lazy pagination
    loadMoreChats: search.loadMore,
    hasMoreChats: search.hasMore,
    isLoadingMoreChats: search.isLoadingMore,
    isSubmitting,
    actionError,
    handleCreateChat,
    handleRenameChat,
    handleDeleteChat,
  };
}

export { useChatSearch };
