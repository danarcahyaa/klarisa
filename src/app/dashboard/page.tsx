import Link from "next/link";
import { ArrowRight, FilePlus2, FileSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createContractService } from "@/services/contract.service";

const eyebrow = "text-[9px] font-bold tracking-[0.18em] text-klarisa-secondary";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const fullName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Anda";
  const firstName = fullName.split(" ")[0];
  const result = user ? await createContractService(createAdminClient()).list(user.id) : null;
  const items = result?.data ?? [];
  const documents = items.slice(0, 3).map((item) => [
    item.title,
    `Diperbarui ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.updatedAt))}`,
    item.type === "review" ? `${item.riskCount} bagian perlu ditinjau` : `${Number(item.metadata.comments ?? 0)} diskusi baru`,
    item.type === "review" ? `/dashboard/review/result?id=${item.id}` : `/dashboard/create?id=${item.id}`,
  ] as const);
  const metrics = [
    ["DOKUMEN AKTIF", String(items.length).padStart(2, "0"), "Review dan draft dalam workspace"],
    ["BAGIAN UNTUK DIBAHAS", String(items.reduce((sum, item) => sum + item.riskCount, 0)).padStart(2, "0"), "Terhubung ke kalimat sumber"],
    ["DISKUSI TERBUKA", String(items.reduce((sum, item) => sum + Number(item.metadata.comments ?? 0), 0)).padStart(2, "0"), "Menunggu keputusan pihak terkait"],
  ] as const;
  return (
    <div className="mx-auto max-w-[1190px] px-4 py-10 sm:px-7 lg:py-16">
      <section className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <div><p className={eyebrow}>WORKSPACE PRIBADI</p><h1 className="mt-5 font-heading text-[clamp(2.75rem,5vw,4.4rem)] font-normal leading-[.95] tracking-[-.06em]">Selamat datang, {firstName}.</h1><p className="mt-3 max-w-2xl text-sm text-slate-500">Lanjutkan dokumen yang memerlukan keputusan, atau mulai dari kontrak baru.</p></div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link href="/dashboard/create" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-klarisa-secondary hover:text-klarisa-secondary"><FilePlus2 className="size-4" />Buat kontrak</Link>
          <Link href="/dashboard/review" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white transition-colors hover:bg-klarisa-secondary"><FileSearch className="size-4" />Review kontrak</Link>
        </div>
      </section>
      <section className="mt-12 grid overflow-hidden rounded-lg border border-[#d9e0ea] bg-white sm:grid-cols-3" aria-label="Ringkasan workspace">
        {metrics.map(([label,value,description]) => <article key={label} className="grid min-h-32 gap-2 border-b border-[#d9e0ea] p-6 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"><p className={eyebrow}>{label}</p><b className="font-heading text-4xl font-normal tracking-[-.06em]">{value}</b><span className="text-[10px] text-slate-500">{description}</span></article>)}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(260px,.82fr)]">
        <article className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-white">
          <header className="flex items-end justify-between gap-4 border-b border-[#e2e7ee] p-6 sm:p-7"><div><p className={eyebrow}>DOKUMEN KERJA</p><h2 className="mt-4 font-heading text-2xl font-normal tracking-[-.04em]">Yang perlu Anda lihat</h2></div><Link href="/dashboard/search" className="inline-flex items-center gap-2 text-[10px] font-bold text-klarisa-secondary">Lihat semua<ArrowRight className="size-4" /></Link></header>
          <div>{documents.map(([name,when,state,href],index) => <Link href={href} key={name} className="grid grid-cols-[26px_minmax(0,1fr)_18px] items-center gap-3 border-b border-[#e2e7ee] px-5 py-5 text-slate-700 transition-colors hover:bg-slate-50 sm:grid-cols-[32px_minmax(0,1fr)_auto_18px] sm:px-7"><i className="text-[10px] not-italic text-slate-400">0{index+1}</i><span className="grid gap-1"><b className="text-xs">{name}</b><small className="text-[10px] text-slate-400">{when}</small></span><em className="hidden text-[10px] not-italic text-klarisa-secondary sm:block">{state}</em><ArrowRight className="size-4 text-klarisa-secondary" /></Link>)}</div>
          <footer className="px-6 py-4 text-[9px] text-slate-400">Dokumen tersimpan di workspace dan dapat dilanjutkan kapan saja.</footer>
        </article>
        <aside className="flex min-h-80 flex-col rounded-lg border border-[#172031] bg-[#172031] p-7 text-white"><p className="text-[9px] font-bold tracking-[.18em] text-[#91aaff]">BERIKUTNYA</p><h2 className="mt-5 font-heading text-3xl font-normal leading-none tracking-[-.04em]">Konfirmasi batas penerimaan hasil.</h2><p className="mt-5 text-xs leading-6 text-slate-300">Pasal pembayaran belum memiliki tenggat respons tertulis.</p><div className="my-7 grid gap-2 border-y border-white/15 py-5"><small className="text-[9px] tracking-widest text-[#91aaff]">PASAL 03</small><b className="text-xs">Nilai dan Pembayaran</b></div><Link href="/dashboard/review/result/detail" className="mt-auto inline-flex items-center gap-2 text-[10px] font-bold">Tinjau konteks pasal<ArrowRight className="size-4" /></Link></aside>
        <article className="rounded-lg border border-[#d9e0ea] bg-white p-6"><header className="flex justify-between border-b border-[#e2e7ee] pb-5"><p className={eyebrow}>AKTIVITAS TERBARU</p><Link href="/dashboard/create" className="inline-flex items-center gap-2 text-[10px] font-bold text-klarisa-secondary">Buka diskusi<ArrowRight className="size-4" /></Link></header>{[["Hari ini","Klausul pembayaran dibuka untuk ditinjau ulang.","Perjanjian Kerja Sama Desain"],["Kemarin","Komentar baru ditambahkan pada batas revisi.","Perjanjian Jasa Identitas Visual"]].map(([when,title,doc]) => <div key={title} className="grid gap-2 border-b border-[#e2e7ee] py-4 last:border-0 sm:grid-cols-[88px_1fr]"><span className="text-[10px] text-slate-400">{when}</span><p className="grid gap-1"><b className="text-[11px]">{title}</b><small className="text-[9px] text-slate-400">{doc}</small></p></div>)}</article>
        <aside className="flex flex-col rounded-lg border border-[#d9e0ea] bg-[#eaf0ff] p-7"><p className={eyebrow}>CATATAN KERJA</p><h2 className="my-6 font-heading text-2xl font-normal leading-tight tracking-[-.03em]">Prioritaskan batas pembayaran, revisi, dan kepemilikan karya sebelum dokumen dibagikan.</h2><Link href="/dashboard/create" className="mt-auto inline-flex items-center gap-2 text-[10px] font-bold text-klarisa-secondary">Mulai dari draft<ArrowRight className="size-4" /></Link></aside>
      </section>
    </div>
  );
}
