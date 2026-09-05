"use client";

import { ChevronDown, Scale } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { GroupedLegalRef } from "./legal-references-card";

interface LegalReferenceDetailSheetProps {
  selectedGroup: GroupedLegalRef | null;
  onClose: () => void;
}

/**
 * Slide-over sheet component displaying full legal articles for a selected regulation group using Accordion.
 */
export function LegalReferenceDetailSheet({
  selectedGroup,
  onClose,
}: LegalReferenceDetailSheetProps) {
  return (
    <Sheet
      open={!!selectedGroup}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-klarisa-tertiary text-white">
            <Scale className="size-3.5" />
          </div>
          <SheetTitle className="text-base font-bold text-slate-900 mt-1">
            {selectedGroup?.regulationName || "Peraturan Terkait"}
          </SheetTitle>
          {selectedGroup?.hierarchyText && (
            <SheetDescription className="text-xs text-slate-500">
              {selectedGroup.hierarchyText}
            </SheetDescription>
          )}
        </SheetHeader>

        <Accordion type="multiple" className="mt-5 space-y-3">
          {selectedGroup?.articles.map((article, idx) => (
            <AccordionItem
              key={idx}
              value={`article-${idx}`}
              className="rounded-md border border-slate-200 bg-white overflow-hidden group"
            >
              <AccordionTrigger className="p-3.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-200">
                    {article.article_number || `Pasal ${idx + 1}`}
                  </span>
                </div>
                <ChevronDown className="size-4 text-slate-500 transition-transform duration-200" />
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-white text-xs leading-relaxed text-slate-700 font-sans whitespace-pre-wrap">
                {article.content || "Tidak ada rincian konten pasal tersedia."}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
