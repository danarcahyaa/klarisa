"use client";

import { useEffect, useRef } from "react";

export type ContractDocumentProps = {
  htmlContent?: string | null;
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
};

export function ContractDocument({
  htmlContent,
  activeFinding,
  onSelectFinding,
}: ContractDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll("[data-finding-source]");
    marks.forEach((el) => {
      const source = el.getAttribute("data-finding-source");
      if (activeFinding && source === activeFinding) {
        el.classList.add("active-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.classList.remove("active-highlight");
      }
    });
  }, [activeFinding, htmlContent]);

  // Click delegation handler for highlighted clauses
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("[data-finding-source]");
    if (target) {
      const sourceId = target.getAttribute("data-finding-source");
      if (sourceId) {
        onSelectFinding?.(sourceId);
      }
    }
  };

  if (htmlContent) {
    return (
      <article className="docx-rendered-content w-full p-6 sm:p-10 lg:p-12 font-serif text-justify">
        <div
          ref={containerRef}
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>
    );
  }

  return (
    <article className="w-full px-5 py-9 text-[#202a3a] sm:px-10 lg:py-14">
      <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">DOKUMEN / 01</p>
      <h1 className="mt-5 font-heading text-2xl font-semibold leading-tight sm:text-3xl">
        SURAT PERJANJIAN KERJA<br className="hidden sm:block" /> SAMA JASA DIGITAL
      </h1>
      <p className="mt-4 text-sm leading-relaxed">
        Perjanjian ini dibuat antara PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.
      </p>
      <section className="mt-8">
        <h2 className="font-sans text-xs font-bold uppercase tracking-wide">PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN</h2>
        <p className="mt-4 pl-0 text-sm leading-relaxed sm:pl-5">
          PIHAK KEDUA bertanggung jawab menyelesaikan sistem informasi sesuai lampiran spesifikasi teknis.
        </p>
      </section>
    </article>
  );
}
