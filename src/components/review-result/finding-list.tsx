"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DisplayFinding } from "@/types/contract-review.type";
import { FindingDetailView } from "./finding-detail-view";
import { FindingListSkeleton } from "./finding-list-skeleton";
import { ReviewRiskSummaryBar } from "./review-risk-summary-bar";

export interface FindingListProps {
  isLoading?: boolean;
  isContract?: boolean;
  notContractReason?: string;
  totalAnalyzed?: number;
  detailed?: boolean;
  findings?: DisplayFinding[];
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
}

export function FindingList({
  isLoading = false,
  isContract = false,
  notContractReason,
  totalAnalyzed = 0,
  findings = [],
  activeFinding,
  onSelectFinding,
}: FindingListProps) {
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

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
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <h4 className="font-bold text-sm">Dokumen Bukan Kontrak</h4>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-amber-800">
            {notContractReason ||
              "Tidak dapat menganalisa format kontrak Anda, pastikan yang Anda kirim adalah sebuah kontrak."}
          </p>
        </div>
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
      <section className="p-4 space-y-4">
        <ReviewRiskSummaryBar isLoading={false} totalAnalyzed={totalAnalyzed} riskyCount={0} />
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
          <p className="text-xs font-semibold">Tidak ditemukan klausul berisiko pada dokumen ini.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="sticky top-0 z-20 bg-transparent backdrop-blur-md px-3 py-3">
        <ReviewRiskSummaryBar isLoading={false} totalAnalyzed={totalAnalyzed || riskCount} riskyCount={riskCount} />
      </div>
      <div className="divide-y divide-slate-100">
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
