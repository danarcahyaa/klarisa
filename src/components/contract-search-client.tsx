"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 5;

type SearchItem = {
  id: string;
  type: "draft" | "review";
  title: string;
  updatedAt: string;
  riskCount: number;
  metadata: {
    comments?: number;
    version?: number;
  };
};

export function ContractSearchClient({ initialItems, items }: { initialItems?: ReadonlyArray<SearchItem>; items?: ReadonlyArray<SearchItem> }) {
  const dataList = initialItems ?? items ?? [];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Draft" | "Review">("Semua");
  const [page, setPage] = useState(1);

  const data = useMemo(() => {
    return dataList.filter((item) => {
      const matchQuery = item.title.toLowerCase().includes(query.toLowerCase().trim());
      const matchFilter =
        filter === "Semua" ? true : filter === "Draft" ? item.type === "draft" : item.type === "review";
      return matchQuery && matchFilter;
    });
  }, [dataList, query, filter]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1190px] px-4 py-8 sm:px-7 lg:py-12">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">WORKSPACE DOKUMEN</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Pencarian dokumen.</h1>
      </header>

      <section className="mt-6">
        <label className="relative block">
          <input
            type="search"
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
            <Button
              key={item}
              type="button"
              variant={filter === item ? "default" : "outline"}
              size="xs"
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
            >
              {item}
            </Button>
          ))}
          <span className="ml-auto text-xs text-slate-400">Total {data.length}</span>
        </div>

        <div>
          {visibleItems.map((item) => {
            const isDraft = item.type === "draft";
            const href = isDraft ? `/dashboard/create?id=${item.id}` : "/dashboard/review/result";
            return (
              <Link href={href} key={item.id} className="grid grid-cols-[30px_minmax(0,1fr)_20px] items-center gap-3 border-b border-slate-200 py-5 text-slate-700 transition-colors hover:bg-white sm:grid-cols-[30px_minmax(0,1fr)_auto_20px] sm:px-2">
                <i className={`grid size-7 place-items-center rounded text-xs font-bold not-italic ${isDraft ? "bg-slate-100 text-slate-500" : "bg-[#edf2ff] text-klarisa-secondary"}`}>{isDraft ? "D" : "R"}</i>
                <span className="grid gap-1">
                  <b className="text-xs font-semibold">{item.title}</b>
                  <small className="text-xs text-slate-400">Diperbarui {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</small>
                </span>
                <em className={`hidden text-xs font-semibold not-italic sm:block ${isDraft ? "text-klarisa-secondary" : "text-red-500"}`}>{isDraft ? `DRAFT ${String(item.metadata.version ?? 1).padStart(2, "0")}` : "REVIEW"}</em>
                <ArrowRight className="size-4 text-slate-500" />
              </Link>
            );
          })}
          {data.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Dokumen tidak ditemukan.</p>}
        </div>

        {data.length > PAGE_SIZE && (
          <nav aria-label="Navigasi halaman dokumen" className="flex items-center justify-between border-b border-slate-200 py-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ArrowLeft className="size-3.5" />Sebelumnya
            </Button>
            <span className="text-xs text-slate-500">Halaman <b className="text-slate-800">{currentPage}</b> dari {totalPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Berikutnya<ArrowRight className="size-3.5" />
            </Button>
          </nav>
        )}

        <footer className="mt-6 flex justify-end gap-2">
          <Link href="/dashboard/create" className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#172031] px-4 text-xs font-bold text-white transition-colors hover:bg-klarisa-secondary">
            Buat draft baru
          </Link>
        </footer>
      </section>
    </div>
  );
}
