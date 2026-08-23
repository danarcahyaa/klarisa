"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import type { ContractListItem } from "@/types/contract.type";

const PAGE_SIZE = 6;

export function ContractSearchClient({ items }: { items: ContractListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Draft" | "Review">("Semua");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query).trim().toLocaleLowerCase("id-ID");
  const data = useMemo(() => items.filter((item) => {
    if (filter !== "Semua" && item.type !== filter.toLowerCase()) return false;
    return !deferredQuery || item.title.toLocaleLowerCase("id-ID").includes(deferredQuery);
  }), [deferredQuery, filter, items]);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-7 lg:py-20">
      <section className="text-center">
        <p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">WORKSPACE PRIBADI</p>
        <h1 className="mx-auto mt-5 max-w-2xl font-heading text-[clamp(2.5rem,5vw,3.7rem)] font-normal leading-[.96] tracking-[-.055em]">Mulai dari dokumen yang perlu Anda pahami.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Cari review atau draft, lalu lanjutkan dari keputusan terakhir.</p>
      </section>

      <section className="mt-7">
        <label className="relative block">
          <span className="sr-only">Cari review atau draft</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Cari review atau draft..."
            className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10"
          />
          <Search className="absolute top-4 right-4 size-4 text-klarisa-secondary" />
        </label>

        <div className="flex items-center gap-2 border-b border-slate-200 py-4">
          {(["Semua", "Draft", "Review"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
              className={`h-8 rounded-full border px-3 text-[10px] ${filter === item ? "border-[#172031] bg-[#172031] text-white" : "border-slate-200 bg-white text-slate-500 hover:border-klarisa-secondary"}`}
            >
              {item}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-400">Total {data.length}</span>
        </div>

        <div>
          {visibleItems.map((item) => {
            const isDraft = item.type === "draft";
            const href = isDraft ? `/dashboard/create?id=${item.id}` : "/dashboard/review/result";
            return (
              <Link href={href} key={item.id} className="grid grid-cols-[30px_minmax(0,1fr)_20px] items-center gap-3 border-b border-slate-200 py-5 text-slate-700 transition-colors hover:bg-white sm:grid-cols-[30px_minmax(0,1fr)_auto_20px] sm:px-2">
                <i className={`grid size-7 place-items-center rounded text-[9px] font-bold not-italic ${isDraft ? "bg-slate-100 text-slate-500" : "bg-[#edf2ff] text-klarisa-secondary"}`}>{isDraft ? "D" : "R"}</i>
                <span className="grid gap-1">
                  <b className="text-xs">{item.title}</b>
                  <small className="text-[10px] text-slate-400">Diperbarui {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</small>
                </span>
                <em className={`hidden text-[9px] font-bold not-italic sm:block ${isDraft ? "text-klarisa-secondary" : "text-red-500"}`}>{isDraft ? `DRAFT ${String(item.metadata.version ?? 1).padStart(2, "0")}` : "REVIEW"}</em>
                <ArrowRight className="size-4 text-slate-500" />
              </Link>
            );
          })}
          {data.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Dokumen tidak ditemukan.</p>}
        </div>

        {data.length > PAGE_SIZE && (
          <nav aria-label="Navigasi halaman dokumen" className="flex items-center justify-between border-b border-slate-200 py-5">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
              <ArrowLeft className="size-3.5" />Sebelumnya
            </button>
            <span className="text-[10px] text-slate-500">Halaman <b className="text-slate-800">{currentPage}</b> dari {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
              Berikutnya<ArrowRight className="size-3.5" />
            </button>
          </nav>
        )}

        <footer className="mt-6 flex justify-end gap-2">
          <Link href="/dashboard/create" className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-xs font-bold">Buat draft</Link>
          <Link href="/dashboard/review" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white">Review kontrak<ArrowRight className="size-4" /></Link>
        </footer>
      </section>
    </div>
  );
}
