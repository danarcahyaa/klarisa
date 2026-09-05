"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getReviewDetailAction } from "@/app/actions/review.action";
import { highlightRiskyClauses } from "@/lib/docx-highlighter";
import type {
  ChunkReasoningResult,
  DisplayFinding,
  ReasoningAnalysisResult,
  UseReviewResultWorkspaceReturn,
} from "@/types/contract-review.type";

export type { UseReviewResultWorkspaceReturn };

/**
 * Custom hook to manage contract review result workspace state and detail fetching logic.
 *
 * @param reviewId - Optional contract review document ID.
 * @returns State properties and interactive handlers for review result UI.
 */
export function useReviewResultWorkspace(
  reviewId?: string
): UseReviewResultWorkspaceReturn {
  const router = useRouter();
  const [fileName, setFileName] = useState<string>("Dokumen Kontrak.docx");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [findings, setFindings] = useState<DisplayFinding[]>([]);
  const [activeFinding, setActiveFinding] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isContract, setIsContract] = useState<boolean>(true);
  const [notContractReason, setNotContractReason] = useState<string>("");
  const [totalAnalyzed, setTotalAnalyzed] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewDetail() {
      if (!reviewId) {
        if (isMounted) {
          setError("ID review dokumen tidak valid atau tidak ditemukan.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await getReviewDetailAction(reviewId);
        if (!isMounted) return;

        if (!response.success || !response.data) {
          setError(response.error ?? "Gagal memuat detail review dokumen.");
          return;
        }

        const detail = response.data;
        const meta = (detail.metadata as Record<string, unknown>) ?? {};

        if (meta.source_file_name && typeof meta.source_file_name === "string") {
          setFileName(meta.source_file_name);
        } else if (detail.title) {
          setFileName(`${detail.title}.docx`);
        }

        if ((detail as any).createdAt) {
          setCreatedAt((detail as any).createdAt);
        } else if ((detail as any).created_at) {
          setCreatedAt((detail as any).created_at);
        }

        let rawFindings: ChunkReasoningResult[] = [];
        let isDocContract = true;
        let notContractMsg = "";
        let totalAnalyzedCount = 0;

        if (detail.findings) {
          const findingsData = detail.findings;
          if (typeof findingsData === "object" && !Array.isArray(findingsData)) {
            const analysisObj = findingsData as ReasoningAnalysisResult;
            isDocContract = analysisObj.is_contract ?? true;
            notContractMsg = analysisObj.not_contract_reason ?? "";
            totalAnalyzedCount = analysisObj.total_analyzed_clauses ?? 0;
            rawFindings = analysisObj.findings ?? [];
          } else if (Array.isArray(findingsData)) {
            rawFindings = findingsData as ChunkReasoningResult[];
            totalAnalyzedCount = rawFindings.length;
          }
        }

        setIsContract(isDocContract);
        setNotContractReason(notContractMsg);
        setTotalAnalyzed(totalAnalyzedCount);

        if (detail.content && isDocContract && rawFindings.length > 0) {
          const { highlightedHtml: processedHtml, processedFindings } =
            highlightRiskyClauses(detail.content, rawFindings);
          setHighlightedHtml(processedHtml);
          setFindings(processedFindings);
        } else if (detail.content) {
          setHighlightedHtml(detail.content);
        }
      } catch (err) {
        console.error("Gagal memuat detail review dari database:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan tidak terduga saat memuat detail review."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReviewDetail();

    return () => {
      isMounted = false;
    };
  }, [reviewId]);

  const selectFromList = useCallback((findingId: string) => {
    setActiveFinding(findingId);
    window.requestAnimationFrame(() => {
      const targetEl = document.querySelector(`[data-finding-source="${findingId}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  const handleBackToReview = useCallback(() => {
    router.push("/dashboard/review");
  }, [router]);

  return {
    fileName,
    createdAt,
    highlightedHtml,
    findings,
    activeFinding,
    isLoading,
    error,
    isContract,
    notContractReason,
    totalAnalyzed,
    selectFromList,
    handleBackToReview,
  };
}
