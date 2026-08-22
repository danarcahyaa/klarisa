import Link from "next/link";
import { ArrowRight, FilePlus2, FileSearch } from "lucide-react";
import styles from "./dashboard.module.css";

const documents = [
  ["Perjanjian Kerja Sama Desain", "Diperbarui Hari ini", "3 bagian perlu ditinjau"],
  ["Perjanjian Jasa Identitas Visual", "Diperbarui Kemarin", "1 diskusi baru"],
  ["Kontrak Freelancer Ilustrasi", "Diperbarui 12 Agustus", "Review selesai"],
];

export default function DashboardHome() {
  return <div className={styles.content}>
    <section className={styles.welcome}>
      <div><p>WORKSPACE PRIBADI</p><h1>Selamat datang, Gede.</h1><span>Lanjutkan dokumen yang sedang membutuhkan keputusan, atau mulai dari kontrak baru.</span></div>
      <div className={styles.actions}><Link href="/dashboard/create" className={styles.lightButton}><FilePlus2 />Buat kontrak</Link><Link href="/dashboard/search" className={styles.darkButton}><FileSearch />Review kontrak</Link></div>
    </section>
    <section className={styles.metricGrid}>
      {[['DOKUMEN AKTIF','04','Review dan draft dalam workspace'],['BAGIAN UNTUK DIBAHAS','03','Terhubung ke klausul sumber'],['DISKUSI TERBUKA','02','Menunggu keputusan pihak terkait']].map(([label,value,desc])=><article key={label}><p>{label}</p><b>{value}</b><span>{desc}</span></article>)}
    </section>
    <section className={styles.homeGrid}>
      <article className={styles.documentList}><header><div><p>DOKUMEN KERJA</p><h2>Yang perlu Anda lihat</h2></div><Link href="/dashboard/search">Lihat semua <ArrowRight /></Link></header><div>{documents.map(([name,when,state],index)=><Link href="/dashboard/search" className={styles.documentRow} key={name}><i>0{index+1}</i><span><b>{name}</b><small>{when}</small></span><em>{state}</em><ArrowRight /></Link>)}</div><footer>Dokumen disimpan dalam workspace Anda untuk dilanjutkan kapan saja.</footer></article>
      <aside className={styles.nextCard}><p>BERIKUTNYA</p><h2>Konfirmasi batas penerimaan hasil.</h2><span>Pasal pembayaran pada Perjanjian Kerja Sama Desain belum memiliki tenggat respons tertulis.</span><div><small>PASAL 03</small><b>Nilai dan Pembayaran</b></div><Link href="/dashboard/search">Tinjau konteks pasal <ArrowRight /></Link></aside>
      <article className={styles.activity}><header><p>AKTIVITAS TERBARU</p><Link href="/dashboard/search">Buka diskusi <ArrowRight /></Link></header><div><span>Hari ini</span><p><b>Klausul pembayaran dibuka untuk ditinjau ulang.</b><small>Perjanjian Kerja Sama Desain</small></p></div><div><span>Kemarin</span><p><b>Komentar baru ditambahkan pada batas revisi.</b><small>Perjanjian Jasa Identitas Visual</small></p></div></article>
      <aside className={styles.noteCard}><p>CATATAN KERJA</p><h2>Prioritaskan batas pembayaran, revisi, dan kepemilikan karya sebelum dokumen dibagikan.</h2><Link href="/dashboard/create">Mulai dari draft <ArrowRight /></Link></aside>
    </section>
  </div>;
}
