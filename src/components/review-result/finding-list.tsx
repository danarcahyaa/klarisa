"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Scale } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DisplayFinding } from "@/types/contract-review.type";
import { FindingDetailView } from "./finding-detail-view";
import { FindingListSkeleton } from "./finding-list-skeleton";
import { ReviewRiskSummaryBar } from "./review-risk-summary-bar";
import { ReusableAlert } from "@/components/ui/reusable-alert";
import { ReviewAlert } from "./review-alert";
import Link from "next/link";

export interface FindingListProps {
  isLoading?: boolean;
  isContract?: boolean;
  notContractReason?: string;
  totalAnalyzed?: number;
  detailed?: boolean;
  findings?: DisplayFinding[];
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
  reasoningError?: {
    hasError: boolean;
    errorType: "limitation" | "reasoning";
    errorMessage?: string;
  } | null;
}

export function FindingList({
  isLoading = false,
  isContract = false,
  notContractReason,
  totalAnalyzed = 0,
  findings = [],
  activeFinding,
  onSelectFinding,
  reasoningError,
}: FindingListProps) {
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (activeFinding) {
      setSelectedDetailId(activeFinding);
    }
  }, [activeFinding]);

  if (isLoading) {
    return <FindingListSkeleton />;
  }

  if (!isContract) {
    return (
      <section className="bg-white p-6">
        <ReusableAlert
          variant="warning"
          title="Terjadi Kesalahan"
          description={
            notContractReason ||
            "Tidak dapat menganalisa format kontrak Anda, pastikan yang Anda kirim adalah sebuah kontrak."
          }
        />
      </section>
    );
  }

  const currentId = selectedDetailId || activeFinding;
  const selectedIndex = findings.findIndex((f) => f.findingId === currentId);
  const findingIndex = selectedIndex >= 0 ? selectedIndex + 1 : 1;

  const riskCount = findings.length;

  const selectedFinding = findings.find(
    (f) => f.findingId === (selectedDetailId || activeFinding)
  );

  const handleBack = () => {
    setSelectedDetailId(null);
    onSelectFinding?.("");
  };

  if (selectedDetailId && selectedFinding) {
    return (
      <FindingDetailView
        finding={selectedFinding}
        findingIndex={findingIndex}
        totalFindings={riskCount}
        totalAnalyzed={totalAnalyzed}
        onBack={handleBack}
        onSelectFinding={onSelectFinding}
      />
    );
  }

  if (findings.length === 0) {
    return (
      <section className="p-4 space-y-4 h-[75vh]">
        <ReviewRiskSummaryBar isLoading={false} totalAnalyzed={totalAnalyzed} riskyCount={0} />
        <div className="bg-white p-6 space-y-2 rounded-lg  border border-slate-200 text-center h-[78vh] flex flex-col justify-center ">
          <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-800 to-teal-600 ring-10 ring-emerald-100">
            <Scale className="size-7 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-bold text-klarisa-navy">
              Klausul Berisiko Tidak Ditemukan 
            </h4>
            <p className="text-xs text-slate-500">
              Hasil review tidak menemukan klausul berisiko pada dokumen kontrak yang Anda berikan.
            </p>
          </div>
          <Link href="#" className="text-xs text-klarisa-secondary underline">Pelajari lebih lanjut.</Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="sticky top-0 z-20 px-3 pt-3 pb-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -bottom-6 progressive-blur-fade"
        />
        <div className="relative z-10">
          <ReviewRiskSummaryBar isLoading={false} totalAnalyzed={totalAnalyzed || riskCount} riskyCount={riskCount} />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {!isAlertDismissed && (
          <ReviewAlert
            reasoningError={reasoningError}
            riskCount={riskCount}
            onDismiss={() => setIsAlertDismissed(true)}
          />
        )}
        {findings.map((item, idx) => {
          const active = item.findingId === (selectedDetailId || activeFinding);
          return (
            <button
              key={item.findingId}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onSelectFinding?.(item.findingId);
                setSelectedDetailId(item.findingId);
              }}
              className={cn(
                "flex w-full items-center border-b border-slate-200 border-l-2 border-l-transparent justify-between gap-3 p-4 text-left transition-colors cursor-pointer hover:bg-white",
                active && "border-l-klarisa-secondary bg-slate-50 font-medium"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xs font-bold text-klarisa-secondary shrink-0">#{idx + 1}</span>
                <p className="text-xs leading-relaxed text-slate-800 line-clamp-3">
                  {item.clause_text || `Temuan Risiko #${idx + 1}`}
                </p>
              </div>
              <ArrowRight className={cn("size-4 shrink-0 text-slate-400 transition-colors", active && "text-klarisa-secondary")} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
