"use client";

import { AlertTriangle } from "lucide-react";

import {
  ContractDocument,
  DocumentHeader,
  FindingList,
} from "@/components/review-result";
import { Button } from "@/components/ui/button";
import { useReviewResultWorkspace } from "@/hooks/useReviewResultWorkspace";
import { Skeleton } from "./ui/skeleton";

interface ReviewResultWorkspaceProps {
  reviewId?: string;
}

export function ReviewResultWorkspace({ reviewId }: ReviewResultWorkspaceProps) {
  const {
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
  } = useReviewResultWorkspace(reviewId);

  if (error) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-6 shadow-sm text-center">
          <AlertTriangle className="mx-auto size-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Detail Review</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button className="mt-5 cursor-pointer" onClick={handleBackToReview}>
            Kembali ke Review Kontrak
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh bg-white">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1fr_480px]">
        <div className="flex flex-col h-svh max-h-svh border-b border-slate-200 lg:border-r lg:border-b-0 bg-white overflow-hidden">
          <DocumentHeader fileName={fileName} createdAt={createdAt} isLoading={isLoading} />
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {isLoading ? (
              <div className="flex flex-col gap-2 px-10 py-15">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
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
        <div className="flex flex-col h-svh max-h-svh bg-slate-50 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FindingList
            isLoading={isLoading}
            isContract={isContract}
            notContractReason={notContractReason}
            totalAnalyzed={totalAnalyzed}
            findings={findings}
            activeFinding={activeFinding}
            onSelectFinding={selectFromList}
          />
        </div>
      </div>
    </div>
  );
}
