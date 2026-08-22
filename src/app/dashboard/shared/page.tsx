"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare, Search, Share2 } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useContracts } from "@/hooks/useContracts";

export default function SharedDraftsPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = useContracts({ type: "draft", shared: true, query: useDeferredValue(query) || undefined });
  return <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-7 lg:py-16">
    <p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">DRAFT DIBAGIKAN</p>
    <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="font-heading text-[clamp(2.5rem,5vw,3.8rem)] font-normal leading-none tracking-[-.055em]">Diskusi yang sedang berjalan.</h1><p className="mt-4 max-w-xl text-sm text-slate-500">Cari dokumen yang telah dibagikan dan lanjutkan percakapan dari bagian terakhir.</p></div><Link href="/dashboard/create" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white">Buat draft<ArrowRight className="size-4"/></Link></div>
    <section className="mt-8"><label className="relative block"><span className="sr-only">Cari draft yang dibagikan</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama draft atau penerima..." className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10"/><Search className="absolute top-4 right-4 size-4 text-klarisa-secondary"/></label>
      <div className="flex items-center justify-between py-4 text-[10px] text-slate-400"><span>Draft yang dapat Anda lanjutkan</span><span>{data.length} dokumen</span></div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{isLoading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="flex animate-pulse gap-4 border-b border-slate-200 p-5"><span className="size-10 rounded bg-slate-200"/><span className="my-auto h-4 flex-1 rounded bg-slate-200"/></div>) : data.map((item) => <Link href={`/dashboard/create?id=${item.id}`} key={item.id} className="grid gap-4 border-b border-slate-200 p-5 last:border-0 hover:bg-slate-50 sm:grid-cols-[40px_1fr_auto_18px] sm:items-center"><span className="grid size-10 place-items-center rounded-md bg-[#edf2ff] text-klarisa-secondary"><Share2 className="size-4"/></span><span className="grid gap-1"><b className="text-sm">{item.title}</b><small className="text-[10px] text-slate-400">Dibagikan kepada {Number(item.metadata.recipients ?? 0)} orang</small></span><em className="inline-flex items-center gap-2 text-[10px] not-italic text-klarisa-secondary"><MessageSquare className="size-3"/>{Number(item.metadata.comments ?? 0)} komentar</em><ArrowRight className="size-4"/></Link>)}
        {error && <div className="px-5 py-14 text-center text-sm text-red-500">{error}</div>}{!isLoading && !error && data.length === 0 && <div className="px-5 py-14 text-center"><Search className="mx-auto size-5 text-slate-300"/><p className="mt-3 text-sm font-semibold">Draft tidak ditemukan.</p><p className="mt-1 text-xs text-slate-400">Coba gunakan nama yang berbeda.</p></div>}
      </div>
    </section>
  </div>;
}
