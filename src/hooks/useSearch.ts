"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createContractRepository } from "@/repositories/contract.repository";
import { createContractService } from "@/services/contract.service";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  ContractSearchFilterType,
  SearchItem,
} from "@/types/contract-search.type";

const BATCH_SIZE = 5;

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
}

export function useSearch(options: UseSearchOptions = {}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ContractSearchFilterType>("Semua");
  const [items, setItems] = useState<SearchItem[]>(() =>
    sortSearchResults([...(options.initialItems ?? [])])
  );
  const [totalCount, setTotalCount] = useState<number>(
    options.initialItems?.length ?? 0
  );
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Instantiate client Supabase repository and service instances
  const service = useMemo(() => {
    const supabase = createClient();
    const repository = createContractRepository(supabase);
    return createContractService(repository);
  }, []);

  /**
   * Fetch matching contracts from database using ContractService.
   */
  const fetchSearchResults = useCallback(
    async (searchQuery: string, categoryFilter: ContractSearchFilterType) => {
      setIsLoading(true);
      setError(null);

      const response = await service.searchContracts({
        query: searchQuery,
        filter: categoryFilter,
        limit: 50, // Fetch up to 50 items for pagination view
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
    [service]
  );

  // Trigger database search whenever debouncedQuery or filter changes
  useEffect(() => {
    fetchSearchResults(debouncedQuery, filter);
    setVisibleCount(BATCH_SIZE);
  }, [debouncedQuery, filter, fetchSearchResults]);

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = visibleCount < items.length;

  // IntersectionObserver for lazy loading pagination
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

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

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? "";

      const response = await service.togglePin(userId, item.id, nextPinnedState);

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
    [service]
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

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? "";

      const response = await service.renameContract(
        userId,
        item.id,
        sanitizedTitle
      );

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
    [service]
  );

  /**
   * Action handler: Delete document item
   */
  const handleDelete = useCallback(
    async (item: SearchItem) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? "";

      const response = await service.deleteContract(userId, item.id);

      if (response.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        toast.success("Dokumen berhasil dihapus.");
      } else {
        toast.error(response.error ?? "Gagal menghapus dokumen.");
      }
    },
    [service]
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
    error,
    observerTargetRef,
    handlePin,
    handleRename,
    handleDelete,
  };
}
