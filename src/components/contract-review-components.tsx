"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, Scale, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, SubmitButton } from "@/components/ui/button";

export type FindingId = "scope" | "payment" | "rights";

export const findings: ReadonlyArray<{ id: FindingId; pasal: string; title: string }> = [
  { id: "scope", pasal: "Pasal 01", title: "Batas perubahan belum ditulis." },
  { id: "payment", pasal: "Pasal 02", title: "Pembayaran menunggu pihak ketiga." },
  { id: "rights", pasal: "Pasal 03", title: "Pengalihan hak karya perlu batas." },
];

export function DocumentHeader({ status = "3 bagian perlu ditinjau" }: { status?: string }) {
  return <header className="flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-7"><FileText className="size-4 text-slate-600"/><span className="grid gap-1"><b className="text-xs">Surat Perjanjian Kerja Sama Jasa Digital</b><small className="text-[9px] text-slate-400">10 September 2026 · teks hasil parsing</small></span><span className="ml-auto hidden text-[10px] text-slate-500 sm:block">{status}</span></header>;
}

type ContractDocumentProps = {
  activeFinding?: FindingId;
  onSelectFinding?: (finding: FindingId) => void;
};

function SourceSentence({ id, activeFinding, onSelectFinding, children, strong = false }: ContractDocumentProps & { id: FindingId; children: React.ReactNode; strong?: boolean }) {
  const active = activeFinding === id;
  return <button type="button" data-finding-source={id} aria-pressed={active} onClick={() => onSelectFinding?.(id)} className={cn("mt-3 ml-0 block w-fit rounded border border-transparent bg-red-50 px-1 text-left text-sm leading-6 text-red-700 transition-[border-color,box-shadow,background-color] hover:border-klarisa-secondary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klarisa-secondary/40 sm:ml-5", strong && "font-semibold", active && "border-klarisa-secondary/30 ring-2 ring-klarisa-secondary/25")}><span className="sr-only">{active ? "Temuan aktif: " : "Pilih temuan: "}</span>{children}</button>;
}

export function ContractDocument({ activeFinding, onSelectFinding }: ContractDocumentProps) {
  return <article className="mx-auto w-full max-w-[620px] px-5 py-9 text-[#202a3a] sm:px-10 lg:py-14">
    <p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">DOKUMEN / 01</p>
    <h1 className="mt-5 font-heading text-2xl font-semibold leading-tight sm:text-3xl">SURAT PERJANJIAN KERJA<br className="hidden sm:block"/> SAMA JASA DIGITAL</h1>
    <p className="mt-4 text-sm leading-6">Perjanjian ini dibuat antara PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.</p>
    <section className="mt-8"><h2 className="font-sans text-xs font-bold">PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN</h2><p className="mt-4 pl-0 text-sm leading-7 sm:pl-5">PIHAK KEDUA bertanggung jawab menyelesaikan sistem informasi sesuai lampiran spesifikasi teknis.</p><SourceSentence id="scope" activeFinding={activeFinding} onSelectFinding={onSelectFinding}>PIHAK KEDUA bertanggung jawab menyelesaikan pekerjaan sesuai lampiran spesifikasi teknis.</SourceSentence></section>
    <section className="mt-8"><h2 className="font-sans text-xs font-bold">PASAL 2: PEMBAYARAN DAN PENCAIRAN</h2><p className="mt-4 pl-0 text-sm leading-7 sm:pl-5">Total nilai imbalan jasa yang disepakati adalah sebesar Rp20.000.000.</p><SourceSentence id="payment" activeFinding={activeFinding} onSelectFinding={onSelectFinding} strong>Pelunasan biaya honorarium (70%) hanya akan dicairkan kepada PIHAK KEDUA apabila PIHAK PERTAMA telah menerima pembayaran penuh dari klien utama PIHAK PERTAMA.</SourceSentence></section>
    <section className="mt-8"><h2 className="font-sans text-xs font-bold">PASAL 3: HAK KEKAYAAN INTELEKTUAL</h2><SourceSentence id="rights" activeFinding={activeFinding} onSelectFinding={onSelectFinding}>Hak ekonomi atas hasil pekerjaan beralih kepada PIHAK PERTAMA setelah seluruh nilai pekerjaan diterima oleh PIHAK KEDUA.</SourceSentence></section>
  </article>;
}

type FindingListProps = {
  detailed?: boolean;
  activeFinding?: FindingId;
  onSelectFinding?: (finding: FindingId) => void;
};

