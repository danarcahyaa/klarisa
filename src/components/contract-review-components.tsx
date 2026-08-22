import Link from "next/link";
import { ArrowRight, FileText, Scale, Send, Sparkles } from "lucide-react";

export const findings = [
  { pasal: "Pasal 02", title: "Batas perubahan belum ditulis.", tone: "slate" },
  { pasal: "Pasal 03", title: "Pembayaran menunggu pihak ketiga.", tone: "blue" },
  { pasal: "Pasal 05", title: "Pengalihan hak karya perlu batas.", tone: "slate" },
] as const;

export function DocumentHeader({ status = "3 bagian perlu ditinjau" }: { status?: string }) {
  return <header className="flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-7"><FileText className="size-4 text-slate-600"/><span className="grid gap-1"><b className="text-xs">Surat Perjanjian Kerja Sama Jasa Digital</b><small className="text-[9px] text-slate-400">10 September 2026 · teks hasil parsing</small></span><span className="ml-auto hidden text-[10px] text-slate-500 sm:block">{status}</span></header>;
}

export function ContractDocument() {
  return <article className="mx-auto w-full max-w-[620px] px-5 py-9 text-[#202a3a] sm:px-10 lg:py-14">
    <p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">DOKUMEN / 01</p>
    <h1 className="mt-5 font-heading text-2xl font-semibold leading-tight sm:text-3xl">SURAT PERJANJIAN KERJA<br className="hidden sm:block"/> SAMA JASA DIGITAL</h1>
    <p className="mt-4 text-sm leading-6">Perjanjian ini dibuat antara PT Maju Berdikari sebagai PIHAK PERTAMA dan Rian Pratama sebagai PIHAK KEDUA.</p>
    <section className="mt-8"><h2 className="font-sans text-xs font-bold">PASAL 1: RUANG LINGKUP &amp; PENYESUAIAN</h2><p className="mt-4 pl-0 text-sm leading-7 sm:pl-5">PIHAK KEDUA bertanggung jawab menyelesaikan sistem informasi sesuai lampiran spesifikasi teknis.</p><p className="mt-3 ml-0 w-fit rounded-sm bg-red-50 px-1 text-sm leading-6 text-red-700 sm:ml-5">PIHAK KEDUA bertanggung jawab menyelesaikan pekerjaan sesuai lampiran spesifikasi teknis.</p></section>
    <section className="mt-8"><h2 className="font-sans text-xs font-bold">PASAL 2: PEMBAYARAN DAN PENCAIRAN</h2><p className="mt-4 pl-0 text-sm leading-7 sm:pl-5">Total nilai imbalan jasa yang disepakati adalah sebesar Rp20.000.000.</p><p className="mt-3 ml-0 rounded border border-red-100 bg-red-50 px-1 text-sm font-semibold leading-6 text-red-700 ring-2 ring-klarisa-secondary/20 sm:ml-5">Pelunasan biaya honorarium (70%) hanya akan dicairkan kepada PIHAK KEDUA apabila PIHAK PERTAMA telah menerima pembayaran penuh dari klien utama PIHAK PERTAMA.</p></section>
    <section className="mt-8"><h2 className="font-sans text-xs font-bold">PASAL 3: HAK KEKAYAAN INTELEKTUAL</h2><p className="mt-4 ml-0 w-fit rounded-sm bg-red-50 px-1 text-sm leading-6 text-red-700 sm:ml-5">Hak ekonomi atas hasil pekerjaan beralih kepada PIHAK PERTAMA setelah seluruh nilai pekerjaan diterima oleh PIHAK KEDUA.</p></section>
  </article>;
}

