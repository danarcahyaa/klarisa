"use client";

import { useRef } from "react";
import { ArrowRight, ShieldCheck, Upload } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { ReusableAlert } from "@/components/ui/reusable-alert";
import { useReview } from "@/hooks/useReview";
import { ArticlesMatchingMarker } from "./articles-matching-marker";
import { ReasoningMarker } from "./reasoning-marker";
import { RedirectingMarker } from "./redirecting-marker";
import { cn } from "@/lib/utils";

const steps = [
  ["01", "Membedah Dokumen", "Memisahkan kalimat per kalimat atau pasal demi pasal."],
  ["02", "Mencari Risiko & Menganalisa Aturan Hukum", "Mencari klausul yang berisiko dan mencocokkan klausul dokumen dengan Undang-Undang yang berlaku"],
  ["03", "Memberikan Rekomendasi Revisi", "AI akan memberikan rekomendasi revisi yang sesuai dengan hukum positif Indonesia."],
] as const;

export function ReviewUploader() {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    fileName,
    isLoading,
    isSuccess,
    error,
    matchedRegulations,
    reasoningChunks,
    activeBatchIndex,
    reviewStep,
    handleFileSelect,
    handleUpload,
    dismissError,
  } = useReview();

  const isReviewing = isLoading || isSuccess || reviewStep !== "idle";

  const handleStartReview = async () => {
    await handleUpload();
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-7 lg:py-16">
      <section className="flex flex-col items-start justify-between gap-7 border-b border-slate-200 pb-9 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase hidden lg:block max-lg:!hidden">
            REVIEW KONTRAK
          </p>
          <h1 className="mt-2 lg:mt-5 max-w-2xl font-heading text-[clamp(2.8rem,5vw,4.2rem)] font-normal leading-[.94] tracking-[-.06em]">
            Pahami setiap klausul kontrak
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
            Unggah dokumen kontrak Anda untuk analisis instan. Sistem akan mengidentifikasi klausul-klausul krusial, menyoroti potensi risiko, dan memberikan rekomendasi revisi yang sesuai dengan hukum.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 min-[420px]:flex-row sm:w-auto">
          <input
            ref={inputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              handleFileSelect(selectedFile);
            }}
          />
          <Button
            disabled={isReviewing}
            type="button"
            variant="outline"
            size="default"
            onClick={() => inputRef.current?.click()}
            className="w-32 justify-center"
          >
            <Upload className="size-4 shrink-0" />
            <span className="truncate" title={fileName ?? "Pilih DOCX"}>
              {fileName ? fileName : "Pilih DOCX"}
            </span>
          </Button>
          <SubmitButton
            type="button"
            variant="default"
            disabled={isReviewing}
            isLoading={isReviewing}
            loadingText={reviewStep === "redirecting" ? "Mengalihkan..." : "Memproses..."}
            onClick={handleStartReview}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Mulai review
          </SubmitButton>
        </div>
      </section>

      {error && (
        <div className="mt-4">
          <ReusableAlert
            variant="destructive"
            dismissible
            onDismiss={dismissError}
            title="Terjadi Kesalahan"
            description={error}
          />
        </div>
      )}

      {/* 1. Document Preview & Alur Review Section (Smoothly collapses on review start) */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin] duration-700 ease-in-out",
          isReviewing
            ? "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
            : "grid-rows-[1fr] opacity-100 mt-8"
        )}
      >
        <div className="overflow-hidden">
          <section className="rounded-lg border border-slate-200 bg-white lg:grid lg:grid-cols-[minmax(0,2.2fr)_400px]">
            <div>
              <article className="font-serif text-slate-800 p-7 sm:p-11">
                <div className="text-center">
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    PERJANJIAN KERJA SAMA JASA
                  </h2>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600">
                  Perjanjian ini dibuat dan ditandatangani oleh PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.
                </p>

                <h3 className="font-serif mt-6 text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                  PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  1. PIHAK KEDUA menyelesaikan pekerjaan pembuatan sistem informasi sesuai lampiran spesifikasi teknis.
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  2.{" "}
                  <span className="clause-issue font-serif text-sm">
                    Pekerjaan tambahan, biaya, dan perubahan jadwal wajib disetujui secara tertulis oleh kedua belah pihak.
                  </span>
                </p>

                <h3 className="font-serif mt-6 text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                  PASAL 2: PEMBAYARAN DAN PENCAIRAN
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  1. Total imbalan jasa yang disepakati adalah sebesar Rp20.000.000,- (Dua Puluh Juta Rupiah).
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  2.{" "}
                  <span className="clause-issue font-serif text-sm">
                    Pelunasan sisa 70% hanya dicairkan setelah PIHAK PERTAMA menerima pembayaran penuh dari klien utama.
                  </span>
                </p>

                <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  PASAL 3: HAK KEKAYAAN INTELEKTUAL
                </h3>
                <p className="mt-3 text-sm leading-relaxed">
                  1.{" "}
                  <span className="clause-issue font-serif text-sm">
                    Hak cipta dan seluruh hak ekonomi beralih sepenuhnya kepada PIHAK PERTAMA setelah seluruh pembayaran dilunasi.
                  </span>
                </p>
              </article>
            </div>
            <aside className="border-t border-slate-200 bg-[#f6f8fc] p-7 lg:border-t-0 lg:border-l">
              <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
                ALUR REVIEW
              </p>
              <div className="mt-5">
                {steps.map(([number, title, description]) => (
                  <article
                    key={number}
                    className="grid grid-cols-[28px_1fr] gap-3 border-b border-slate-200 py-5 first:pt-0"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-bold text-klarisa-secondary">
                      {number}
                    </span>
                    <span className="grid gap-2">
                      <b className="text-xs font-semibold">{title}</b>
                      <small className="text-xs leading-5 text-slate-500">
                        {description}
                      </small>
                    </span>
                  </article>
                ))}
              </div>
              <p className="mt-6 flex gap-3 text-xs leading-5 text-slate-500">
                <ShieldCheck className="size-5 shrink-0 text-klarisa-secondary" />
                File dokumen Anda tidak disimpan. Hanya teks kontrak yang diproses dan dienkripsi secara aman.
              </p>
            </aside>
          </section>
        </div>
      </div>

      {/* 2. Review Progress Markers Section (Smoothly expands on review start) */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin,transform] duration-700 ease-out",
          isReviewing
            ? "grid-rows-[1fr] opacity-100 mt-8 delay-200 translate-y-0"
            : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0 -translate-y-2"
        )}
      >
        <div className="overflow-hidden space-y-3">
          <ArticlesMatchingMarker
            status={reviewStep === "matching" ? "processing" : "completed"}
            regulations={matchedRegulations}
          />
          {(reviewStep === "reasoning" || reviewStep === "redirecting" || reviewStep === "completed") && (
            <ReasoningMarker
              status={reviewStep === "reasoning" ? "processing" : "completed"}
              chunks={reasoningChunks}
              activeBatchIndex={activeBatchIndex}
            />
          )}
          {(reviewStep === "redirecting" || reviewStep === "completed") && (
            <RedirectingMarker
              status={reviewStep === "redirecting" ? "processing" : "completed"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

