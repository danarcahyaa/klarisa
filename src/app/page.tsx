import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { HomeChatbot } from "@/components/home-chatbot";
import { HomeWorkspacePreview } from "@/components/home-workspace-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const audiences = ["Freelancer", "UMKM", "Kreator", "Pekerja kontrak"];
const steps = [
  [
    "01",
    "Unggah kontrak DOCX.",
    "Klarisa membaca dokumen Anda tanpa perlu menyusun prompt.",
  ],
  [
    "02",
    "Periksa struktur kontrak.",
    "Elemen penting dalam kontrak diperiksa sebelum analisis dimulai.",
  ],
  [
    "03",
    "Pahami tingkat risiko.",
    "Bagian kontrak dikelompokkan agar Anda tahu apa yang perlu dibahas.",
  ],
];

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={
        "inline-flex items-center gap-2.5 text-lg font-bold tracking-tight no-underline " +
        (inverse ? "text-white" : "text-slate-900")
      }
    >
      <Image src="/klarisa/logo.png" alt="" width={24} height={24} priority />
      <span>Klarisa</span>
    </Link>
  );
}

function Label({
  children,
  inverse = false,
}: {
  children: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <p
      className={
        "m-0 text-[10px] font-bold tracking-[.15em] " +
        (inverse ? "text-indigo-200" : "text-klarisa-secondary")
      }
    >
      {children}
    </p>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviewHref = user ? "/dashboard/search" : "/login?next=/dashboard/search";

  return (
    <main className="overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-50 flex h-18 items-center justify-between border-b border-slate-900/10 bg-white/90 px-5 backdrop-blur md:px-10 xl:px-[max(2.5rem,calc((100vw-1280px)/2))]">
        <Logo />
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navigasi utama"
        >
          {[
            ["Cara kerja", "#cara-kerja"],
            ["Fitur", "#fitur"],
            ["Untuk siapa", "#untuk-siapa"],
            ["Keamanan", "#keamanan"],
          ].map(([name, href]) => (
            <a
              className="text-xs text-slate-500 transition hover:text-klarisa-secondary"
              href={href}
              key={href}
            >
              {name}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">
                {user.user_metadata?.full_name || user.email}
              </span>
              <Button asChild variant="blue" size="sm" className="min-h-11 px-4">
                <Link href="/dashboard">Buka workspace <ArrowRight /></Link>
              </Button>
            </>
          ) : (
            <>
              <Link className="hidden text-xs text-slate-500 hover:text-klarisa-secondary sm:block" href="/login">Masuk</Link>
              <Button asChild variant="blue" size="sm" className="min-h-11 px-4">
                <Link href="/register">Buat akun <ArrowRight /></Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid w-[min(100%-2.5rem,1280px)] items-center gap-12 py-20 lg:min-h-[690px] lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <Label>LEGAL CLARITY, WITHOUT THE LEGAL DESK</Label>
          <h1 className="mt-5 max-w-xl font-heading text-[clamp(3.15rem,6vw,5.5rem)] font-normal leading-[.94] tracking-[-.055em]">
            Tinjau setiap klausul.{" "}
            <em className="not-italic text-klarisa-secondary">Pahami</em> risiko
            hukumnya.
          </h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-slate-500">
            Klarisa membantu Anda melihat bagian kontrak yang penting sebelum
            menandatangani.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild variant="blue" size="lg">
              <Link href={reviewHref}>
                Mulai review kontrak <ArrowRight />
              </Link>
            </Button>
            <a
              className="inline-flex items-center gap-2 text-xs font-semibold transition hover:gap-3 hover:text-klarisa-secondary"
              href="#cara-kerja"
            >
              Lihat cara kerjanya <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="relative min-h-105">
          <article className="absolute top-0 left-0 w-[82%] rounded-lg border border-slate-300 bg-white p-6 shadow-[0_20px_50px_rgb(15_23_42_/_12%)] sm:left-8 sm:w-[78%] sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 text-[10px] tracking-[.16em] text-slate-500">
              <span>PERJANJIAN KERJA SAMA</span>
              <b className="text-3xl font-normal tracking-normal text-klarisa-secondary">
                04
              </b>
            </div>
            <h2 className="my-7 font-heading text-xl font-normal leading-tight">
              Jasa Desain dan Pengembangan Situs Web
            </h2>
            <p className="border-l-[3px] border-red-500 bg-rose-50 p-3 font-serif text-xs leading-5">
              PIHAK PERTAMA berhak menunda pembayaran tanpa batas waktu apabila
              hasil pekerjaan dinilai belum memuaskan.
            </p>
            <p className="mt-4 font-serif text-xs leading-5">
              Perubahan ruang lingkup wajib disepakati secara tertulis oleh
              kedua pihak.
            </p>
            <footer className="mt-7 flex justify-between border-t border-slate-200 pt-4 text-[10px] tracking-wide text-slate-500">
              <span>Kontrak_Kerja_Sama.docx</span>
              <span>04 / 12</span>
            </footer>
          </article>
          <Card className="absolute right-0 bottom-0 w-[58%] border-0 bg-slate-900 text-white shadow-[0_20px_50px_rgb(15_23_42_/_22%)]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between text-[10px] font-bold tracking-[.14em] text-indigo-200">
                <span>PERLU DITINJAU</span>
                <b className="text-4xl font-normal leading-none tracking-normal text-white">
                  68
                </b>
              </div>
              <span className="mt-6 block text-[10px] font-bold tracking-[.14em] text-indigo-200">
                PASAL 4 / PEMBAYARAN
              </span>
              <h3 className="mt-3 text-lg leading-tight">
                Ukuran keberhasilan belum jelas.
              </h3>
              <p className="mt-3 text-xs leading-5 text-slate-300">
                Tidak ada batas waktu atau kriteria penerimaan yang objektif.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-slate-900 text-white" id="untuk-siapa">
        <div className="mx-auto grid w-[min(100%-2.5rem,1280px)] gap-7 py-9 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <Label inverse>UNTUK SIAPA</Label>
            <p className="mt-3 max-w-xl text-base leading-7">
              Klarisa dibuat untuk mereka yang menjalankan bisnis sendiri,
              tetapi tidak seharusnya menghadapi kontrak sendirian.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs font-medium text-slate-300 sm:grid-cols-4">
            {audiences.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-[min(100%-2.5rem,1280px)] py-8">
          <Label>RINGKASAN REVIEW</Label>
        </div>
        <div className="mx-auto grid w-[min(100%-2.5rem,1280px)] overflow-hidden rounded-lg border border-slate-200 md:grid-cols-3">
          {[
            [
              "03",
              "tingkat risiko agar Anda tahu bagian yang perlu diperhatikan.",
            ],
            ["100%", "isi kontrak dibaca, bukan hanya kata tertentu."],
            ["1", "ruang kerja untuk dokumen, temuan, dan diskusi."],
          ].map(([number, text], index) => (
            <article
              className={
                "flex min-h-29 items-center gap-5 p-6 " +
                (index
                  ? "border-t border-slate-200 md:border-t-0 md:border-l"
                  : "")
              }
              key={number}
            >
              <b className="font-heading text-4xl font-normal tracking-tight">
                {number}
              </b>
              <span className="max-w-50 text-xs leading-5 text-slate-500">
                {text}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mx-auto w-[min(100%-2.5rem,1280px)] py-20 md:py-28"
        id="cara-kerja"
      >
        <div className="grid gap-6 md:grid-cols-[.35fr_1fr]">
          <Label>CARA KERJA</Label>
          <h2 className="font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
            Dari dokumen panjang menjadi hal-hal penting yang mudah dipahami.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, body], index) => (
            <Card
              className={
                "min-h-62 border-slate-200 transition hover:-translate-y-1 hover:shadow-lg " +
                (index === 1 ? "bg-slate-50" : index === 2 ? "bg-sky-100" : "")
              }
              key={number}
            >
              <CardContent className="flex h-full flex-col p-7">
                <span className="text-xs font-bold tracking-widest text-klarisa-secondary">
                  {number}
                </span>
                <h3 className="mt-auto text-2xl font-normal leading-tight">
                  {title}
                </h3>
                <p className="mt-3 text-xs leading-5 text-slate-500">{body}</p>
                <ArrowRight className="mt-5 size-4 text-klarisa-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-2" id="fitur">
        <div className="relative min-h-120 overflow-hidden">
          <Image
            className="object-cover transition duration-700 hover:scale-105"
            src="/klarisa/hero-contract.jpeg"
            alt="Kontrak yang sedang ditinjau"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <Card className="absolute bottom-8 left-[8%] w-[80%] max-w-108 border-0 shadow-[12px_12px_0_#dbeafe]">
            <CardContent className="p-6">
              <div className="flex justify-between border-b border-slate-200 pb-3">
                <Label>HASIL PEMERIKSAAN</Label>
                <span className="text-[10px] font-semibold text-slate-400">
                  PASAL 04
                </span>
              </div>
              <p className="mt-4 border-l-[3px] border-red-500 bg-rose-50 p-3 text-sm leading-6">
                Pembayaran dapat ditunda tanpa batas waktu.
              </p>
              <p className="mt-4 text-xs text-slate-600">
                Perlu dibahas: belum ada batas waktu dan ukuran hasil yang
                disepakati.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="bg-slate-900 px-7 py-20 text-white md:px-14">
          <Label inverse>BUKAN SEKADAR SKOR</Label>
          <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
            Temukan klausul yang perlu diseimbangkan.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-6 text-slate-300">
            Klarisa membantu mencari kalimat yang ambigu, pembagian beban yang
            timpang, dan bagian yang perlu dibahas bersama.
          </p>
        </div>
      </section>

      <section className="mx-auto w-[min(100%-2.5rem,1280px)] py-20 md:py-28">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Label>CARA KLARISA MEMBANTU</Label>
            <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
              Bantu pahami kontrak, tanpa bahasa yang rumit.
            </h2>
          </div>
          <p className="max-w-sm self-end text-sm leading-6 text-slate-500 md:justify-self-end">
            Klarisa membaca isi kontrak, mencari konteks yang sesuai, lalu
            menjelaskan bagian pentingnya dengan bahasa yang lebih jelas.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Dokumen dibaca", "Isi kontrak dibaca secara menyeluruh tanpa hanya mencari kata tertentu."],
            ["02", "Konteks dicari", "Bagian penting dibandingkan dengan konteks pasal yang sesuai."],
            ["03", "Temuan dijelaskan", "Anda mendapat alasan, tingkat perhatian, dan pilihan perbaikan yang mudah dipahami."],
          ].map(([number, title, description], index) => (
            <Card className={"min-h-[205px] border-slate-200 transition hover:-translate-y-1 " + (index === 2 ? "bg-slate-900 text-white" : "")} key={number}>
              <CardContent className="p-7">
                <span className="text-[11px] font-bold text-klarisa-secondary">{number}</span>
                <h3 className="mt-12 text-lg font-medium">{title}</h3>
                <p className={"mt-2 text-xs leading-5 " + (index === 2 ? "text-slate-300" : "text-slate-500")}>{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto w-[min(100%-2.5rem,1280px)] py-20 md:py-28">
        <Label>SATU RUANG KERJA</Label>
        <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
          Dokumen, temuan, dan diskusi berada di satu tempat.
        </h2>
        <div className="mt-12">
          <HomeWorkspacePreview />
        </div>
      </section>
      <section className="bg-slate-900 text-white" id="keamanan">
        <div className="mx-auto grid w-[min(100%-2.5rem,1280px)] gap-12 py-20 md:grid-cols-[1.15fr_.85fr] md:py-28">
          <div>
            <Label inverse>PRIVASI SEJAK AWAL</Label>
            <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
              <em className="not-italic text-klarisa-secondary">0</em> file asli
              disimpan setelah analisis.
            </h2>
          </div>
          <div className="pt-2">
            <ShieldCheck className="size-7 text-indigo-200" />
            <p className="mt-5 text-sm leading-6 text-slate-300">
              File asli tidak menjadi arsip Klarisa. Dokumen diproses hanya
              untuk membantu analisis, lalu hasilnya disajikan di ruang kerja
              Anda.
            </p>
            <div className="mt-8">
              <p className="flex gap-6 border-t border-white/15 py-4 text-xs text-slate-300"><b className="w-18 text-klarisa-secondary">DOCX</b>Dokumen dibaca sebagai input terstruktur</p>
              <p className="flex gap-6 border-t border-white/15 py-4 text-xs text-slate-300"><b className="w-18 text-klarisa-secondary">RAG</b>Konteks hukum dicari sesuai bagian kontrak</p>
            </div>
          </div>
        </div>
      </section>
      <section
        className="mx-auto grid w-[min(100%-2.5rem,1280px)] gap-8 py-20 md:grid-cols-[.8fr_1.2fr] md:py-28"
        id="faq"
      >
        <div>
          <Label>PERTANYAAN UMUM</Label>
          <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
            Hal yang sering ditanyakan sebelum mulai.
          </h2>
        </div>
        <div>
          {[
            [
              "Apakah Klarisa menggantikan pengacara?",
              "Tidak. Klarisa membantu Anda memahami isi kontrak. Untuk masalah hukum yang rumit, tetap konsultasikan kepada profesional hukum.",
            ],
            [
              "Dokumen seperti apa yang bisa diperiksa?",
              "Saat ini Klarisa dirancang untuk membaca dokumen kontrak berformat DOCX.",
            ],
            [
              "Apakah file kontrak saya disimpan?",
              "File asli diproses untuk analisis dan tidak dijadikan arsip.",
            ],
            [
              "Apa yang saya dapatkan setelah review?",
              "Anda akan melihat bagian yang perlu diperhatikan beserta penjelasan singkatnya.",
            ],
          ].map(([q, a]) => (
            <details
              className="group grid grid-rows-[auto_0fr] overflow-hidden border-t border-slate-200 transition-[grid-template-rows] duration-300 open:grid-rows-[auto_1fr]"
              key={q}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-semibold">
                {q}
                <ArrowRight className="size-4 transition duration-200 group-open:rotate-90" />
              </summary>
              <p className="overflow-hidden pb-5 text-sm leading-6 text-slate-500">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="bg-indigo-50">
        <div className="mx-auto w-[min(100%-2.5rem,1280px)] py-20">
          <Label>SEBELUM TANDA TANGAN</Label>
          <h2 className="mt-5 max-w-3xl font-heading text-[clamp(2.5rem,4.4vw,4rem)] font-normal leading-[.98] tracking-[-.055em]">
            Ketahui risiko, dasar hukum, dan pilihan revisinya.
          </h2>
          <Button asChild size="lg" className="mt-8">
            <Link href={reviewHref}>
              Review kontrak sekarang <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto grid w-[min(100%-2.5rem,1280px)] gap-8 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-60 text-sm leading-6 text-slate-300">
              Memahami kontrak sebelum mengambil keputusan.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <b className="text-[10px] tracking-widest text-indigo-200">
              PRODUK
            </b>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#fitur">Review kontrak</a>
          </div>
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <b className="text-[10px] tracking-widest text-indigo-200">
              KEPERCAYAAN
            </b>
            <a href="#keamanan">Keamanan</a>
            <Link href={user ? "/dashboard" : "/login"}>
              {user ? "Buka workspace" : "Masuk"}
            </Link>
          </div>
        </div>
      </footer>
      <HomeChatbot />
    </main>
  );
}