export function FindingList({ detailed = false }: { detailed?: boolean }) {
  if (detailed) return <section className="bg-white">
    <header className="border-b border-slate-200 p-6"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">CATATAN UNTUK PASAL 03</p><h2 className="mt-4 font-heading text-2xl font-semibold leading-none tracking-[-.03em]">Pembayaran menunggu pihak ketiga.</h2><p className="mt-4 text-xs leading-5 text-slate-500">Hak pembayaran PIHAK KEDUA bergantung pada pihak di luar perjanjian dan belum memiliki batas waktu yang pasti.</p></header>
    <div className="grid gap-4 p-6">
      <article className="border border-blue-100 border-l-2 border-l-klarisa-secondary p-4"><div className="flex items-center gap-2"><Sparkles className="size-4 text-klarisa-secondary"/><b className="text-xs">Analisis Klarisa</b></div><p className="mt-3 text-[11px] text-slate-500">Catatan dibuat dari kalimat yang dipilih pada pasal ini.</p><button type="button" className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold text-klarisa-secondary">Lihat kalimat sumber<ArrowRight className="size-3"/></button></article>
      <article className="border border-red-100 border-l-2 border-l-orange-500 p-4"><div className="flex items-center gap-2"><Scale className="size-4 text-orange-500"/><b className="text-xs">Konteks hukum</b></div><p className="mt-3 text-[11px] leading-5 text-slate-600"><b>KUHPerdata Pasal 1338 ayat (3)</b> digunakan sebagai konteks, bukan putusan pelanggaran.</p><button type="button" className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold text-klarisa-secondary">Lihat pertimbangan<ArrowRight className="size-3"/></button></article>
      <article className="border border-blue-100 border-l-2 border-l-klarisa-secondary p-4"><p className="text-[9px] font-bold tracking-[.16em] text-klarisa-secondary">✦ REKOMENDASI REDAKSI</p><p className="mt-4 text-xs leading-6 text-slate-600">Pelunasan dilakukan maksimal 14 hari kerja setelah hasil diterima tertulis oleh PIHAK PERTAMA, terlepas dari pembayaran klien utama.</p></article>
    </div>
  </section>;
  return <section className="bg-white"><header className="border-b border-slate-200 p-6"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">TEMUAN DALAM KONTEKS</p><h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-.03em]">Bagian yang perlu Anda pahami.</h2><p className="mt-3 text-[11px] leading-5 text-slate-500">Pilih temuan untuk melihat alasan, konteks hukum, dan pilihan redaksi.</p></header><div>{findings.map((item,index)=><Link key={item.pasal} href={index===1?"/dashboard/review/result/detail":"/dashboard/review/result"} className={`grid grid-cols-[55px_1fr_18px] items-center gap-3 border-b border-slate-200 px-6 py-5 transition-colors hover:bg-slate-50 ${item.tone==="blue"?"border-l-2 border-l-klarisa-secondary bg-[#f3f6ff]":"border-l-2 border-l-transparent"}`}><span className="text-[10px] text-slate-400">{item.pasal}</span><b className="text-[11px]">{item.title}</b><ArrowRight className="size-4"/></Link>)}</div></section>;
}

export function DiscussionPanel() {
  return <aside className="flex min-h-[300px] flex-col bg-[#f8fafc] p-5"><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">DISKUSI DOKUMEN</p><p className="mt-4 text-xs leading-5 text-slate-500">Tanyakan konteks pasal, atau tandai pihak terkait.</p><div className="mt-5 flex min-h-32 flex-col rounded-lg border border-slate-200 bg-white p-4"><textarea aria-label="Pertanyaan tentang dokumen" placeholder="Tulis pertanyaan Anda..." className="min-h-16 w-full resize-none bg-transparent text-xs outline-none placeholder:text-slate-400"/><button type="button" aria-label="Kirim pertanyaan" className="mt-auto ml-auto grid size-10 place-items-center rounded-full bg-[#172031] text-white transition-colors hover:bg-klarisa-secondary"><Send className="size-4"/></button></div><small className="mt-3 text-[9px] leading-4 text-slate-400">Jawaban tetap merujuk pada pasal yang sedang dipilih.</small></aside>;
}
