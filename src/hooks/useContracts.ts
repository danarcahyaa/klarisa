"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContractListItem, ContractQuery, ContractResponse } from "@/types/contract.type";

export function useContracts(query: ContractQuery = {}) {
  const [data, setData] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryValue = query.query ?? "";
  const typeValue = query.type ?? "";
  const sharedValue = query.shared === true;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (queryValue) params.set("query", queryValue);
      if (typeValue) params.set("type", typeValue);
      if (sharedValue) params.set("shared", "true");
      const response = await fetch(`/api/contracts?${params}`, { cache: "no-store" });
      const result = await response.json() as ContractResponse<ContractListItem[]>;
      if (!response.ok || !result.success) throw new Error(result.error ?? "Dokumen gagal dimuat.");
      setData(result.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dokumen gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, [queryValue, sharedValue, typeValue]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  return { data, isLoading, error, reload: load };
}
