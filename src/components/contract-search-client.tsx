"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FilePen, FileSearch, Search } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractSearchItem, type SearchItem } from "./contract-search-item";
import { ContractSearchSkeleton } from "./contract-search-skeleton";
import { useSearch } from "@/hooks/useSearch";
import type { ContractSearchFilterType } from "@/types/contract-search.type";
import { Button } from "./ui/button";

export function ContractSearchClient({
  initialItems,
  items,
  initialTotalCount,
}: {
  initialItems?: ReadonlyArray<SearchItem>;
  items?: ReadonlyArray<SearchItem>;
  initialTotalCount?: number;
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
    totalCount,
    hasMore,
    isLoading,
    isLazyLoading,
    observerTargetRef,
    handlePin,
    handleRename,
    handleDelete,
  } = useSearch({
    initialItems: initialList,
    initialTotalCount: initialTotalCount ?? initialList.length,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      router.push("/dashboard/review");
    }
  };

  return (
    <div className="mx-auto max-w-[1010px] px-8 pb-8 sm:px-7 lg:pb-12">
      {/* Sticky Header Section: Title, Filters, Search & Counter */}
      <div className="sticky top-14 lg:top-0 z-20 bg-[#f7f8fb] pt-4 sm:pt-6 lg:pt-12">
        <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase hidden lg:block">
            Cari Kontrak
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-.04em] sm:text-3xl">
            Temukan Kontrak Anda
        </h1>

        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Top Controls Bar: Filter on the left, Search input in the middle, Action buttons on the right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Select
              value={filter}
              defaultValue="Semua"
              onValueChange={(val) => setFilter(val as ContractSearchFilterType)}
            >
              <SelectTrigger variant="outline" className="w-[95px] sm:w-[120px] shrink-0">
                <SelectValue placeholder="Semua">{filter}</SelectValue>
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
              leftIcon={<Search className="size-4 text-klarisa-navy" />}
              containerClassName="flex-1 space-y-0 min-w-0"
              inputClassName="bg-white"
            />

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                asChild
                variant="outline"
                className="size-11 p-0 sm:h-11 sm:w-auto sm:px-4 shrink-0"
                title="Buat draft"
                aria-label="Buat draft"
              >
                <Link href="/dashboard/create">
                  <FilePen className="size-4" />
                  <span className="hidden sm:inline">Buat draft</span>
                </Link>
              </Button>

              <Button
                asChild
                className="size-11 p-0 sm:h-11 sm:w-auto sm:px-4 shrink-0"
                title="Review kontrak"
                aria-label="Review kontrak"
              >
                <Link href="/dashboard/review">
                  <FileSearch className="size-4" />
                  <span className="hidden sm:inline">Review kontrak</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Counter Bar */}
          <div className="flex px-1 items-center justify-between border-b border-slate-200 py-4 mt-2">
            <span className="text-xs text-slate-500">
              Menampilkan{" "}
              <b className="text-slate-700">
                {searchResults.length}
              </b>{" "}
              dari <b className="text-slate-700">{totalCount}</b> kontrak
            </span>
          </div>
        </div>
      </div>

      <section className="mt-2">
        {/* Document List */}
        <div className="px-1">
          {isLoading ? (
            <ContractSearchSkeleton count={5} />
          ) : (
            <>
              {visibleItems.map((item) => (
                <ContractSearchItem
                  key={item.id}
                  item={item}
                  onPin={handlePin}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}

              {searchResults.length === 0 && (
                <p className="py-12 text-center text-sm text-slate-500">
                  Kontrak tidak ditemukan.
                </p>
              )}
            </>
          )}
        </div>

        {/* Infinite Scroll Sentinel & Skeleton Loader */}
        {hasMore && !isLoading && (
          <div
            ref={observerTargetRef}
            className="w-full py-4 min-h-[32px] flex items-center justify-center"
            aria-hidden="true"
          >
            {isLazyLoading && <ContractSearchSkeleton count={2} />}
          </div>
        )}
      </section>
    </div>
  );
}
