"use client";

import { useMemo } from "react";
import { Check, ChevronRight, Scale } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { MatchLegalArticleResult } from "@/types/legal.type";

export interface RegulationItem {
  regulation_id?: string;
  name?: string | null;
}

export interface ArticlesMatchingMarkerProps {
  /** Reasoning execution status */
  status?: "processing" | "completed" | "error";
  /** Current active reasoning step index (1-based) */
  currentStepIndex?: number;
  /** Total document chunks being processed */
  totalChunks?: number;
  /** Total matched Indonesian legal regulations from RAG vector search */
  matchedRegulationsCount?: number;
  /** Total risky findings detected */
  riskyCount?: number;
  /** Custom wrapper styling */
  className?: string;
  /** List of matched legal regulation names or objects */
  regulations?: Array<string | RegulationItem | MatchLegalArticleResult>;
}

/**
 * ArticlesMatchingMarker component displays step-by-step progress
 * of AI legal compliance reasoning over contract documents.
 */
export function ArticlesMatchingMarker({
  status = "processing",
  matchedRegulationsCount,
  className,
  regulations,
}: ArticlesMatchingMarkerProps) {
  const isProcessing = status === "processing";

  const activeRegulations = useMemo(() => {
    if (!regulations || regulations.length === 0) {
      return [];
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueNames: string[] = [];

    for (const item of regulations) {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed && !seenNames.has(trimmed)) {
          seenNames.add(trimmed);
          uniqueNames.push(trimmed);
        }
      } else if (item && typeof item === "object") {
        const regId = (item.regulation_id ?? (item as any).id)?.trim();
        const regName = item.name?.trim();

        if (regId) {
          if (!seenIds.has(regId)) {
            seenIds.add(regId);
            if (regName && !seenNames.has(regName)) {
              seenNames.add(regName);
              uniqueNames.push(regName);
            } else if (!regName) {
              uniqueNames.push(regId);
            }
          }
        } else if (regName && !seenNames.has(regName)) {
          seenNames.add(regName);
          uniqueNames.push(regName);
        }
      }
    }

    return uniqueNames;
  }, [regulations]);

  const totalMatched =
    typeof matchedRegulationsCount === "number" && matchedRegulationsCount > 0
      ? matchedRegulationsCount
      : activeRegulations.length;
  const remainingCount = Math.max(0, totalMatched - activeRegulations.length);

  return (
    <Marker role="status" className={cn("items-start", className)}>
      <MarkerIcon className="mt-1">
        {isProcessing ? (
          <Spinner />
        ) : (
          <Check className="size-4 text-klarisa-primary" />
        )}
      </MarkerIcon>
      <MarkerContent className="w-full">
        <Accordion
          type="single"
          collapsible
          className="w-full border-none"
        >
          <AccordionItem value="reasoning-details" className="border-none">
            <AccordionTrigger className="group justify-start gap-1.5 p-0 text-lg text-slate-900 hover:no-underline hover:bg-transparent [&[data-state=open]>svg]:rotate-90">
              <div className={`flex items-center ${isProcessing ? "shimmer" : ""}`}>
                <span>
                  {isProcessing
                    ? "Mencari Rujukan Undang-Undang yang Relevan"
                    : !isProcessing && activeRegulations.length > 0
                    ? "Rujukan Undang-Undang Berhasil Ditemukan"
                    : "Proses Pencarian Selesai"}
                </span>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </AccordionTrigger>
            <AccordionContent className="pb-0 text-xs text-slate-600 space-y-3">
              {isProcessing && !activeRegulations.length && (
                <p className="leading-relaxed text-slate-500">
                  Sistem sedang menganalisis pasal-pasal dalam dokumen kontrak Anda dan mencocokkannya dengan Peraturan Perundang-undangan Indonesia yang berlaku.
                </p>
              )}

              {!isProcessing && activeRegulations.length === 0 && (
                <p className="leading-relaxed text-slate-500">
                  Dokumen kontrak ini telah dianalisis dan tidak memerlukan rujukan undang-undang khusus.
                </p>
              )}

              {activeRegulations.length > 0 && (
                
                  <div className="flex flex-col gap-2 p-2">
                    {activeRegulations.map((reg, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1.5 duration-300 fill-mode-backwards"
                        style={{
                          animationDelay: `${idx * 150}ms`,
                          animationFillMode: "backwards",
                        }}
                      >
                        <Scale className="size-3.5 shrink-0 mt-0.5" />
                        {/* Container for right-side gradient fade truncation */}
                        <div className="relative min-w-0 flex-1 overflow-hidden">
                          <p className="whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300 pr-8 [mask-image:linear-gradient(to_right,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                            {reg}
                          </p>
                          {/* Gradient overlay fade out effect */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent via-white/80 to-[#f7f8fb] dark:via-slate-900/80 dark:to-slate-900" />
                        </div>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <p
                        className="text-slate-500 animate-in fade-in slide-in-from-top-1.5 duration-300 fill-mode-backwards"
                        style={{
                          animationDelay: `${activeRegulations.length * 150}ms`,
                          animationFillMode: "backwards",
                        }}
                      >
                        Dan {remainingCount} lainnya...
                      </p>
                    )}
                  </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MarkerContent>
    </Marker>
  );
}