"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContractDetail, ContractResponse, SaveDraftDTO } from "@/types/contract.type";

export function useContract(contractId?: string | null) {
  const [data, setData] = useState<ContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(contractId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contractId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, { cache: "no-store" });
      const result = await response.json() as ContractResponse<ContractDetail>;
      if (!response.ok || !result.success) throw new Error(result.error ?? "Dokumen gagal dimuat.");
      setData(result.data ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dokumen gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => { if (contractId) queueMicrotask(() => void load()); }, [contractId, load]);

  const saveDraft = useCallback(async (input: SaveDraftDTO) => {
    if (!data) return false;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${data.id}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await response.json() as ContractResponse<{ version: number }>;
      if (!response.ok || !result.success) throw new Error(result.error ?? "Draft gagal disimpan.");
      setData((current) => current ? { ...current, title: input.title, content: input.content } : current);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft gagal disimpan.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  const dismissError = useCallback(() => setError(null), []);
  return { data, isLoading, isSaving, error, reload: load, saveDraft, dismissError };
}
