"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, ShieldCheck, Upload } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

const steps = [
  ["01", "Membedah Dokumen", "Memisahkan kalimat per kalimat atau pasal demi pasal."],
  ["02", "Mencari Risiko & Menganalisa Aturan Hukum", "Mencari klausul yang berisiko dan mencocokkan klausul dokumen dengan Undang-Undang yang berlaku"],
  ["03", "Memberikan Rekomendasi Revisi", "AI akan memberikan rekomendasi revisi yang sesuai dengan hukum positif Indonesia."],
] as const;

export function ReviewUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [fileName, setFileName] = useState("Kontrak_Kerja_Sama_Desain.docx");
  const [isStarting, setIsStarting] = useState(false);

  const startReview = () => {
    setIsStarting(true);
    window.setTimeout(() => router.push("/dashboard/review/result"), 550);
  };

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-7 lg:py-16">
      <section className="flex flex-col items-start justify-between gap-7 border-b border-slate-200 pb-9 lg:flex-row lg:items-end">
        <div>
          <p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">
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
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? fileName)
            }
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => inputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="size-4" />
            {fileName !== "Kontrak_Kerja_Sama_Desain.docx" ? fileName : "Pilih DOCX"}
          </Button>
          <SubmitButton
            type="button"
            variant="default"
            size="default"
            isLoading={isStarting}
            loadingText="Memeriksa..."
            onClick={startReview}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Mulai review
          </SubmitButton>
        </div>
      </section>

      {isStarting ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
          <DashboardSkeleton variant="document" />
        </div>
      ) : (
        <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid lg:grid-cols-[minmax(0,2.2fr)_330px]">
          <div>
            <header className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
              <FileText className="size-4" />
              <span className="grid gap-1">
                <small className="text-[8px] tracking-widest text-slate-400">
                  CONTOH DOKUMEN
                </small>
                <b className="text-xs">{fileName}</b>
              </span>
              <b className="ml-auto text-[8px] tracking-widest text-klarisa-secondary">
                DOCX
              </b>
            </header>
            <article className="font-serif text-slate-800 p-7 sm:p-11">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  PERJANJIAN KERJA SAMA JASA DIGITAL
                </h2>
              </div>

              <p className="mt-5 text-xs leading-6 text-slate-600">
                Perjanjian ini dibuat dan ditandatangani oleh PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.
              </p>

              <h3 className="font-serif mt-6 text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN
              </h3>
              <p className="mt-3 text-xs leading-6 text-slate-600">
                1. PIHAK KEDUA menyelesaikan pekerjaan pembuatan sistem informasi sesuai lampiran spesifikasi teknis.
              </p>
              <p className="mt-2 text-xs leading-6">
                2.{" "}
                <span className="clause-issue font-serif text-xs">
                  Pekerjaan tambahan, biaya, dan perubahan jadwal wajib disetujui secara tertulis oleh kedua belah pihak.
                </span>
              </p>

              <h3 className="font-serif mt-6 text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                PASAL 2: PEMBAYARAN DAN PENCAIRAN
              </h3>
              <p className="mt-3 text-xs leading-6 text-slate-600">
                1. Total imbalan jasa yang disepakati adalah sebesar Rp20.000.000,- (Dua Puluh Juta Rupiah).
              </p>
              <p className="mt-2 text-xs leading-6">
                2.{" "}
                <span className="clause-issue font-serif text-xs">
                  Pelunasan sisa 70% hanya dicairkan setelah PIHAK PERTAMA menerima pembayaran penuh dari klien utama.
                </span>
              </p>

              <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                PASAL 3: HAK KEKAYAAN INTELEKTUAL
              </h3>
              <p className="mt-3 text-xs leading-6">
                1.{" "}
                <span className="clause-issue font-serif text-xs">
                  Hak cipta dan seluruh hak ekonomi beralih sepenuhnya kepada PIHAK PERTAMA setelah seluruh pembayaran dilunasi.
                </span>
              </p>
            </article>
          </div>
          <aside className="border-t border-slate-200 bg-[#f6f8fc] p-7 lg:border-t-0 lg:border-l">
            <p className="text-[8px] font-bold tracking-[.18em] text-klarisa-secondary">
              ALUR REVIEW
            </p>
            <div className="mt-5">
              {steps.map(([number, title, description]) => (
                <article
                  key={number}
                  className="grid grid-cols-[28px_1fr] gap-3 border-b border-slate-200 py-5 first:pt-0"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-white text-[9px] font-bold text-klarisa-secondary">
                    {number}
                  </span>
                  <span className="grid gap-2">
                    <b className="text-xs">{title}</b>
                    <small className="text-[10px] leading-4 text-slate-500">
                      {description}
                    </small>
                  </span>
                </article>
              ))}
            </div>
            <p className="mt-6 flex gap-3 text-[9px] leading-4 text-slate-500">
              <ShieldCheck className="size-5 shrink-0 text-klarisa-secondary" />
              File asli tidak dijadikan arsip setelah diproses untuk analisis.
            </p>
          </aside>
        </section>
      )}

      <footer className="mt-6 flex flex-wrap justify-center gap-7 text-[8px] font-bold tracking-[.18em] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Check className="size-3" />
          DOCX SAJA
        </span>
        <span>TEKS TERHUBUNG KE PASAL</span>
        <span>KEPUTUSAN TETAP PADA PARA PIHAK</span>
      </footer>
    </div>
  );
}
