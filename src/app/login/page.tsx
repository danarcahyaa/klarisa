import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { login, signInWithGoogle } from "@/app/auth/actions";
import styles from "../auth.module.css";
import GoogleIcon from "@/components/ui/google-icon";

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
            Klarisa membantu menemukan risiko klausul kontrak. Klarisa membantu menyusun draft kontrak dengan cepat.
          </span>
        </div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.form}>
          <h2>Masuk ke akun Anda</h2>
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

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

          <form action={login}>
            <div className={styles.fields}>
              <FormInput name="email" label="Email" type="email" placeholder="nama@contoh.com" leftIcon={<Mail />} required />
              <FormInput name="password" label="Password" type="password" placeholder="Minimal 8 karakter" leftIcon={<LockKeyhole />} required />
            </div>
            <SubmitButton rightIcon={<ArrowRight />} className={styles.submit}>
              Masuk ke Klarisa
            </SubmitButton>
          </form>

          <p className={styles.switch}>Belum memiliki akun? <Link href="/register">Daftar</Link></p>
        </div>
      </section>
    </main>
  );
}
