"use client";

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import type { DisplayFinding } from "@/types/contract-review.type";
import { FindingAnalysisCard } from "./analysis-result-card";
import { FindingLegalReferencesCard, type GroupedLegalRef } from "./legal-references-card";
import { FindingRevisionRecommendationCard } from "./revision-recommendation-card";
import { LegalReferenceDetailSheet } from "./legal-reference-detail-sheet";
import { ReviewRiskSummaryBar } from "./review-risk-summary-bar";

interface FindingDetailViewProps {
  finding: DisplayFinding;
  findingIndex?: number;
  totalFindings?: number;
  totalAnalyzed?: number;
  onBack: () => void;
  onSelectFinding?: (findingId: string) => void;
}

/**
 * Detailed view component for inspecting a selected risk finding using multiple Accordions.
 */
export function FindingDetailView({
  finding,
  findingIndex = 0,
  totalFindings = 0,
  totalAnalyzed = 0,
  onBack,
  onSelectFinding,
}: FindingDetailViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupedLegalRef | null>(null);

  const groupedLegalReferences = useMemo<GroupedLegalRef[]>(() => {
    if (!finding.applicable_legal_references || finding.applicable_legal_references.length === 0) {
      return [];
    }

    const groupsMap = new Map<string, GroupedLegalRef>();

    for (const ref of finding.applicable_legal_references) {
      const regulationName = ref.name || "Peraturan Terkait";
      const hierarchyText = [ref.book_title, ref.chapter_title, ref.section_title].filter(Boolean).join(" • ");
      const groupKey = `${regulationName}:::${hierarchyText}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          regulationName,
          hierarchyText,
          articles: [],
        });
      }

      const group = groupsMap.get(groupKey)!;
      const exists = group.articles.some(
        (a) => a.article_number === ref.article_number && a.content === ref.content
      );
      if (!exists) {
        group.articles.push(ref);
      }
    }

    return Array.from(groupsMap.values());
  }, [finding.applicable_legal_references]);

  return (
    <div>
      <div className="sticky top-0 z-20 bg-transparent backdrop-blur-lg">
        <div className="px-3 pt-3">
          <ReviewRiskSummaryBar totalAnalyzed={totalAnalyzed || totalFindings} riskyCount={totalFindings} />
        </div>
        <div className="border-b border-slate-200/80 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </button>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onSelectFinding?.(finding.findingId)}
          className="w-full text-left border-b border-slate-200 p-4 hover:bg-white transition-colors cursor-pointer"
        >
          <p className="text-xs leading-relaxed font-medium text-slate-800 line-clamp-3">
            <span className="font-bold text-klarisa-secondary mr-1.5">#{findingIndex}</span>
            {finding.clause_text}
          </p>
        </button>

        <Accordion type="multiple" className="w-full">
          {/* 1. Result analysis card */}
          <FindingAnalysisCard reasoning={finding.reasoning} value="analysis" />

          {/* 2. Legal references card */}
          <FindingLegalReferencesCard
            groupedLegalReferences={groupedLegalReferences}
            onSelectGroup={(group) => setSelectedGroup(group)}
            value="legal"
          />

          {/* 3. Revision recommendation card */}
          <FindingRevisionRecommendationCard
            revisionRecommendation={finding.revision_recommendation}
            value="revision"
          />
        </Accordion>
      </div>

      {/* 4. Sheet for detail legal references */}
      <LegalReferenceDetailSheet
        selectedGroup={selectedGroup}
        onClose={() => setSelectedGroup(null)}
      />
    </div>
  );
}
