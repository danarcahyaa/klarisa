import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { Button } from "@/components/ui/button";
import { register } from "@/app/auth/actions";
import styles from "../auth.module.css";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <Link href="/" className={styles.logo}>
          <img src="/klarisa/logo.png" alt="" width="30" height="30" />
          Klarisa
        </Link>
        <div className={styles.introContent}>
          <p>MULAI DARI SATU DOKUMEN</p>
          <h1>Mulai dengan kontrak yang bisa dipahami.</h1>
          <span>
            Klarisa membantu Anda membaca risiko tanpa harus memulai dari
            prompt.
          </span>
        </div>
      </section>
      <section className={styles.formSide}>
        <form action={register} className={styles.form}>
          <p className={styles.eyebrow}>BUAT AKUN</p>
          <h2>Buat ruang kerja Anda</h2>
          <p className={styles.subtitle}>
            Simpan alur review dan mulai menyiapkan draft yang lebih seimbang.
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.fields}>
            <FormInput name="full_name" label="Nama lengkap" placeholder="Nama Anda" leftIcon={<UserRound />} required />
            <FormInput name="email" label="Email" type="email" placeholder="nama@contoh.com" leftIcon={<Mail />} required />
            <FormInput name="password" label="Password" type="password" placeholder="Minimal 8 karakter" leftIcon={<LockKeyhole />} required minLength={8} />
          </div>
          <Button type="submit" className={styles.submit}>
            Buat akun Klarisa <ArrowRight />
          </Button>
          <p className={styles.switch}>Sudah memiliki akun? <Link href="/login">Masuk</Link></p>
        </form>
      </section>
    </main>
  );
}
