"use client";

import { useRef } from "react";
import { ArrowRight, FileText, ShieldCheck, Upload, AlertCircle, Sparkles } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { ReusableAlert } from "@/components/ui/reusable-alert";
import { useReview } from "@/hooks/useReview";

const steps = [
  ["01", "Membedah Dokumen", "Memisahkan kalimat per kalimat atau pasal demi pasal."],
  ["02", "Mencari Risiko & Menganalisa Aturan Hukum", "Mencari klausul yang berisiko dan mencocokkan klausul dokumen dengan Undang-Undang yang berlaku"],
  ["03", "Memberikan Rekomendasi Revisi", "AI akan memberikan rekomendasi revisi yang sesuai dengan hukum positif Indonesia."],
] as const;

export function ReviewUploader() {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    fileName,
    file, 
    isLoading,
    error,
    handleFileSelect,
    handleUpload,
    dismissError,
  } = useReview();

  const handleStartReview = async () => {
    await handleUpload();
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-7 lg:py-16">
      <section className="flex flex-col items-start justify-between gap-7 border-b border-slate-200 pb-9 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
            REVIEW KONTRAK
          </p>
          <h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.8rem,5vw,4.2rem)] font-normal leading-[.94] tracking-[-.06em]">
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
            disabled={isLoading}
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
            isLoading={isLoading}
            loadingText="Memproses..."
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

      {isLoading ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
          <DashboardSkeleton variant="document" />
        </div>
      ) : (
        <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid lg:grid-cols-[minmax(0,2.2fr)_400px]">
          <div>
            <header className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
              <FileText className="size-4" />
              <span className="grid gap-1">
                <small className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  {file ? "DOKUMEN TERPILIH" : "CONTOH DOKUMEN"}
                </small>
                <b className="text-xs font-semibold">
                  {fileName || "Kontrak_Kerja_Sama_Desain.docx"}
                </b>
              </span>
              <b className="ml-auto text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
                DOCX
              </b>
            </header>
            <article className="font-serif text-slate-800 p-7 sm:p-11">
              <div className="text-center">
                    <h2 className="text-base font-bold uppercase tracking-wide">
                      PERJANJIAN KERJA SAMA JASA DIGITAL
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
      )}
    </div>
  );
}

