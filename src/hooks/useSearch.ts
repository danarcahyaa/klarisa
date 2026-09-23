"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  searchContractsAction,
  togglePinContractAction,
  renameContractAction,
  deleteContractAction,
} from "@/app/actions/contract.action";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  ContractSearchFilterType,
  SearchItem,
} from "@/types/contract-search.type";

const BATCH_SIZE = 10;

/**
 * Sort search items so pinned items always appear at the top.
 */
function sortSearchResults(list: SearchItem[]): SearchItem[] {
  return [...list].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (
      new Date(b.createdAt ?? b.updatedAt).getTime() -
      new Date(a.createdAt ?? a.updatedAt).getTime()
    );
  });
}

export interface UseSearchOptions {
  /** Initial items passed from server component */
  initialItems?: ReadonlyArray<SearchItem>;
  /** Initial total count of items matching the query in the database */
  initialTotalCount?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ContractSearchFilterType>("Semua");
  const [items, setItems] = useState<SearchItem[]>(() =>
    sortSearchResults([...(options.initialItems ?? [])])
  );
  const [totalCount, setTotalCount] = useState<number>(
    options.initialTotalCount ?? options.initialItems?.length ?? 0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);
  const isLazyLoadingRef = useRef(false);

  // Synchronize state when initialItems or initialTotalCount props update from server
  useEffect(() => {
    if (options.initialItems) {
      setItems(sortSearchResults([...options.initialItems]));
      setTotalCount(options.initialTotalCount ?? options.initialItems.length);
    }
  }, [options.initialItems, options.initialTotalCount]);

  /**
   * Fetch matching contracts from database using searchContractsAction.
   */
  const fetchSearchResults = useCallback(
    async (searchQuery: string, categoryFilter: ContractSearchFilterType) => {
      setIsLoading(true);
      setError(null);

      const response = await searchContractsAction({
        query: searchQuery,
        filter: categoryFilter,
        limit: BATCH_SIZE,
        offset: 0,
      });

      setIsLoading(false);

      if (response.success && response.data) {
        setItems(sortSearchResults(response.data.items));
        setTotalCount(response.data.totalCount);
      } else {
        setError(response.error ?? "Gagal memuat dokumen.");
      }
    },
    []
  );

  // Trigger database search whenever debouncedQuery or filter changes (skipped on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchSearchResults(debouncedQuery, filter);
  }, [debouncedQuery, filter, fetchSearchResults]);

  const visibleItems = items;
  const visibleCount = items.length;
  const hasMore = items.length < totalCount;

  /**
   * Trigger loading the next batch of items from database
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLazyLoadingRef.current || isLoading) {
      return;
    }

    isLazyLoadingRef.current = true;
    setIsLazyLoading(true);

    try {
      const response = await searchContractsAction({
        query: debouncedQuery,
        filter,
        limit: BATCH_SIZE,
        offset: items.length,
      });

      if (response.success && response.data) {
        const nextBatch = response.data.items;
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const uniqueNew = nextBatch.filter((i) => !existingIds.has(i.id));
          return sortSearchResults([...prev, ...uniqueNew]);
        });
        setTotalCount(response.data.totalCount);
      } else if (!response.success && response.error) {
        setError(response.error);
      }
    } finally {
      setIsLazyLoading(false);
      isLazyLoadingRef.current = false;
    }
  }, [hasMore, isLoading, debouncedQuery, filter, items.length]);

  // IntersectionObserver for lazy loading pagination
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLazyLoadingRef.current && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: "150px",
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, isLoading]);

  /**
   * Action handler: Pin or unpin item (Optimistic update with revert & toast error on failure)
   */
  const handlePin = useCallback(
    async (item: SearchItem) => {
      const nextPinnedState = !item.isPinned;

      // Optimistic state update with sorting to move pinned item to the top
      setItems((prev) =>
        sortSearchResults(
          prev.map((i) =>
            i.id === item.id ? { ...i, isPinned: nextPinnedState } : i
          )
        )
      );

      const response = await togglePinContractAction(item.id, nextPinnedState);

      if (!response.success) {
        // Revert optimistic update
        setItems((prev) =>
          sortSearchResults(
            prev.map((i) =>
              i.id === item.id ? { ...i, isPinned: item.isPinned } : i
            )
          )
        );

        let errorMsg = response.error ?? "Terjadi kesalahan";
        if (
          errorMsg.includes("500") ||
          errorMsg.toLowerCase().includes("internal") ||
          errorMsg.toLowerCase().includes("server error")
        ) {
          errorMsg = "Terjadi kesalahan";
        }
        toast.error(errorMsg);
      }
      // Success: No toast displayed per user specification
    },
    []
  );

  /**
   * Action handler: Rename document title
   */
  const handleRename = useCallback(
    async (item: SearchItem, newTitle: string): Promise<boolean> => {
      const sanitizedTitle = newTitle.trim();
      if (!sanitizedTitle) {
        toast.error("Nama kontrak tidak boleh kosong.");
        return false;
      }

      const response = await renameContractAction(item.id, sanitizedTitle);

      if (response.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, title: sanitizedTitle } : i
          )
        );
        toast.success("Nama kontrak berhasil diganti.");
        return true;
      } else {
        toast.error(response.error ?? "Gagal memperbarui judul dokumen.");
        return false;
      }
    },
    []
  );

  /**
   * Action handler: Delete document item
   */
  const handleDelete = useCallback(
    async (item: SearchItem) => {
      const response = await deleteContractAction(item.id);

      if (response.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        toast.success("Kontrak berhasil dihapus.");
      } else {
        toast.error(response.error ?? "Gagal menghapus kontrak.");
      }
    },
    []
  );

  return {
    query,
    setQuery,
    filter,
    setFilter,
    items,
    visibleItems,
    totalCount,
    visibleCount,
    hasMore,
    isLoading,
    isLazyLoading,
    error,
    observerTargetRef,
    loadMore,
    handlePin,
    handleRename,
    handleDelete,
  };
}
