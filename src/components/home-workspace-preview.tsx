"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const findings = [
  {
    clause: "Pasal 02",
    title: "Pembayaran menunggu pihak ketiga.",
    source:
      "Pembayaran baru diterima setelah pihak lain menerima pembayaran dari klien utama.",
    note: "Pembayaran Anda bergantung pada proses yang tidak Anda kendalikan dan belum memiliki batas waktu.",
  },
  {
    clause: "Pasal 03",
    title: "Hak karya perlu memiliki batas yang jelas.",
    source:
      "Hak atas hasil pekerjaan berpindah seluruhnya kepada pihak pertama setelah pekerjaan diserahkan.",
    note: "Ruang lingkup hak yang berpindah perlu dijelaskan agar kedua pihak memahami batas penggunaannya.",
  },
];

export function HomeWorkspacePreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFinding = findings[activeIndex];

  return (
    <div
      className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgb(15_23_42_/_5%)] lg:grid-cols-[1.2fr_.8fr_.42fr]"
      aria-label="Contoh workspace Klarisa"
    >
      <div className="min-h-89">
        <div className="flex min-h-13 items-center justify-between border-b border-slate-200 px-6 text-[10px] font-bold tracking-[.12em] text-klarisa-secondary">
          <span>REVIEW KONTRAK</span>
          <b className="text-[10px] tracking-normal text-slate-500">
            3 bagian perlu diperiksa
          </b>
        </div>
        <div className="p-7">
          <p className="text-[10px] font-bold tracking-[.15em] text-klarisa-secondary">
            DOKUMEN / 01
          </p>
          <h3 className="mt-4 text-2xl font-semibold leading-tight">
            Perjanjian Kerja Sama Jasa Digital
          </h3>
          <p className="mt-6 text-sm leading-6 text-slate-600">
            {activeFinding.clause}: {activeFinding.title}
          </p>
          <p className="mt-3 border-l-[3px] border-red-500 bg-rose-50 p-3 text-sm leading-6">
            {activeFinding.source}
          </p>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            {activeFinding.note}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 lg:border-t-0 lg:border-l">
        <div className="flex min-h-13 items-center border-b border-slate-200 px-6 text-[10px] font-bold tracking-[.12em] text-klarisa-secondary">
          TEMUAN DALAM KONTEKS
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold">
            Bagian yang perlu Anda pahami.
          </h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Pilih temuan untuk melihat penjelasan dan bagian dokumennya.
          </p>
          {findings.map((finding, index) => (
            <button
              className={
                "mt-3 grid min-h-16 w-full grid-cols-[3.8rem_1fr_1rem] items-center gap-2 border-t border-slate-200 px-2 py-3 text-left transition hover:translate-x-0.5 hover:bg-indigo-50 " +
                (index === activeIndex
                  ? "border-l-2 border-l-klarisa-secondary bg-indigo-50 pl-3"
                  : "")
              }
              type="button"
              onClick={() => setActiveIndex(index)}
              key={finding.clause}
            >
              <span className="text-[10px] leading-4 text-slate-400">
                {finding.clause}
              </span>
              <b className="text-xs leading-5 font-semibold text-slate-900">
                {finding.title}
              </b>
              <ArrowRight className="size-3.5 text-slate-700" />
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-t-0 lg:border-l">
        <p className="text-[10px] font-bold tracking-[.15em] text-klarisa-secondary">
          DISKUSI DOKUMEN
        </p>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Tanyakan isi pasal atau diskusikan dengan pihak terkait.
        </p>
        <div className="mt-5 rounded-lg border border-blue-100 bg-white p-3.5">
          <div className="flex items-center gap-2">
            <Image
              src="/klarisa/logo-ai.png"
              alt="Klarisa AI"
              width={24}
              height={24}
              className="size-6 object-contain"
            />
            <b className="text-[10px] text-slate-900">Klarisa AI</b>
            <Image
              src="/klarisa/ai.png"
              alt=""
              aria-hidden
              width={12}
              height={12}
              className="ml-auto size-3 object-contain"
            />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">
            Penjelasan dibuat dari bagian kontrak yang dipilih.
          </p>
        </div>
        <div className="mt-3 grid min-h-26 grid-rows-[1fr_auto] rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-400">
          <span>Tulis pertanyaan Anda...</span>
          <button
            className="grid size-8 place-items-center justify-self-end rounded-full bg-slate-900 text-white transition hover:bg-klarisa-secondary"
            type="button"
            aria-label="Kirim pertanyaan"
          >
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
