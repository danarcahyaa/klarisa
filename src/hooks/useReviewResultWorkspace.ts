"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getReviewDetailAction } from "@/app/actions/review.action";
import { highlightRiskyClauses } from "@/lib/docx-highlighter";
import { isLimitationError } from "@/lib/utils";
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
  const [fileName, setFileName] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [findings, setFindings] = useState<DisplayFinding[]>([]);
  const [activeFinding, setActiveFinding] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isContract, setIsContract] = useState<boolean>(true);
  const [notContractReason, setNotContractReason] = useState<string>("");
  const [totalAnalyzed, setTotalAnalyzed] = useState<number>(0);
  const [reasoningError, setReasoningError] = useState<{
    hasError: boolean;
    errorType: "limitation" | "reasoning";
    errorMessage?: string;
  } | null>(null);

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

        const rawName =
          (typeof meta.source_file_name === "string" && meta.source_file_name) ||
          detail.title ||
          "Dokumen Kontrak";
        setFileName(rawName.replace(/\.docx$/i, ""));

        if ((detail as any).createdAt) {
          setCreatedAt((detail as any).createdAt);
        } else if ((detail as any).created_at) {
          setCreatedAt((detail as any).created_at);
        }

        let rawFindings: ChunkReasoningResult[] = [];
        let isDocContract = true;
        let notContractMsg = "";
        let totalAnalyzedCount = 0;
        let reasoningErr: {
          hasError: boolean;
          errorType: "limitation" | "reasoning";
          errorMessage?: string;
        } | null = null;

        if (detail.findings) {
          const findingsData = detail.findings;
          if (typeof findingsData === "object" && !Array.isArray(findingsData)) {
            const analysisObj = findingsData as ReasoningAnalysisResult;
            isDocContract = analysisObj.is_contract ?? true;
            notContractMsg = analysisObj.not_contract_reason ?? "";
            totalAnalyzedCount = analysisObj.total_analyzed_clauses ?? 0;
            rawFindings = analysisObj.findings ?? [];

            if (
              analysisObj.has_error ||
              (meta as any).has_error ||
              (meta as any).reasoning_error
            ) {
              const errMsg =
                analysisObj.error_message ||
                String(
                  (meta as any).reasoning_error ||
                    (meta as any).error_message ||
                    ""
                );
              const isLimitation =
                analysisObj.error_type === "limitation" ||
                isLimitationError(errMsg);

              reasoningErr = {
                hasError: true,
                errorType: isLimitation ? "limitation" : "reasoning",
                errorMessage: errMsg,
              };
            }
          } else if (Array.isArray(findingsData)) {
            rawFindings = findingsData as ChunkReasoningResult[];
            totalAnalyzedCount = rawFindings.length;
          }
        }

        if ((meta as any).reasoning_error) {
          const errMsg = String((meta as any).reasoning_error);
          reasoningErr = {
            hasError: true,
            errorType: isLimitationError(errMsg) ? "limitation" : "reasoning",
            errorMessage: errMsg,
          };
        }

        setIsContract(isDocContract);
        setNotContractReason(notContractMsg);
        setTotalAnalyzed(totalAnalyzedCount);
        setReasoningError(reasoningErr);

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

  const selectFromList = useCallback((findingId: string, shouldScroll = true) => {
    setActiveFinding(findingId);
    if (shouldScroll) {
      window.requestAnimationFrame(() => {
        const targetEl = document.querySelector(`[data-finding-source="${findingId}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
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
    reasoningError,
    selectFromList,
    handleBackToReview,
  };
}
