"use client";

import { useMemo } from "react";
import { Check, ChevronRight, FileText } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { DocumentChunk } from "@/types/common.type";

export interface ReasoningChunkItem {
  chunkId?: string;
  sectionTitle?: string;
  text: string;
}

export interface ReasoningBatchItem {
  id?: string;
  batchIndex?: number;
  totalBatches?: number;
  status?: "processing" | "completed" | "error";
  chunks: Array<string | ReasoningChunkItem | DocumentChunk>;
}

export interface ReasoningMarkerProps {
  /** Reasoning execution status for the whole pipeline */
  status?: "processing" | "completed" | "error";
  /** List of document chunks being analyzed across batches */
  chunks?: Array<string | ReasoningChunkItem | DocumentChunk>;
  /** Explicit list of batches if managed individually */
  batches?: ReasoningBatchItem[];
  /** Currently active batch index being processed (0-based) */
  activeBatchIndex?: number;
  /** Custom wrapper styling */
  className?: string;
}

/**
 * Calculates dynamic batch size matching backend ReviewService strategy:
 * <= 4 chunks -> batch size 2
 * <= 10 chunks -> batch size 3
 * <= 18 chunks -> batch size 2
 * > 18 chunks -> batch size 3
 */
export function calculateDynamicBatchSize(totalChunks: number): number {
  if (totalChunks <= 4) return 2;
  if (totalChunks <= 10) return 3;
  if (totalChunks <= 18) return 2;
  return 3;
}

/**
 * Normalizes input chunks into standardized array of formatted chunk items.
 */
function normalizeChunks(chunks: Array<string | ReasoningChunkItem | DocumentChunk>): ReasoningChunkItem[] {
  if (!chunks || chunks.length === 0) return [];
  return chunks.map((item) => {
    if (typeof item === "string") {
      return { text: item.trim() };
    }
    return {
      chunkId: (item as any).chunkId,
      sectionTitle: (item as any).sectionTitle,
      text: item.text?.trim() ?? "",
    };
  }).filter((item) => item.text.length > 0);
}

/**
 * ReasoningMarker component displays sequential batch analysis progress
 * for AI compliance reasoning over contract clauses.
 */
export function ReasoningMarker({
  status = "processing",
  chunks = [],
  batches: explicitBatches,
  activeBatchIndex = 0,
  className,
}: ReasoningMarkerProps) {
  const formattedBatches = useMemo(() => {
    if (explicitBatches && explicitBatches.length > 0) {
      return explicitBatches.map((b, idx) => ({
        id: b.id ?? `batch-${idx + 1}`,
        batchIndex: b.batchIndex ?? idx + 1,
        totalBatches: b.totalBatches ?? explicitBatches.length,
        status: b.status ?? (status === "completed" ? "completed" : idx <= activeBatchIndex ? "processing" : "processing"),
        chunks: normalizeChunks(b.chunks),
      }));
    }

    const allFormattedChunks = normalizeChunks(chunks);

    if (allFormattedChunks.length === 0) {
      // Default fallback demo batch
      return [
        {
          id: "batch-1",
          batchIndex: 1,
          totalBatches: 1,
          status,
          chunks: [],
        },
      ];
    }

    const batchSize = calculateDynamicBatchSize(allFormattedChunks.length);
    const chunkGroups: ReasoningChunkItem[][] = [];
    for (let i = 0; i < allFormattedChunks.length; i += batchSize) {
      chunkGroups.push(allFormattedChunks.slice(i, i + batchSize));
    }

    return chunkGroups.map((group, idx) => {
      let batchStatus: "processing" | "completed" | "error" = "processing";
      if (status === "completed") {
        batchStatus = "completed";
      } else if (status === "error") {
        batchStatus = idx < activeBatchIndex ? "completed" : "error";
      } else {
        batchStatus = idx < activeBatchIndex ? "completed" : "processing";
      }

      return {
        id: `batch-${idx + 1}`,
        batchIndex: idx + 1,
        totalBatches: chunkGroups.length,
        status: batchStatus,
        chunks: group,
      };
    });
  }, [chunks, explicitBatches, status, activeBatchIndex]);

  // Only render batches up to activeBatchIndex or when completed (Batch 2 only appears after Batch 1 completes)
  const visibleBatches = useMemo(() => {
    return formattedBatches.filter((_, idx) => {
      if (idx === 0) return true;
      if (status === "completed") return true;
      return idx <= activeBatchIndex;
    });
  }, [formattedBatches, status, activeBatchIndex]);

  return (
    <div className={cn("space-y-3", className)}>
      {visibleBatches.map((batch) => {
        const isBatchProcessing = batch.status === "processing";
        const chunkCount = batch.chunks.length;

        const triggerTitle = isBatchProcessing
          ? `${chunkCount} Klausul Sedang diperiksa`
          : `${chunkCount} Klausul Selesai diperiksa`;

        return (
          <Marker key={batch.id} role="status" className="items-start">
            <MarkerIcon className="mt-1">
              {isBatchProcessing ? (
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
                <AccordionItem value={`reasoning-batch-${batch.id}`} className="border-none">
                  <AccordionTrigger className="group justify-start gap-1.5 p-0 text-base text-slate-900 hover:no-underline hover:bg-transparent [&[data-state=open]>svg]:rotate-90">
                    <div className={`flex items-center ${isBatchProcessing ? "shimmer" : ""}`}>
                      <span>{triggerTitle}</span>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 text-xs text-slate-600 space-y-3">
                    {isBatchProcessing && batch.chunks.length === 0 && (
                      <p className="leading-relaxed text-slate-500">
                        Sedang menganalisis klausul dokumen kontrak...
                      </p>
                    )}

                    {batch.chunks.length > 0 && (
                      <div className="flex flex-col gap-2 p-2">
                        {batch.chunks.map((chunk, idx) => (
                          <div
                            key={chunk.chunkId ?? idx}
                            className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1.5 duration-300 fill-mode-backwards"
                            style={{
                              animationDelay: `${idx * 150}ms`,
                              animationFillMode: "backwards",
                            }}
                          >
                            <FileText className="size-3 shrink-0 mt-0.5" />
                            {/* Container for right-side gradient fade truncation */}
                            <div className="relative min-w-0 flex-1 overflow-hidden">
                              <p className="whitespace-nowrap text-xs text-slate-700 dark:text-slate-300 font-normal pr-8 [mask-image:linear-gradient(to_right,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                                {chunk.sectionTitle ? `${chunk.sectionTitle}: ` : ""}
                                {chunk.text}
                              </p>
                              {/* Gradient overlay fade out effect */}
                              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent via-white/80 to-[#f7f8fb] dark:via-slate-900/80 dark:to-slate-900" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </MarkerContent>
          </Marker>
        );
      })}
    </div>
  );
}
