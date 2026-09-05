"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CopyButton } from "@/components/ui/copy-button";

interface FindingAnalysisCardProps {
  reasoning?: string;
  value?: string;
}

/**
 * Component card displaying the LLM compliance analysis result as an Accordion item.
 * Copy button becomes visible on hover.
 */
export function FindingAnalysisCard({
  reasoning,
  value = "analysis",
}: FindingAnalysisCardProps) {
  return (
    <AccordionItem value={value} className="group/card">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <Image
            src="/klarisa/logo-ai.svg"
            alt="Klarisa AI"
            width={20}
            height={20}
            className="size-5 object-contain"
          />
          <h4 className="text-sm font-semibold text-slate-900">Hasil Analisis</h4>
        </div>
        <ChevronDown className="size-4 text-slate-500 transition-transform duration-200" />
      </AccordionTrigger>
      <AccordionContent className="relative pb-3">
        <p className="text-xs leading-relaxed text-slate-700 pr-7">
          {reasoning || ""}
        </p>
        <div className="absolute right-3 bottom-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <CopyButton valueToCopy={reasoning || ""} title="Salin analisis" />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
