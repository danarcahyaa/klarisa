import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { Button } from "@/components/ui/button";
import { login } from "@/app/auth/actions";
import styles from "../auth.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <Link href="/" className={styles.logo}>
          <img src="/klarisa/logo.png" alt="" width="30" height="30" />
          Klarisa
        </Link>
        <div className={styles.introContent}>
          <p>CLARITY BEFORE COMMITMENT</p>
          <h1>Masuk untuk memahami sebelum menyetujui.</h1>
          <span>
            Klarisa membantu Anda membaca risiko tanpa harus memulai dari
            prompt.
          </span>
        </div>
      </section>
      <section className={styles.formSide}>
        <form action={login} className={styles.form}>
          <p className={styles.eyebrow}>SELAMAT DATANG</p>
          <h2>Masuk ke ruang kerja</h2>
          <p className={styles.subtitle}>
            Simpan alur review dan mulai menyiapkan draft yang lebih seimbang.
          </p>
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}
          <div className={styles.fields}>
            <FormInput name="email" label="Email" type="email" placeholder="nama@contoh.com" leftIcon={<Mail />} required />
            <FormInput name="password" label="Password" type="password" placeholder="Minimal 8 karakter" leftIcon={<LockKeyhole />} required />
          </div>
          <Button type="submit" className={styles.submit}>
            Masuk ke Klarisa <ArrowRight />
          </Button>
          <p className={styles.switch}>Belum memiliki akun? <Link href="/register">Daftar</Link></p>
        </form>
      </section>
    </main>
  );
}
