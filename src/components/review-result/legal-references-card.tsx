"use client";

import { ChevronDown, ChevronRight, Scale } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LegalArticle } from "@/types/legal.type";

export interface GroupedLegalRef {
  regulationName: string;
  hierarchyText: string;
  articles: LegalArticle[];
}

interface FindingLegalReferencesCardProps {
  groupedLegalReferences: GroupedLegalRef[];
  onSelectGroup: (group: GroupedLegalRef) => void;
  value?: string;
}

/**
 * Component card displaying applicable legal regulations and laws for a finding as an Accordion item.
 */
export function FindingLegalReferencesCard({
  groupedLegalReferences,
  onSelectGroup,
  value = "legal",
}: FindingLegalReferencesCardProps) {
  if (groupedLegalReferences.length === 0) {
    return null;
  }

  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <div className="flex items-center gap-2.5">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff5527] text-white">
            <Scale className="size-3.5" />
          </span>
          <h4 className="text-sm font-semibold text-slate-900">Rujukan Undang-Undang</h4>
        </div>
        <ChevronDown className="size-4 text-slate-500 transition-transform duration-200" />
      </AccordionTrigger>
      <AccordionContent>
        <div className="ml-3 border-l border-slate-200 pl-3 flex flex-col gap-1">
          {groupedLegalReferences.map((group, gIdx) => (
            <button
              key={gIdx}
              type="button"
              onClick={() => onSelectGroup(group)}
              className="flex w-98 min-w-0 items-center justify-between gap-2.5 pb-2 pl-1 text-left transition-colors cursor-pointer group/item overflow-hidden"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2.5 overflow-hidden">
                <div className="grid min-w-0 flex-1 gap-0.5 overflow-hidden">
                  <h5 className="text-sm font-medium hover:underline text-slate-800 truncate" title={group.regulationName}>
                    {group.regulationName}
                  </h5>
                  {group.hierarchyText && (
                    <p className="text-[11px] font-medium text-slate-500 truncate" title={group.hierarchyText}>
                      {group.hierarchyText}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-klarisa-secondary mt-0.5">
                    {group.articles.length} pasal terkait
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
