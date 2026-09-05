"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, ChevronRight, Copy, CopyIcon, FileText, Mic, Plus, Scale, Search, SendHorizontal, Sparkle, SquarePen } from "lucide-react";

import { cn, formatIndonesianDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ChunkReasoningResult } from "@/types/contract-review.type";
import type { LegalArticle } from "@/types/legal.type";
import { CopyButton } from "./ui/copy-button";
import { Skeleton } from "./ui/skeleton";

export type FindingId = string;

export interface DisplayFinding extends ChunkReasoningResult {
  findingId: string;
}

export function DocumentHeader({
  fileName = "",
  createdAt,
  status,
  onBack,
  isLoading = false,
}: {
  fileName?: string;
  createdAt?: string | null;
  status?: string;
  onBack?: () => void;
  isLoading?: boolean;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/review");
    }
  };

  const formattedDate = createdAt ? formatIndonesianDate(createdAt) : null;

  return (
    <header className="flex h-16 min-h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-7">
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        onClick={handleBack}
        title="Kembali"
        aria-label="Kembali"
        className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="size-5" />
      </Button>
      {isLoading ? (
        <div className="grid gap-1 flex-1">
          <Skeleton className="h-4 w-48 max-w-full rounded-md" />
          <Skeleton className="h-3 w-32 max-w-full rounded-md" />
        </div>
      ) : (
        <span className="grid">
          <b className="text-sm font-semibold">{fileName}</b>
          <small className="text-xs text-slate-400">
            {formattedDate ? `${formattedDate}` : ""}
          </small>
        </span>
      )}
      {!isLoading && status && <span className="ml-auto hidden text-xs font-medium text-slate-500 sm:block">{status}</span>}
    </header>
  );
}

type ContractDocumentProps = {
  htmlContent?: string | null;
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
};

export function ContractDocument({
  htmlContent,
  activeFinding,
  onSelectFinding,
}: ContractDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll("[data-finding-source]");
    marks.forEach((el) => {
      const source = el.getAttribute("data-finding-source");
      if (activeFinding && source === activeFinding) {
        el.classList.add("active-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.classList.remove("active-highlight");
      }
    });
  }, [activeFinding, htmlContent]);

  // Click delegation handler for highlighted clauses
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("[data-finding-source]");
    if (target) {
      const sourceId = target.getAttribute("data-finding-source");
      if (sourceId) {
        onSelectFinding?.(sourceId);
      }
    }
  };

  if (htmlContent) {
    return (
      <article className="docx-rendered-content w-full p-6 sm:p-10 lg:p-12 font-serif text-justify">
        <div
          ref={containerRef}
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>
    );
  }

  return (
    <article className="w-full px-5 py-9 text-[#202a3a] sm:px-10 lg:py-14">
      <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">DOKUMEN / 01</p>
      <h1 className="mt-5 font-heading text-2xl font-semibold leading-tight sm:text-3xl">
        SURAT PERJANJIAN KERJA<br className="hidden sm:block" /> SAMA JASA DIGITAL
      </h1>
      <p className="mt-4 text-sm leading-relaxed">
        Perjanjian ini dibuat antara PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.
      </p>
      <section className="mt-8">
        <h2 className="font-sans text-xs font-bold uppercase tracking-wide">PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN</h2>
        <p className="mt-4 pl-0 text-sm leading-relaxed sm:pl-5">
          PIHAK KEDUA bertanggung jawab menyelesaikan sistem informasi sesuai lampiran spesifikasi teknis.
        </p>
      </section>
    </article>
  );
}

type FindingListProps = {
  isLoading?: boolean;
  isContract?: boolean;
  notContractReason?: string;
  totalAnalyzed?: number;
  detailed?: boolean;
  findings?: DisplayFinding[];
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
};

export function ReviewRiskSummaryBar({
  isLoading = false,
  totalAnalyzed = 0,
  riskyCount = 0,
}: {
  isLoading?: boolean;
  totalAnalyzed?: number;
  riskyCount?: number;
  description?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-lg bg-white/80 backdrop-blur-md border px-5 py-5">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-5 w-36 max-w-full rounded-md" />
          <Skeleton className="h-3.5 w-60 max-w-full rounded-md" />
        </div>
      </div>
    );
  }

  const totalCount = totalAnalyzed || riskyCount;
  const fractionText = totalCount > 0 ? `${riskyCount}/${totalCount}` : `${riskyCount}`;
  const ratio = totalCount > 0 ? Math.min(100, Math.round((riskyCount / totalCount) * 100)) : 0;

  return (
    <div className="flex items-center gap-4 rounded-lg bg-white/80 backdrop-blur-md border px-5 py-5">
      <div className="relative flex size-20 shrink-0 items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-[#ff5527] transition-all duration-500 ease-out"
            strokeDasharray={`${ratio}, 100`}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-xs font-bold text-slate-800">{fractionText}</span>
      </div>
      <div className="grid flex-1 gap-1">
        <h3 className="text-md font-bold text-slate-900 leading-snug">
          {riskyCount} terdeteksi berisiko
        </h3>
        <p className="text-xs text-slate-500">
          Dari {totalCount} bagian kontrak yang diperiksa, terdapat {riskyCount} yang berisiko
        </p>
      </div>
    </div>
  );
}

