"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractSearchItem, type SearchItem } from "./contract-search-item";
import { useSearch } from "@/hooks/useSearch";
import type { ContractSearchFilterType } from "@/types/contract-search.type";

export function ContractSearchClient({
  initialItems,
  items,
}: {
  initialItems?: ReadonlyArray<SearchItem>;
  items?: ReadonlyArray<SearchItem>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialList = initialItems ?? items ?? [];
  const {
    query,
    setQuery,
    filter,
    setFilter,
    visibleItems,
    items: searchResults,
    visibleCount,
    hasMore,
    isLoading,
    observerTargetRef,
    handlePin,
    handleRename,
    handleDelete,
  } = useSearch({ initialItems: initialList });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      router.push("/dashboard/review");
    }
  };

  return (
    <div className="mx-auto max-w-[1010px] px-4 py-8 sm:px-7 lg:py-12">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
          WORKSPACE DOKUMEN
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-.04em] sm:text-3xl">
          Pencarian Dokumen Kontrak.
        </h1>
      </header>

      <section className="mt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Top Controls Bar: Filter on the left, Search input in the middle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={filter}
            onValueChange={(val) => setFilter(val as ContractSearchFilterType)}
          >
            <SelectTrigger variant="outline" className="w-full sm:w-[120px] shrink-0">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
            </SelectContent>
          </Select>

          <FormInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari review atau draft..."
            leftIcon={<Search className="size-4 text-klarisa-secondary" />}
            containerClassName="flex-1 space-y-0"
            inputClassName="bg-white"
          />
        </div>

        {/* Counter Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 py-4 mt-2">
          <span className="text-xs text-slate-500">
            Menampilkan{" "}
            <b className="text-slate-700">
              {Math.min(visibleCount, searchResults.length)}
            </b>{" "}
            dari <b className="text-slate-700">{searchResults.length}</b> kontrak
          </span>
        </div>

        {/* Document List */}
        <div>
          {visibleItems.map((item) => (
            <ContractSearchItem
              key={item.id}
              item={item}
              onPin={handlePin}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
          {!isLoading && searchResults.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              Dokumen tidak ditemukan.
            </p>
          )}
        </div>

        {/* Lazy Pagination Trigger & Loader */}
        {(hasMore || isLoading) && (
          <div ref={observerTargetRef} className="flex justify-center py-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="size-4 animate-spin text-klarisa-secondary" />
              <span>Memuat dokumen lainnya...</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
