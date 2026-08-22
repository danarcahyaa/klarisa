"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, ShieldCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

const steps = [
  ["01", "Validasi dokumen", "Struktur dasar perjanjian diperiksa terlebih dahulu."],
  ["02", "Temukan bagian penting", "Kalimat sumber tetap terlihat saat Anda membuka temuan."],
  ["03", "Bahas pilihan revisi", "Konteks hukum dan redaksi alternatif tersedia pada pasal terkait."],
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
  return <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-7 lg:py-16">
    <section className="flex flex-col items-start justify-between gap-7 border-b border-slate-200 pb-9 lg:flex-row lg:items-end">
      <div><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">REVIEW KONTRAK</p><h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.8rem,5vw,4.2rem)] font-normal leading-[.94] tracking-[-.06em]">Baca posisi Anda sebelum menyetujui.</h1><p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">Unggah DOCX untuk menemukan bagian yang perlu Anda pahami, perjelas, atau diskusikan dengan pihak terkait.</p></div>
      <div className="flex w-full gap-2 sm:w-auto"><input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={event=>setFileName(event.target.files?.[0]?.name??fileName)}/><button type="button" onClick={()=>inputRef.current?.click()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold"><Upload className="size-4"/>Pilih DOCX</button><button type="button" onClick={startReview} disabled={isStarting} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white disabled:opacity-60">{isStarting?"Memeriksa...":"Mulai review"}<ArrowRight className="size-4"/></button></div>
    </section>
    {isStarting ? <div className="mt-8 overflow-hidden rounded-lg border border-slate-200"><DashboardSkeleton variant="document"/></div> : <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid lg:grid-cols-[minmax(0,2.2fr)_330px]">
      <div><header className="flex items-center gap-3 border-b border-slate-200 px-6 py-5"><FileText className="size-4"/><span className="grid gap-1"><small className="text-[8px] tracking-widest text-slate-400">CONTOH DOKUMEN</small><b className="text-[10px]">{fileName}</b></span><b className="ml-auto text-[8px] tracking-widest text-klarisa-secondary">DOCX</b></header><article className="p-7 sm:p-12"><p className="text-[8px] font-bold tracking-[.18em] text-klarisa-secondary">TEKS DIBACA DALAM KONTEKS PASAL</p><h2 className="mt-8 font-sans text-xl font-bold">PERJANJIAN KERJA SAMA</h2><p className="mt-4 text-xs leading-6 text-slate-600">Perjanjian ini dibuat antara PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.</p><h3 className="mt-8 text-[11px] font-bold">PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN</h3><p className="mt-4 text-xs text-slate-600">PIHAK KEDUA menyelesaikan pekerjaan sesuai lampiran spesifikasi teknis.</p><blockquote className="mt-5 border-l-2 border-klarisa-secondary bg-red-50 p-4 text-xs leading-5 text-slate-600">Pekerjaan tambahan, biaya, dan perubahan jadwal perlu disetujui tertulis oleh kedua pihak.</blockquote><h3 className="mt-8 text-[11px] font-bold">PASAL 2: PEMBAYARAN DAN PENCAIRAN</h3><p className="mt-4 text-xs text-slate-600">Total nilai imbalan dibayarkan sesuai termin yang disepakati dalam perjanjian.</p></article></div>
      <aside className="border-t border-slate-200 bg-[#f6f8fc] p-7 lg:border-t-0 lg:border-l"><p className="text-[8px] font-bold tracking-[.18em] text-klarisa-secondary">ALUR REVIEW</p><div className="mt-5">{steps.map(([number,title,description])=><article key={number} className="grid grid-cols-[28px_1fr] gap-3 border-b border-slate-200 py-5 first:pt-0"><span className="grid size-7 place-items-center rounded-full bg-white text-[9px] font-bold text-klarisa-secondary">{number}</span><span className="grid gap-2"><b className="text-xs">{title}</b><small className="text-[10px] leading-4 text-slate-500">{description}</small></span></article>)}</div><p className="mt-6 flex gap-3 text-[9px] leading-4 text-slate-500"><ShieldCheck className="size-5 shrink-0 text-klarisa-secondary"/>File asli tidak dijadikan arsip setelah diproses untuk analisis.</p></aside>
    </section>}
    <footer className="mt-6 flex flex-wrap justify-center gap-7 text-[8px] font-bold tracking-[.18em] text-slate-400"><span className="inline-flex items-center gap-1"><Check className="size-3"/>DOCX SAJA</span><span>TEKS TERHUBUNG KE PASAL</span><span>KEPUTUSAN TETAP PADA PARA PIHAK</span></footer>
  </div>;
}
