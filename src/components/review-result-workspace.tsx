"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MessageCircle } from "lucide-react";

import { getReviewDetailAction } from "@/app/actions/review.action";
import {
  ContractDocument,
  DiscussionPanel,
  DocumentHeader,
  FindingList,
  type DisplayFinding,
} from "@/components/contract-review-components";
import { Button } from "@/components/ui/button";
import { highlightRiskyClauses } from "@/lib/docx-highlighter";
import type { ChunkReasoningResult, ReasoningAnalysisResult } from "@/types/contract-review.type";

interface ReviewResultWorkspaceProps {
  reviewId?: string;
}

export function ReviewResultWorkspace({ reviewId }: ReviewResultWorkspaceProps) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string>("Dokumen Kontrak.docx");
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [findings, setFindings] = useState<DisplayFinding[]>([]);
  const [activeFinding, setActiveFinding] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");
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
            err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga saat memuat detail review."
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

  const selectFromList = (findingId: string) => {
    setActiveFinding(findingId);
    window.requestAnimationFrame(() => {
      const targetEl = document.querySelector(`[data-finding-source="${findingId}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  };

  if (error) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-6 shadow-sm text-center">
          <AlertTriangle className="mx-auto size-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Detail Review</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button className="mt-5 cursor-pointer" onClick={() => router.push("/dashboard/review")}>
            Kembali ke Review Kontrak
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-white">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1fr_480px]">
        <div className="flex flex-col h-svh max-h-svh border-b border-slate-200 lg:border-r lg:border-b-0 bg-white overflow-hidden">
          <DocumentHeader fileName={fileName} />
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {isLoading ? (
              <div className="flex h-full items-center justify-center p-8 text-slate-500 font-medium">
                Memuat dokumen review...
              </div>
            ) : (
              <ContractDocument
                htmlContent={highlightedHtml}
                activeFinding={activeFinding}
                onSelectFinding={selectFromList}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col h-svh max-h-svh bg-slate-50 overflow-hidden">
          <div className="flex h-14 min-h-14 shrink-0 items-center justify-center border-b border-slate-200 bg-white px-3 gap-2">
            <Button
              variant={activeTab === "analysis" ? "secondary" : "ghost"}
              type="button"
              onClick={() => setActiveTab("analysis")}
              className="flex-1 cursor-pointer items-center justify-center gap-1.5 font-semibold"
            >
              <span>✦</span> Hasil Analisis
            </Button>
            <Button
              variant={activeTab === "chat" ? "secondary" : "ghost"}
              type="button"
              onClick={() => setActiveTab("chat")}
              className="flex-1 cursor-pointer items-center justify-center gap-1.5 font-semibold"
            >
              <MessageCircle className="size-3" /> Chat & Diskusi
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {isLoading ? (
              <div className="flex h-full items-center justify-center p-8 text-slate-500 font-medium">
                Memuat hasil analisis...
              </div>
            ) : activeTab === "analysis" ? (
              <FindingList
                isContract={isContract}
                notContractReason={notContractReason}
                totalAnalyzed={totalAnalyzed}
                findings={findings}
                activeFinding={activeFinding}
                onSelectFinding={selectFromList}
              />
            ) : (
              <DiscussionPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
