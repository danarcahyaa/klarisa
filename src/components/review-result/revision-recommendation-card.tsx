"use client";

import { ChevronDown, FileText } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CopyButton } from "@/components/ui/copy-button";

interface FindingRevisionRecommendationCardProps {
  revisionRecommendation?: string;
  value?: string;
}

/**
 * Component card displaying revision recommendations for a risky clause as an Accordion item.
 * Copy button becomes visible on hover.
 */
export function FindingRevisionRecommendationCard({
  revisionRecommendation,
  value = "revision",
}: FindingRevisionRecommendationCardProps) {
  if (!revisionRecommendation) {
    return null;
  }

  return (
    <AccordionItem value={value} className="group/card">
      <AccordionTrigger>
        <div className="flex items-center gap-2.5">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
            <FileText className="size-3.5" />
          </span>
          <h4 className="text-sm font-semibold text-slate-900">Rekomendasi Perbaikan</h4>
        </div>
        <ChevronDown className="size-4 text-slate-500 transition-transform duration-200" />
      </AccordionTrigger>
      <AccordionContent className="relative pb-3">
        <p className="text-xs leading-relaxed text-slate-700 pr-7">
          {revisionRecommendation}
        </p>
        <div className="absolute right-3 bottom-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <CopyButton
            valueToCopy={revisionRecommendation || ""}
            title="Salin rekomendasi perbaikan"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
