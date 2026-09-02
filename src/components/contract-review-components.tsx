"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Copy, FileText, Scale, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, SubmitButton } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ChunkReasoningResult } from "@/types/contract-review.type";
import type { LegalArticle } from "@/types/legal.type";

export type FindingId = string;

export interface DisplayFinding extends ChunkReasoningResult {
  findingId: string;
}

export function DocumentHeader({
  fileName = "Dokumen Kontrak.docx",
  status,
}: {
  fileName?: string;
  status?: string;
}) {
  return (
    <header className="flex h-14 min-h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-7">
      <FileText className="size-5 text-slate-600" />
      <span className="grid">
        <b className="text-sm font-semibold">{fileName}</b>
        <small className="text-xs text-slate-400">Hasil Parsing Dokumen DOCX</small>
      </span>
      {status && <span className="ml-auto hidden text-xs font-medium text-slate-500 sm:block">{status}</span>}
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
  isContract?: boolean;
  notContractReason?: string;
  totalAnalyzed?: number;
  detailed?: boolean;
  findings?: DisplayFinding[];
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
};

export function ReviewRiskSummaryBar({
  totalAnalyzed = 0,
  riskyCount = 0,
}: {
  totalAnalyzed?: number;
  riskyCount?: number;
  description?: string;
}) {
  const totalCount = totalAnalyzed || riskyCount;
  const fractionText = totalCount > 0 ? `${riskyCount}/${totalCount}` : `${riskyCount}`;
  const ratio = totalCount > 0 ? Math.min(100, Math.round((riskyCount / totalCount) * 100)) : 0;

  return (
    <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-5 py-4">
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
      <div className="grid gap-0.5">
        <h3 className="text-md font-bold text-slate-900 leading-snug">
          {riskyCount} terdeteksi berisiko
        </h3>
        <p className="text-sm text-slate-500">
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
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    if (finding.reasoning) {
      navigator.clipboard.writeText(finding.reasoning);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusText =
    finding.compliance_status === "VIOLATES_LAW"
      ? "Rujukan Ketentuan Undang-Undang"
      : finding.compliance_status === "UNFAIR_ONE_SIDED"
      ? "Indikasi Ketentuan Tidak Seimbang"
      : "Indikasi Ketentuan Belum Lengkap";

  return (
    <div>
      <div className="sticky top-0 z-20 bg-slate-50">
        <ReviewRiskSummaryBar totalAnalyzed={totalAnalyzed || totalFindings} riskyCount={totalFindings} />
        <div className="border-b border-slate-200/80 px-4 py-3 bg-white">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold hover:text-klarisa-secondary cursor-pointer transition-colors"
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

        <Collapsible defaultOpen className="border-b border-slate-200 group">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Image
                src="/klarisa/logo-ai.png"
                alt="Klarisa AI"
                width={18}
                height={18}
                className="size-4.5 object-contain"
              />
              <h4 className="text-sm font-bold text-slate-900">Hasil Analisis</h4>
            </div>
            <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <p className="text-xs leading-relaxed text-slate-700">
              {finding.reasoning || "Terdeteksi potensi risiko pada klausul ini."}
            </p>
            <div className="mt-3 flex items-center gap-2 text-slate-400">
              <button
                type="button"
                onClick={handleCopy}
                title="Salin analisis"
                className="grid size-6 place-items-center rounded hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen className="border-b border-slate-200 group">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff5527] text-white">
                <Scale className="size-3.5" />
              </span>
              <h4 className="text-sm font-bold text-slate-900">{statusText}</h4>
            </div>
            <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {groupedLegalReferences.length > 0 ? (
              <div className="grid gap-2 pt-1">
                {groupedLegalReferences.map((group, gIdx) => (
                  <button
                    key={gIdx}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="flex w-full min-w-0 items-center justify-between gap-2.5 rounded-md border border-slate-200 bg-white p-3.5 text-left transition-colors cursor-pointer group/item overflow-hidden"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2.5 overflow-hidden">
                      <Scale className="size-4 shrink-0 text-klarisa-secondary mt-0.5" />
                      <div className="grid min-w-0 flex-1 gap-0.5 overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-800 truncate" title={group.regulationName}>
                          {group.regulationName}
                        </h5>
                        {group.hierarchyText && (
                          <p className="text-[11px] font-medium text-slate-500 truncate" title={group.hierarchyText}>
                            {group.hierarchyText}
                          </p>
                        )}
                        <p className="text-[11px] font-semibold text-klarisa-secondary mt-1">
                          {group.articles.length} pasal terkait
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-400 group-hover/item:text-slate-600 transition-colors ml-1" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-slate-700">
                Klausul ini berpotensi merugikan salah satu pihak dan melanggar azas keseimbangan dalam hukum perjanjian kerja sama.
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Card 3: Rekomendasi Perbaikan */}
        {finding.revision_recommendation && (
          <Collapsible defaultOpen className="border-b border-slate-200 group">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
                  <FileText className="size-3.5" />
                </span>
                <h4 className="text-sm font-bold text-slate-900">Rekomendasi Perbaikan</h4>
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
            <div className="flex items-center gap-2 text-klarisa-secondary font-bold text-sm">
              <Scale className="size-4" />
              <span>Detail Peraturan Hukum</span>
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
                defaultOpen={idx === 0}
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

export function FindingList({
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
      <section className="bg-white p-6 space-y-4">
        <ReviewRiskSummaryBar totalAnalyzed={totalAnalyzed} riskyCount={0} />
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
          <p className="text-xs font-semibold">Tidak ditemukan klausul berisiko pada dokumen ini.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="sticky top-0 z-20 bg-white">
        <ReviewRiskSummaryBar totalAnalyzed={totalAnalyzed || riskCount} riskyCount={riskCount} />
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

export function DiscussionPanel() {
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; text: string }>>([
    {
      id: "1",
      role: "assistant",
      text: "Halo! Saya Klarisa AI. Silakan tanyakan hal khusus, klarifikasi pasal, atau analisis risiko pada dokumen ini.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    const newMsg = { id: String(Date.now()), role: "user" as const, text: userText };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsSending(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          text: `Berdasarkan konteks dokumen: ${
            userText.toLowerCase().includes("denda")
              ? "Terdapat klausul mengenai denda/imbalan yang perlu diperhatikan pada Pasal 1."
              : userText.toLowerCase().includes("hak") || userText.toLowerCase().includes("hki")
              ? "Ketentuan Hak Kekayaan Intelektual (HKI) tercantum dalam klausul perjanjian."
              : "Informasi tersebut merujuk pada ketentuan yang tertera di dalam dokumen kontrak."
          }`,
        },
      ]);
      setIsSending(false);
    }, 700);
  };

  return (
    <aside className="flex h-full min-h-[500px] flex-col bg-[#f8fafc] p-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">PANEL CHAT & DISKUSI</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
          Klarisa AI Assistant
        </span>
      </div>

      <div className="my-4 flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[88%] rounded-lg p-3 leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-klarisa-secondary text-white font-medium"
                : "bg-white border border-slate-200 text-slate-700 shadow-sm"
            )}
          >
            {msg.text}
          </div>
        ))}
        {isSending && (
          <div className="max-w-[88%] animate-pulse rounded-lg border border-slate-200 bg-white p-3 text-xs italic text-slate-400 shadow-sm">
            Klarisa AI sedang menganalisis dokumen...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-auto flex min-h-28 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Pertanyaan tentang dokumen"
          placeholder="Tulis pertanyaan Anda..."
          className="min-h-16 w-full resize-none bg-transparent text-xs outline-none placeholder:text-slate-400"
        />
        <SubmitButton
          variant="default"
          size="icon-sm"
          type="submit"
          disabled={!input.trim() || isSending}
          aria-label="Kirim pertanyaan"
          className="mt-auto ml-auto"
        >
          <Send className="size-4" />
        </SubmitButton>
      </form>
      <small className="mt-2 text-[10px] leading-4 text-slate-400">
        Jawaban AI berpatokan pada pasal dan regulasi hukum terkait.
      </small>
    </aside>
  );
}
