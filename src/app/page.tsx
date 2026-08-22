import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeChatbot } from "@/components/home-chatbot";
import { HomeWorkspacePreview } from "@/components/home-workspace-preview";

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
    "Elemen perjanjian diverifikasi sebelum analisis dimulai.",
  ],
  [
    "03",
    "Pahami tingkat risiko.",
    "Klausul diklasifikasikan sebagai tinggi, sedang, atau wajar.",
  ],
];

function Logo() {
  return (
    <Link href="/" className="landing-logo" aria-label="Klarisa">
      <Image src="/klarisa/logo.png" alt="" width={24} height={24} priority />
      <span>Klarisa</span>
    </Link>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="landing-eyebrow">{children}</p>;
}

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Logo />
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navigasi utama"
        >
          <a className="landing-nav-link" href="#cara-kerja">
            Cara kerja
          </a>
          <a className="landing-nav-link" href="#fitur">
            Fitur
          </a>
          <a className="landing-nav-link" href="#untuk-siapa">
            Untuk siapa
          </a>
          <a className="landing-nav-link" href="#keamanan">
            Keamanan
          </a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link className="landing-nav-link hidden sm:inline" href="/login">
            Masuk
          </Link>
          <Button asChild variant="blue" size="sm" className="landing-header-cta">
            <Link href="/review">
              Review kontrak <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <section className="landing-hero-section landing-shell grid items-center gap-12 py-18 lg:min-h-[690px] lg:grid-cols-[.9fr_1.1fr] lg:py-22">
        <div className="landing-reveal">
          <Eyebrow>LEGAL CLARITY, WITHOUT THE LEGAL DESK</Eyebrow>
          <h1 className="landing-display mt-5 max-w-xl text-[clamp(3.15rem,6vw,5.5rem)] leading-[.94]">
            Tinjau setiap klausul. <em>Pahami</em> risiko hukumnya.
          </h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-slate-500">
            Klarisa mengubah kontrak panjang menjadi keputusan yang bisa Anda
            pertanggungjawabkan sebelum tanda tangan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild variant="blue" size="lg">
              <Link href="/review">
                Mulai review kontrak <ArrowRight />
              </Link>
            </Button>
            <a className="landing-text-link" href="#cara-kerja">
              Lihat cara kerjanya <ArrowRight />
            </a>
          </div>
        </div>
        <div className="landing-hero-visual landing-reveal landing-delay-1">
          <article className="landing-document landing-float">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 text-[10px] tracking-[.16em] text-slate-500">
              <span>PERJANJIAN KERJA SAMA</span>
              <b className="text-3xl font-normal tracking-normal text-[#2F5BD3]">
                04
              </b>
            </div>
            <h2>Jasa Desain dan Pengembangan Situs Web</h2>
            <p className="landing-flagged-line">
              PIHAK PERTAMA berhak menunda pembayaran tanpa batas waktu apabila
              hasil pekerjaan dinilai belum memuaskan.
            </p>
            <p>
              Perubahan ruang lingkup wajib disepakati secara tertulis oleh
              kedua pihak.
            </p>
            <p>
              Hak atas hasil final berpindah setelah seluruh pembayaran
              terpenuhi.
            </p>
            <footer>
              <span>Kontrak_Kerja_Sama.docx</span>
              <span>04 / 12</span>
            </footer>
          </article>
          <Card className="landing-risk-card landing-float-reverse">
            <CardContent className="p-6">
              <div className="flex items-start justify-between text-[10px] font-bold tracking-[.14em] text-indigo-200">
                <span>PERLU DITINJAU</span>
                <b className="text-5xl font-normal leading-none tracking-normal text-white">
                  68
                </b>
              </div>
              <span className="mt-8 block text-[10px] font-bold tracking-[.14em] text-indigo-200">
                PASAL 4 / PEMBAYARAN
              </span>
              <h3 className="mt-3 text-2xl leading-tight">
                Satu pihak memegang seluruh ukuran keberhasilan.
              </h3>
              <p className="mt-3 text-xs leading-5 text-slate-300">
                Tidak ada batas waktu atau kriteria penerimaan yang objektif.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="landing-audience-section bg-slate-900 text-white" id="untuk-siapa">
        <div className="landing-shell grid gap-7 py-9 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div><Eyebrow>UNTUK SIAPA</Eyebrow><p className="mt-3 max-w-xl text-base leading-7">Klarisa dibuat untuk mereka yang menjalankan bisnis sendiri, tetapi tidak seharusnya menghadapi kontrak sendirian.</p></div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs font-medium text-slate-300 sm:grid-cols-4">
            {audiences.map((audience) => (
              <span key={audience}>{audience}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="landing-summary-section">
        <div className="landing-shell py-8">
          <Eyebrow>RINGKASAN REVIEW</Eyebrow>
        </div>
        <div className="landing-shell grid border-t border-slate-200 md:grid-cols-3">
          {[
            [
              "03",
              "tingkat risiko untuk membedakan temuan kritis, perlu perhatian, dan klausul wajar.",
            ],
            [
              "100%",
              "teks kontrak ditinjau, bukan hanya kata kunci yang telah ditentukan.",
            ],
            [
              "1",
              "ruang kerja untuk dokumen, insight AI, dan pertanyaan lanjutan.",
            ],
          ].map(([stat, text]) => (
            <article className="landing-stat" key={stat}>
              <b>{stat}</b>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-workflow-section landing-shell py-20 md:py-28" id="cara-kerja">
        <div className="grid gap-6 md:grid-cols-[.35fr_1fr]">
          <Eyebrow>CARA KERJA</Eyebrow>
            <h2 className="landing-heading">Dari dokumen panjang menjadi hal-hal penting yang mudah dipahami.</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, description], index) => (
            <Card
              className={
                "landing-step-card landing-reveal landing-delay-" + (index + 1)
              }
              key={number}
            >
              <CardContent className="flex min-h-62 flex-col p-7">
                <span className="text-xs font-bold tracking-widest text-[#2F5BD3]">
                  {number}
                </span>
                <h3 className="mt-auto text-2xl leading-tight">{title}</h3>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {description}
                </p>
                <ArrowRight className="mt-5 size-4 text-[#2F5BD3] transition-transform group-hover/card:translate-x-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-features-section grid lg:grid-cols-2" id="fitur">
        <div className="relative min-h-[480px] overflow-hidden">
          <Image
            className="object-cover transition-transform duration-700 hover:scale-105"
            src="/klarisa/hero-contract.jpeg"
            alt="Kontrak yang sedang ditinjau"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <Card className="landing-audit-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3"><Eyebrow>HASIL PEMERIKSAAN</Eyebrow><span className="text-[10px] font-semibold text-slate-400">PASAL 04</span></div>
              <p className="landing-flagged-line mt-4">PIHAK PERTAMA berhak menunda pembayaran tanpa batas waktu apabila hasil pekerjaan dinilai belum memuaskan.</p>
              <div className="landing-audit-note"><span>PERLU DIBAHAS</span><b>Belum ada batas waktu dan ukuran hasil yang disepakati.</b><small>Lihat alasan dan usulan perbaikan <ArrowRight /></small></div>
            </CardContent>
          </Card>
        </div>
        <div className="bg-slate-900 px-7 py-18 text-white md:px-14">
          <Eyebrow>BUKAN SEKADAR SKOR</Eyebrow>
          <h2 className="landing-heading mt-5">
            Temukan klausul yang perlu diseimbangkan.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-6 text-slate-300">
            Klarisa mengevaluasi seluruh teks untuk menemukan klausul ambigu,
            pembagian beban yang timpang, dan potensi benturan dengan hukum
            Indonesia.
          </p>
          <div className="mt-9">
            {[
              [
                "01",
                "Tepat pada klausul",
                "Temuan dipisahkan dari teks yang memicunya.",
              ],
              [
                "02",
                "Dasar yang bisa ditelusuri",
                "Pasal relevan ditampilkan bersama alasan analisisnya.",
              ],
              [
                "03",
                "Usulan yang lebih seimbang",
                "Alternatif kalimat disusun untuk hasil yang adil.",
              ],
            ].map(([number, title, description]) => (
              <article className="landing-audit-item" key={number}>
                <span>{number}</span>
                <div>
                  <b>{title}</b>
                  <small>{description}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-ai-section landing-shell py-20 md:py-28">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Eyebrow>CARA KLARISA MEMBANTU</Eyebrow>
            <h2 className="landing-heading mt-5">
              Bantu pahami kontrak, tanpa bahasa yang rumit.
            </h2>
          </div>
          <p className="max-w-sm self-end text-sm leading-6 text-slate-500 md:justify-self-end">
            Klarisa membaca isi kontrak, mencari konteks hukum yang sesuai,
            lalu menjelaskan bagian pentingnya dengan bahasa yang lebih jelas.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            [
              "01",
              "Dokumen diparsing",
              "Teks dari klausul dibaca tanpa menyimpan file aslinya.",
            ],
            [
              "02",
              "RAG mencari konteks",
              "Basis data mengambil pasal yang relevan untuk setiap temuan.",
            ],
            [
              "03",
              "AI membandingkan",
              "Klausul dinilai bersama rujukan, tingkat risiko, dan usulan revisi.",
            ],
          ].map(([number, title, description], index) => (
            <Card
              className={
                "landing-ai-card " +
                (index === 2 ? "bg-slate-900 text-white" : "")
              }
              key={number}
            >
              <CardContent className="p-7">
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-workspace-section landing-shell py-20 md:py-28">
        <Eyebrow>SATU RUANG KERJA</Eyebrow>
        <h2 className="landing-heading mt-5">
          Dokumen, temuan, dan diskusi berada di satu tempat.
        </h2>
        <div className="mt-12"><HomeWorkspacePreview /></div>
      </section>

      <section className="landing-security-section bg-slate-900 text-white" id="keamanan">
        <div className="landing-shell grid gap-12 py-20 md:grid-cols-[1.15fr_.85fr] md:py-28">
          <div>
            <Eyebrow>PRIVASI SEJAK AWAL</Eyebrow>
            <h2 className="landing-heading mt-5">
              <em>0</em> file asli disimpan setelah analisis.
            </h2>
          </div>
          <div className="pt-2">
            <ShieldCheck className="size-8 text-indigo-200" />
            <p className="mt-5 text-sm leading-6 text-slate-300">
              File asli tidak menjadi arsip Klarisa. Dokumen diparsing untuk
              kebutuhan analisis, sementara desain enkripsi dan retensi konten
              harus diverifikasi pada tahap implementasi.
            </p>
            <div className="mt-8">
              <p className="landing-security-row">
                <b>DOCX</b>Input terstruktur
              </p>
              <p className="landing-security-row">
                <b>RAG</b>Konteks hukum relevan
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-faq-section landing-shell py-20 md:py-28" id="faq">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr]">
          <div><Eyebrow>PERTANYAAN UMUM</Eyebrow><h2 className="landing-heading mt-5">Hal yang sering ditanyakan sebelum mulai.</h2></div>
          <div className="space-y-0">
            {[
              ["Apakah Klarisa menggantikan pengacara?", "Tidak. Klarisa membantu Anda memahami isi kontrak dan menyiapkan pertanyaan atau usulan. Untuk masalah hukum yang rumit, tetap konsultasikan kepada profesional hukum."],
              ["Dokumen seperti apa yang bisa diperiksa?", "Saat ini Klarisa dirancang untuk membaca dokumen kontrak berformat DOCX."],
              ["Apakah file kontrak saya disimpan?", "File asli diproses untuk analisis dan tidak dijadikan arsip. Informasi tentang retensi dan enkripsi akan dijelaskan saat fitur tersedia."],
              ["Apa yang akan saya dapatkan setelah review?", "Anda akan melihat bagian yang perlu diperhatikan, penjelasan singkat, konteks terkait, dan pilihan kalimat yang lebih jelas untuk dibahas."],
            ].map(([question, answer]) => <details className="landing-faq" key={question}><summary>{question}<ArrowRight /></summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>
      <section className="landing-cta-section bg-[#EEF2FF]">
        <div className="landing-shell py-18 md:py-22">
          <Eyebrow>SEBELUM TANDA TANGAN</Eyebrow>
          <h2 className="landing-heading mt-5 max-w-3xl">
            Ketahui risiko, dasar hukum, dan pilihan revisinya.
          </h2>
          <div className="mt-8 flex flex-col justify-between gap-6 border-t border-indigo-200 pt-6 md:flex-row md:items-center">
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Mulai dari satu dokumen. Klarisa membantu menyiapkan review;
              kepastian akhirnya tetap berada pada para pihak.
            </p>
            <Button asChild size="lg">
              <Link href="/review">
                Review kontrak sekarang <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <footer className="bg-slate-950 text-white">
        <div className="landing-shell grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-60 text-base leading-6 text-slate-300">
              Memahami kontrak sebelum mengambil keputusan.
            </p>
          </div>
          <div className="landing-footer-links">
            <b>PRODUK</b>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#fitur">Review kontrak</a>
          </div>
          <div className="landing-footer-links">
            <b>KEPERCAYAAN</b>
            <a href="#keamanan">Keamanan</a>
            <Link href="/login">Masuk</Link>
          </div>
          <small className="border-t border-white/10 pt-5 text-xs text-slate-500 md:col-span-3">
            Klarisa membantu Anda memahami kontrak dan bukan pengganti nasihat
            hukum profesional.
          </small>
        </div>
      </footer>
      <HomeChatbot />
    </main>
  );
}
