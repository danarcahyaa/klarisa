"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare, Search, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

const drafts = [
  ["Perjanjian Jasa Identitas Visual", "Dibagikan kepada 2 orang", "1 komentar baru"],
  ["Kontrak Freelancer Ilustrasi", "Dibagikan kepada 1 orang", "Menunggu tanggapan"],
  ["Perjanjian Kerja Sama Desain", "Dibagikan kepada 3 orang", "Disunting hari ini"],
  ["Draft Kerja Sama Fotografi", "Dibagikan kepada 1 orang", "2 komentar baru"],
] as const;

export default function SharedDraftsPage() {
  const [query, setQuery] = useState("");
  const filteredDrafts = useMemo(
    () => drafts.filter(([name, people, status]) => `${name} ${people} ${status}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-7 lg:py-16">
    <p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">DRAFT DIBAGIKAN</p>
    <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><h1 className="font-heading text-[clamp(2.5rem,5vw,3.8rem)] font-normal leading-none tracking-[-.055em]">Diskusi yang sedang berjalan.</h1><p className="mt-4 max-w-xl text-sm text-slate-500">Cari dokumen yang telah dibagikan dan lanjutkan percakapan dari bagian terakhir.</p></div>
      <Link href="/dashboard/create" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white">Buat draft<ArrowRight className="size-4"/></Link>
    </div>
    <section className="mt-8">
      <label className="relative block"><span className="sr-only">Cari draft yang dibagikan</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama draft, penerima, atau status..." className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10"/><Search className="absolute top-4 right-4 size-4 text-klarisa-secondary"/></label>
      <div className="flex items-center justify-between py-4 text-[10px] text-slate-400"><span>Draft yang dapat Anda lanjutkan</span><span>{filteredDrafts.length} dokumen</span></div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filteredDrafts.map(([name,people,status])=><Link href="/dashboard/create" key={name} className="grid gap-4 border-b border-slate-200 p-5 last:border-0 hover:bg-slate-50 sm:grid-cols-[40px_1fr_auto_18px] sm:items-center"><span className="grid size-10 place-items-center rounded-md bg-[#edf2ff] text-klarisa-secondary"><Share2 className="size-4"/></span><span className="grid gap-1"><b className="text-sm">{name}</b><small className="text-[10px] text-slate-400">{people}</small></span><em className="inline-flex items-center gap-2 text-[10px] not-italic text-klarisa-secondary"><MessageSquare className="size-3"/>{status}</em><ArrowRight className="size-4"/></Link>)}
        {filteredDrafts.length === 0 && <div className="px-5 py-14 text-center"><Search className="mx-auto size-5 text-slate-300"/><p className="mt-3 text-sm font-semibold">Draft tidak ditemukan.</p><p className="mt-1 text-xs text-slate-400">Coba gunakan nama atau status yang berbeda.</p></div>}
      </div>
    </section>
  </div>;
}
