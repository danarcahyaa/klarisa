"use client";

import { ArrowRight, Check, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { createDraftAction } from "@/app/actions/draft.action";
import { cn } from "@/lib/utils";
import { draftCategories, type DraftCategoryId } from "@/lib/draft-options";
import { Button, SubmitButton } from "@/components/ui/button";

export function DraftOnboarding() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<DraftCategoryId | null>(null);
  const [subtype, setSubtype] = useState("");
  const [customSubtype, setCustomSubtype] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = draftCategories.find((item) => item.id === category);
  const finalSubtype = subtype === "Lainnya" ? customSubtype.trim() : subtype;

  useEffect(() => {
    if (!error) return;
    const timeoutId = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  const continueToSubtype = () => {
    if (!category) return;
    setError(null);
    setSubtype("");
    setCustomSubtype("");
    setStep(2);
  };

  const createOutline = () => {
    if (!category || !finalSubtype) return;

    setError(null);
    startTransition(async () => {
      const result = await createDraftAction({
        category,
        subtype: finalSubtype,
        title: `Draft ${finalSubtype}`,
      });
      if (!result.success || !result.data) {
        setError(result.error ?? "Kerangka draft gagal dibuat.");
        return;
      }

      router.push(`/dashboard/create?id=${result.data.id}`);
    });
  };

  return (
    <main className="mx-auto max-w-[1190px] px-4 py-8 sm:px-7 lg:py-10">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">BUAT KONTRAK</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="max-w-3xl font-heading text-[clamp(2.3rem,5vw,4.25rem)] font-normal leading-[.96] tracking-[-.055em]">
              Mulai dari kebutuhan kontrak Anda.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Pilih kategori dan jenis kontrak. Klarisa akan menyiapkan kerangka yang dapat Anda lengkapi di editor.
            </p>
          </div>
        </div>
      </header>

      <nav aria-label="Progres pembuatan kontrak" className="py-6">
        <ol className="relative flex justify-between before:absolute before:left-4 before:right-4 before:top-4 before:h-px before:bg-slate-200 before:content-[''] sm:before:left-5 sm:before:right-5 sm:before:top-5">
          {step === 2 && <span aria-hidden className="absolute left-4 right-4 top-4 h-px bg-klarisa-secondary sm:left-5 sm:right-5 sm:top-5" />}
          {[
            { number: 1, label: "Kategori kontrak", description: "Tentukan kebutuhan utama" },
            { number: 2, label: "Jenis kontrak", description: "Pilih bentuk dokumen" },
          ].map((item) => {
            const isActive = step === item.number;
            const isComplete = step > item.number;
            return (
              <li
                key={item.number}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative z-10 flex w-[46%] flex-col items-start",
                  item.number === 2 && "items-end text-right",
                )}
              >
                <button
                  type="button"
                  disabled={!isComplete}
                  onClick={() => setStep(item.number as 1 | 2)}
                  aria-label={isComplete ? `Kembali ke langkah ${item.label}` : item.label}
                  className={cn(
                    "relative z-10 grid size-8 place-items-center rounded-full border bg-[#f7f9fc] text-xs font-bold transition-colors sm:size-10",
                    isActive && "border-[#172031] bg-[#172031] text-white",
                    isComplete && "border-klarisa-secondary bg-klarisa-secondary text-white",
                    !isActive && !isComplete && "border-slate-300 text-slate-500",
                    isComplete && "cursor-pointer hover:bg-[#244bb7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-klarisa-secondary",
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : item.number}
                </button>
                <b className="mt-2 block text-xs font-semibold text-slate-800">{item.label}</b>
                <small className="mt-0.5 hidden text-xs text-slate-400 sm:block">{item.description}</small>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 1 ? (
        <section aria-labelledby="draft-category-title" className="pb-8">
          <h2 id="draft-category-title" className="text-xl font-semibold tracking-[-.03em]">Kontrak ini digunakan untuk apa?</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {draftCategories.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  "grid min-h-20 grid-cols-[36px_1fr_20px] items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-left transition duration-200 hover:border-klarisa-secondary/50 hover:bg-slate-50",
                  category === item.id && "border-klarisa-secondary bg-[#f5f7ff]",
                )}
              >
                <span className="grid size-9 place-items-center rounded bg-[#edf2ff] text-xs font-bold text-klarisa-secondary">0{index + 1}</span>
                <span>
                  <b className="block text-sm font-semibold text-slate-900">{item.label}</b>
                  <small className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</small>
                </span>
                {category === item.id && <Check className="mt-0.5 size-4 text-klarisa-secondary" />}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="default"
              size="default"
              disabled={!category}
              onClick={continueToSubtype}
            >
              Lanjutkan <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="draft-subtype-title" className="pb-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-[#edf2ff] text-klarisa-secondary"><FileText className="size-4" /></span>
            <div><p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">{selectedCategory?.label.toUpperCase()}</p><h2 id="draft-subtype-title" className="mt-1 text-xl font-semibold tracking-[-.03em]">Pilih jenis kontrak.</h2></div>
          </div>
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {selectedCategory?.subtypes.map((item) => (
              <label key={item} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-slate-200 px-5 last:border-0 hover:bg-slate-50">
                <input type="radio" name="draft-subtype" value={item} checked={subtype === item} onChange={() => setSubtype(item)} className="size-4 accent-[#2F5BD3]" />
                <span className="text-xs font-semibold text-slate-700">{item}</span>
              </label>
            ))}
          </div>
          {subtype === "Lainnya" && <label className="mt-4 grid gap-2 text-xs font-semibold text-slate-600">Jelaskan jenis kontrak<input autoFocus value={customSubtype} onChange={(event) => setCustomSubtype(event.target.value)} maxLength={120} placeholder="Contoh: Perjanjian pengelolaan acara" className="h-12 rounded-md border border-slate-200 bg-white px-4 text-xs font-normal outline-none focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10" /></label>}
          {error && <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"><span>{error}</span><Button type="button" variant="ghost" size="icon-xs" onClick={() => setError(null)} aria-label="Tutup pemberitahuan"><X className="size-4" /></Button></div>}
          <div className="mt-6 flex justify-end">
            <SubmitButton
              type="button"
              variant="default"
              size="default"
              disabled={!finalSubtype || isPending}
              isLoading={isPending}
              loadingText="Menyiapkan..."
              onClick={createOutline}
              rightIcon={<ArrowRight className="size-4" />}
            >
              Buka editor
            </SubmitButton>
          </div>
        </section>
      )}
    </main>
  );
}
