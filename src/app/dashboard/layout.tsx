import Link from "next/link";
import { FilePlus2, FileSearch, LayoutGrid, PanelLeftClose, Share2 } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

const navigation = [
  ["Ringkasan", "/dashboard", LayoutGrid],
  ["Review kontrak", "/dashboard/search", FileSearch],
  ["Buat kontrak", "/dashboard/create", FilePlus2],
  ["Draft dibagikan", "/dashboard/shared", Share2],
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <img src="/klarisa/logo.png" alt="" width="24" height="24" />
          <span><b>Klarisa</b><small>Workspace pribadi</small></span>
          <PanelLeftClose aria-hidden="true" />
        </Link>
        <nav className={styles.nav} aria-label="Menu workspace">
          {navigation.map(([label, href, Icon]) => (
            <Link key={label} href={href}><Icon />{label}</Link>
          ))}
        </nav>
        <div className={styles.recent}>
          <b>TERKINI</b>
          <span>Perjanjian Kerja Sama Desain</span>
          <span>Draft Identitas Visual</span>
          <span>Kontrak Freelancer Ilustrasi</span>
        </div>
        <div className={styles.account}><i>GS</i><span><b>Gede Sutrisna</b><small>Keluar dari workspace</small></span></div>
      </aside>
      <section className={styles.workspace}>
        <header className={styles.topbar}><b>WORKSPACE</b><span>Dokumen dan keputusan Anda tersimpan di satu tempat.</span></header>
        {children}
      </section>
    </main>
  );
}
