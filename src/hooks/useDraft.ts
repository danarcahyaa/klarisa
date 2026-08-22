"use client";

import { useCallback, useState } from "react";

import { saveDraftAction } from "@/app/actions/draft.action";
import type { ContractDetail, SaveDraftDTO } from "@/types/contract.type";

export function useDraft(initialDraft: ContractDetail) {
  const [data, setData] = useState(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDraft = useCallback(async (input: SaveDraftDTO) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveDraftAction(data.id, input);
      if (!result.success) throw new Error(result.error ?? "Draft gagal disimpan.");
      setData((current) => ({ ...current, title: input.title, content: input.content, metadata: { ...current.metadata, version: result.data?.version ?? current.metadata.version } }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft gagal disimpan.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data.id]);

  const dismissError = useCallback(() => setError(null), []);
  return { data, isSaving, error, saveDraft, dismissError };
}
