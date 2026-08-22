import Link from "next/link";
import { ArrowRight, MoreHorizontal, Search } from "lucide-react";
import styles from "../dashboard.module.css";

const results = [
  ["R", "Perjanjian Kerja Sama Desain", "Diperbarui hari ini · 3 risiko tinggi", "68/100"],
  ["R", "Kontrak Freelancer Ilustrasi", "Diakses 2 hari lalu · 1 risiko tinggi", "74/100"],
  ["D", "Perjanjian Jasa Identitas Visual", "Diperbarui kemarin · 1 komentar baru", "DRAFT 03"],
  ["R", "Kontrak B2B Supplier Bahan", "Diakses kemarin · perlu tinjau pembayaran", "62/100"],
];

export default function SearchPage() {
  return <div className={`${styles.content} ${styles.searchPage}`}>
    <section className={styles.searchIntro}><p>WORKSPACE PRIBADI</p><h1>Mulai dari dokumen yang perlu Anda pahami.</h1><span>Cari review atau draft, lalu lanjutkan tepat dari keputusan terakhir.</span></section>
    <section className={styles.searchPanel}><label><input placeholder="Cari review atau draft..." aria-label="Cari review atau draft" /><Search /></label><div className={styles.filters}><button className={styles.activeFilter}>Semua</button><button>Draft</button><button>Review</button><span>Total 4</span></div><div className={styles.results}>{results.map(([type,name,desc,score])=><Link href="/dashboard" key={name} className={styles.resultRow}><i>{type}</i><span><b>{name}</b><small>{desc}</small></span><em>{score}</em><MoreHorizontal /></Link>)}</div><footer><Link href="/dashboard/create" className={styles.lightButton}>Buat draft</Link><Link href="/dashboard" className={styles.darkButton}>Review kontrak <ArrowRight /></Link></footer></section>
  </div>;
}
