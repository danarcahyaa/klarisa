import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { register, signInWithGoogle } from "@/app/auth/actions";
import styles from "../auth.module.css";
import GoogleIcon from "@/components/ui/google-icon";

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
            Klarisa membantu menemukan risiko klausul kontrak. Klarisa membantu menyusun draft kontrak dengan cepat.
          </span>
        </div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.form}>
          <h2>Buat akun Anda</h2>
          {error && <p className={styles.error}>{error}</p>}

          <form action={signInWithGoogle}>
            <SubmitButton
              type="submit"
              variant="outline"
              leftIcon={<GoogleIcon />}
              className={styles.googleButton}
            >
              Lanjut dengan akun Google
            </SubmitButton>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <span />
            </div>
            <span className={styles.dividerText}>atau</span>
          </div>

          <form action={register}>
            <div className={styles.fields}>
              <FormInput name="full_name" label="Nama lengkap" placeholder="Nama Anda" leftIcon={<UserRound />} required />
              <FormInput name="email" label="Email" type="email" placeholder="nama@contoh.com" leftIcon={<Mail />} required />
              <FormInput name="password" label="Password" type="password" placeholder="Minimal 8 karakter" leftIcon={<LockKeyhole />} required minLength={8} />
            </div>
            <SubmitButton rightIcon={<ArrowRight />} className={styles.submit}>
              Buat akun Klarisa
            </SubmitButton>
          </form>

          <p className={styles.switch}>Sudah memiliki akun? <Link href="/login">Masuk</Link></p>
        </div>
      </section>
    </main>
  );
}
