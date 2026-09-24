"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Scale, X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerNestedRoot,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { DisplayFinding } from "@/types/contract-review.type";
import { FindingAnalysisCard } from "./analysis-result-card";
import {
  FindingLegalReferencesCard,
  type GroupedLegalRef,
} from "./legal-references-card";
import { FindingRevisionRecommendationCard } from "./revision-recommendation-card";

interface MobileFindingDetailDrawerProps {
  finding: DisplayFinding | null;
  findingIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile responsive drawer displaying details of a selected risky clause,
 * with a nested drawer for inspecting specific legal references.
 */
export function MobileFindingDetailDrawer({
  finding,
  findingIndex,
  isOpen,
  onClose,
}: MobileFindingDetailDrawerProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupedLegalRef | null>(null);

  const groupedLegalReferences = useMemo<GroupedLegalRef[]>(() => {
    if (!finding?.applicable_legal_references || finding.applicable_legal_references.length === 0) {
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
  }, [finding?.applicable_legal_references]);

  return (
    <Drawer
      direction="right"
      open={isOpen && !!finding}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent className="h-full rounded-none flex flex-col bg-white">
        <DrawerHeader className="text-left border-b border-slate-200/80 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-klarisa-secondary">
              #{findingIndex} Klausul Berisiko
            </span>
            <DrawerClose asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>
            </DrawerClose>
          </div>
          <DrawerTitle className="sr-only">
            Detail Temuan Risiko #{findingIndex}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Rincian analisis risiko, rujukan hukum, dan rekomendasi revisi
          </DrawerDescription>
          <p className="text-xs leading-relaxed font-medium text-slate-800 line-clamp-3 mt-1">
            {finding?.clause_text}
          </p>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            {/* 1. Result analysis card */}
            {finding && <FindingAnalysisCard reasoning={finding.reasoning} value="analysis" />}

            {/* 2. Legal references card */}
            <FindingLegalReferencesCard
              groupedLegalReferences={groupedLegalReferences}
              onSelectGroup={(group) => setSelectedGroup(group)}
              value="legal"
            />

            {/* 3. Revision recommendation card */}
            {finding && (
              <FindingRevisionRecommendationCard
                revisionRecommendation={finding.revision_recommendation}
                value="revision"
              />
            )}
          </Accordion>
        </div>

        {/* Nested Drawer for legal references detail */}
        <DrawerNestedRoot
          direction="right"
          open={!!selectedGroup}
          onOpenChange={(open) => {
            if (!open) setSelectedGroup(null);
          }}
        >
          <DrawerContent className="h-full rounded-none flex flex-col bg-white">
            <DrawerHeader className="text-left border-b border-slate-200/80 px-4 py-3 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid size-6 shrink-0 place-items-center rounded-full bg-klarisa-tertiary text-white">
                    <Scale className="size-3.5" />
                  </div>
                  <DrawerTitle className="text-sm font-bold text-slate-900 line-clamp-1 truncate">
                    {selectedGroup?.regulationName || "Peraturan Terkait"}
                  </DrawerTitle>
                </div>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="size-4" />
                  </button>
                </DrawerClose>
              </div>
              {selectedGroup?.hierarchyText && (
                <DrawerDescription className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {selectedGroup.hierarchyText}
                </DrawerDescription>
              )}
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <Accordion type="multiple" className="space-y-3">
                {selectedGroup?.articles.map((article, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`article-${idx}`}
                    className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                  >
                    <AccordionTrigger className="p-3 hover:no-underline">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-200">
                        {article.article_number || `Pasal ${idx + 1}`}
                      </span>
                      <ChevronDown className="size-4 text-slate-500 transition-transform duration-200" />
                    </AccordionTrigger>
                    <AccordionContent className="p-3.5 pt-0 bg-white text-xs leading-relaxed text-slate-700 font-sans whitespace-pre-wrap">
                      {article.content || "Tidak ada rincian konten pasal tersedia."}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </DrawerContent>
        </DrawerNestedRoot>
      </DrawerContent>
    </Drawer>
  );
}