export function FindingList({ detailed = false, activeFinding = "payment", onSelectFinding }: FindingListProps) {
  if (detailed) return <section className="bg-white">
    <header className="border-b border-slate-200 p-6"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">CATATAN UNTUK PASAL 02</p><h2 className="mt-4 font-heading text-2xl font-semibold leading-none tracking-[-.03em]">Pembayaran menunggu pihak ketiga.</h2><p className="mt-4 text-xs leading-5 text-slate-500">Hak pembayaran PIHAK KEDUA bergantung pada pihak di luar perjanjian dan belum memiliki batas waktu yang pasti.</p></header>
    <div className="grid gap-4 p-6">
      <article className="border border-blue-100 border-l-2 border-l-klarisa-secondary p-4"><div className="flex items-center gap-2"><Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={20} height={20} className="size-5 object-contain"/><b className="text-xs">Analisis Klarisa</b></div><p className="mt-3 text-[11px] text-slate-500">Catatan dibuat dari kalimat yang dipilih pada pasal ini.</p><Button variant="link" size="xs" type="button" onClick={() => document.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-4 h-auto p-0 font-bold text-klarisa-secondary">Lihat kalimat sumber<ArrowRight className="size-3"/></Button></article>
      <article className="border border-red-100 border-l-2 border-l-orange-500 p-4"><div className="flex items-center gap-2"><Scale className="size-4 text-orange-500"/><b className="text-xs">Konteks hukum</b></div><p className="mt-3 text-[11px] leading-5 text-slate-600"><b>KUHPerdata Pasal 1338 ayat (3)</b> digunakan sebagai konteks, bukan putusan pelanggaran.</p><Button variant="link" size="xs" type="button" className="mt-4 h-auto p-0 font-bold text-klarisa-secondary">Lihat pertimbangan<ArrowRight className="size-3"/></Button></article>
      <article className="border border-blue-100 border-l-2 border-l-klarisa-secondary p-4"><p className="text-[9px] font-bold tracking-[.16em] text-klarisa-secondary">✦ REKOMENDASI REDAKSI</p><p className="mt-4 text-xs leading-6 text-slate-600">Pelunasan dilakukan maksimal 14 hari kerja setelah hasil diterima tertulis oleh PIHAK PERTAMA, terlepas dari pembayaran klien utama.</p></article>
    </div>
  </section>;

  return <section className="bg-white"><header className="border-b border-slate-200 p-6"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">TEMUAN DALAM KONTEKS</p><h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-.03em]">Bagian yang perlu Anda pahami.</h2><p className="mt-3 text-[11px] leading-5 text-slate-500">Klik temuan untuk menampilkan kalimat sumber yang berkaitan.</p></header><div>{findings.map((item) => { const active = item.id === activeFinding; return <Button key={item.id} variant="ghost" size="default" type="button" aria-pressed={active} onClick={() => onSelectFinding?.(item.id)} className={cn("grid w-full grid-cols-[55px_1fr_18px] items-center gap-3 border-b border-l-2 border-slate-200 border-l-transparent px-6 py-5 text-left h-auto rounded-none justify-start font-normal", active && "border-l-klarisa-secondary bg-[#f3f6ff]")}><span className="text-[10px] text-slate-400">{item.pasal}</span><b className="text-[11px]">{item.title}</b><ArrowRight className="size-4"/></Button>; })}</div><div className="p-5"><Link href="/dashboard/review/result/detail" className="inline-flex items-center gap-2 text-[10px] font-bold text-klarisa-secondary">Lihat penjelasan temuan aktif<ArrowRight className="size-3"/></Link></div></section>;
}

export function DiscussionPanel() {
  return <aside className="flex min-h-[300px] flex-col bg-[#f8fafc] p-5"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">DISKUSI DOKUMEN</p><p className="mt-4 text-xs leading-5 text-slate-500">Tanyakan konteks pasal, atau tandai pihak terkait.</p><div className="mt-5 flex min-h-32 flex-col rounded-lg border border-slate-200 bg-white p-4"><textarea aria-label="Pertanyaan tentang dokumen" placeholder="Tulis pertanyaan Anda..." className="min-h-16 w-full resize-none bg-transparent text-xs outline-none placeholder:text-slate-400"/><SubmitButton variant="default" size="icon-sm" type="button" aria-label="Kirim pertanyaan" className="mt-auto ml-auto"><Send className="size-4"/></SubmitButton></div><small className="mt-3 text-[9px] leading-4 text-slate-400">Jawaban tetap merujuk pada pasal yang sedang dipilih.</small></aside>;
}