interface GroupedLegalRef {
  regulationName: string;
  hierarchyText: string;
  articles: LegalArticle[];
}

export function FindingDetailView({
  finding,
  findingIndex = 0,
  totalFindings = 0,
  totalAnalyzed = 0,
  onBack,
  onSelectFinding,
}: {
  finding: DisplayFinding;
  findingIndex?: number;
  totalFindings?: number;
  totalAnalyzed?: number;
  onBack: () => void;
  onSelectFinding?: (findingId: string) => void;
}) {
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
      <div className="sticky top-0 z-20 bg-transparent">
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

        {/* Card 1: Hasil Analisis */}
        <Collapsible className="border-b border-slate-200 group">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer">
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
            <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <p className="text-xs leading-relaxed text-slate-700">
              {finding.reasoning || "Terdeteksi potensi risiko pada klausul ini."}
            </p>
            <div className="mt-3 flex items-center gap-2 text-slate-400">
              <CopyButton valueToCopy={finding.reasoning || ""} title="Salin analisis" />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Card 2: Rujukan Hukum (Hanya tampil jika ada rujukan hukum) */}
        {groupedLegalReferences.length > 0 && (
          <Collapsible className="border-b border-slate-200 group">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff5527] text-white">
                  <Scale className="size-3.5" />
                </span>
                <h4 className="text-sm font-semibold text-slate-900">Rujukan Undang-Undang</h4>
              </div>
              <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="ml-3 border-l border-slate-200 pl-3 flex flex-col gap-1">
                {groupedLegalReferences.map((group, gIdx) => (
                  <button
                    key={gIdx}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="flex w-full min-w-0 items-center justify-between gap-2.5 pb-2 pl-2 text-left transition-colors cursor-pointer group/item overflow-hidden"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2.5 overflow-hidden">
                      <div className="grid min-w-0 flex-1 gap-0.5 overflow-hidden">
                        <h5 className="text-xs font-semibold text-slate-800 truncate" title={group.regulationName}>
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
                    <ChevronRight className="size-4 shrink-0 text-slate-400 group-hover/item:text-slate-600 opacity-0 group-hover/item:opacity-100 transition-opacity ml-1" />
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Card 3: Rekomendasi Perbaikan */}
        {finding.revision_recommendation && (
          <Collapsible className="border-b border-slate-200 group">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
                  <FileText className="size-3.5" />
                </span>
                <h4 className="text-sm font-semibold text-slate-900">Rekomendasi Perbaikan</h4>
              </div>
              <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-xs leading-relaxed text-slate-700">
                {finding.revision_recommendation}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <Sheet
        open={!!selectedGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedGroup(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-2 text-sm">
              <div className="grid size-6 shrink-0 place-items-center rounded-full bg-klarisa-tertiary text-white">
                <Scale className="size-3.5" />
              </div>
              <span className="text-slate-700 font-semibold">Detail Rujukan Undang-Undang</span>
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

          <div className="mt-5 space-y-3">
            {selectedGroup?.articles.map((article, idx) => (
              <Collapsible
                key={idx}
                className="rounded-md border border-slate-200 bg-white overflow-hidden group"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3.5 text-left transition-colors cursor-pointer ">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-200">
                      {article.article_number || `Pasal ${idx + 1}`}
                    </span>
                  </div>
                  <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white text-xs leading-relaxed text-slate-700 font-sans whitespace-pre-wrap">
                  {article.content || "Tidak ada rincian konten pasal tersedia."}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function FindingListSkeleton() {
  return (
    <section role="status" aria-label="Memuat daftar temuan" className="motion-safe:animate-pulse">
      <div className="sticky top-0 z-20 bg-transparent backdrop-blur-md px-3 pt-3">
        <ReviewRiskSummaryBar isLoading={true} />
      </div>
      <div className="divide-y divide-slate-100 mt-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex w-full items-center border-b border-slate-200 justify-between gap-3 p-4"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Skeleton className="h-4 w-5 shrink-0 rounded-md" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
              </div>
            </div>
            <Skeleton className="size-4 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
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

