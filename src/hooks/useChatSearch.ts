"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchUserChatsAction } from "@/app/actions/chat.action";
import type { ChatRow } from "@/types/chat.type";

export interface UseChatSearchOptions {
  /**
   * Whether fetching is active (useful to pause when modal dialog is closed).
   * Defaults to true.
   */
  enabled?: boolean;
  /**
   * Number of items to retrieve per page.
   * Defaults to 15.
   */
  limit?: number;
  /**
   * Debounce delay in milliseconds for search input.
   * Defaults to 300.
   */
  debounceDelay?: number;
  /**
   * Optional initial list of chats.
   */
  initialChats?: ChatRow[];
}

export interface UseChatSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  chats: ChatRow[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * Custom React hook for managing user chat list with debounced search and lazy pagination.
 * Supports both browsing default chats with infinite scroll and searching with debounced query.
 */
export function useChatSearch({
  enabled = true,
  limit = 15,
  debounceDelay = 300,
  initialChats = [],
}: UseChatSearchOptions = {}): UseChatSearchReturn {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, debounceDelay);

  const [chats, setChats] = useState<ChatRow[]>(initialChats);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(initialChats.length);
  const [hasMore, setHasMore] = useState<boolean>(initialChats.length >= limit);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  /**
   * Fetch chats from server for a specific page.
   */
  const fetchChats = useCallback(
    async (targetPage: number, searchQuery: string, isAppend = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await searchUserChatsAction({
          query: searchQuery.trim() || undefined,
          page: targetPage,
          limit,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error ?? "Gagal memuat percakapan.");
        }

        const newChats = response.data.chats;
        setChats((prev) => {
          if (!isAppend) return newChats;
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNewChats = newChats.filter((c) => !existingIds.has(c.id));
          return [...prev, ...uniqueNewChats];
        });
        setTotal(response.data.total);
        setPage(response.data.page);
        setHasMore(response.data.hasMore);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan saat memuat percakapan."
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [limit]
  );

  /**
   * Trigger reload for first page when debouncedQuery or enabled changes.
   */
  useEffect(() => {
    if (!enabled) return;

    fetchChats(1, debouncedQuery, false);
  }, [enabled, debouncedQuery, fetchChats]);

  /**
   * Load next page for lazy pagination (works both with and without search query).
   */
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || isLoadingMore || !hasMore || isFetchingRef.current) {
      return;
    }

    await fetchChats(page + 1, debouncedQuery, true);
  }, [enabled, isLoading, isLoadingMore, hasMore, page, debouncedQuery, fetchChats]);

  /**
   * Manually reload from the first page.
   */
  const refresh = useCallback(async () => {
    if (!enabled || isFetchingRef.current) return;
    await fetchChats(1, debouncedQuery, false);
  }, [enabled, debouncedQuery, fetchChats]);

  /**
   * Handle scroll event on scrollable container to trigger lazy loading.
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 60) {
        if (hasMore && !isLoading && !isLoadingMore && !isFetchingRef.current) {
          loadMore();
        }
      }
    },
    [hasMore, isLoading, isLoadingMore, loadMore]
  );

  /**
   * IntersectionObserver attached to sentinel element to trigger lazy loading automatically.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !hasMore || isLoading || isLoadingMore || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          loadMore();
        }
      },
      {
        root: container || null,
        rootMargin: "80px",
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, enabled, loadMore]);

  return {
    query,
    setQuery,
    debouncedQuery,
    chats,
    total,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    sentinelRef,
    containerRef,
    handleScroll,
  };
}
