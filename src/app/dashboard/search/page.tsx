"use client";

import Link from "next/link";
import { ArrowRight, MoreHorizontal, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useContracts } from "@/hooks/useContracts";
import type { ContractType } from "@/types/contract.type";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Draft" | "Review">("Semua");
  const { data, isLoading, error } = useContracts({
    query: useDeferredValue(query) || undefined,
    type: filter === "Semua" ? undefined : filter.toLowerCase() as ContractType,
  });

  return <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-7 lg:py-20">
    <section className="text-center"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">WORKSPACE PRIBADI</p><h1 className="mx-auto mt-5 max-w-2xl font-heading text-[clamp(2.5rem,5vw,3.7rem)] font-normal leading-[.96] tracking-[-.055em]">Mulai dari dokumen yang perlu Anda pahami.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Cari review atau draft, lalu lanjutkan dari keputusan terakhir.</p></section>
    <section className="mt-7"><label className="relative block"><span className="sr-only">Cari review atau draft</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari review atau draft..." className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10"/><Search className="absolute top-4 right-4 size-4 text-klarisa-secondary"/></label>
      <div className="flex items-center gap-2 border-b border-slate-200 py-4">{(["Semua", "Draft", "Review"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`h-8 rounded-full border px-3 text-[10px] ${filter === item ? "border-[#172031] bg-[#172031] text-white" : "border-slate-200 bg-white text-slate-500 hover:border-klarisa-secondary"}`}>{item}</button>)}<span className="ml-auto text-[10px] text-slate-400">Total {data.length}</span></div>
      {isLoading ? <div className="grid gap-px">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex animate-pulse items-center gap-4 border-b border-slate-200 py-5"><span className="size-7 rounded bg-slate-200"/><span className="h-4 flex-1 rounded bg-slate-200"/></div>)}</div> : <div>{data.map((item) => { const isDraft = item.type === "draft"; const href = isDraft ? `/dashboard/create?id=${item.id}` : `/dashboard/review/result?id=${item.id}`; return <Link href={href} key={item.id} className="grid grid-cols-[30px_minmax(0,1fr)_20px] items-center gap-3 border-b border-slate-200 py-5 text-slate-700 transition-colors hover:bg-white sm:grid-cols-[30px_minmax(0,1fr)_auto_20px] sm:px-2"><i className={`grid size-7 place-items-center rounded text-[9px] font-bold not-italic ${isDraft ? "bg-slate-100 text-slate-500" : "bg-[#edf2ff] text-klarisa-secondary"}`}>{isDraft ? "D" : "R"}</i><span className="grid gap-1"><b className="text-xs">{item.title}</b><small className="text-[10px] text-slate-400">Diperbarui {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.updatedAt))} · {item.riskCount} bagian perlu ditinjau</small></span><em className={`hidden text-[9px] font-bold not-italic sm:block ${isDraft ? "text-klarisa-secondary" : "text-red-500"}`}>{isDraft ? `DRAFT ${String(item.metadata.version ?? 1).padStart(2, "0")}` : `${item.score ?? 0}/100`}</em><MoreHorizontal className="size-4 text-slate-500"/></Link>; })}{error && <p className="py-10 text-center text-sm text-red-500">{error}</p>}{!error && data.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Dokumen tidak ditemukan.</p>}</div>}
      <footer className="mt-6 flex justify-end gap-2"><Link href="/dashboard/create" className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-xs font-bold">Buat draft</Link><Link href="/dashboard/review" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white">Review kontrak<ArrowRight className="size-4"/></Link></footer>
    </section>
  </div>;
}
