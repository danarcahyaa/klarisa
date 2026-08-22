'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, Mail, UserRound, Eye, EyeOff, AlertCircle } from 'lucide-react'

import { FormInput } from '@/components/ui/form-input'
import { SubmitButton } from '@/components/ui/submit-button'
import GoogleIcon from '@/components/ui/google-icon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import styles from '../../auth.module.css'

export default function RegisterPage() {
  const { handleRegister, handleGoogleLogin, isLoading, isAuthGoogle, error } = useAuth()
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    if (localError) setLocalError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError(null)

    if (!formData.full_name || !formData.email || !formData.password) {
      setLocalError('Harap isi semua kolom formulir.')
      return
    }

    await handleRegister(formData)
  }

  const displayError = localError || error

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <Link href="/" className={styles.logo}>
          <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
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
          <Link href="/" className={`${styles.logo} ${styles.mobileLogo}`}>
            <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
            Klarisa
          </Link>
          <h2>Buat akun Anda</h2>
          
          {displayError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <SubmitButton
            type="button"
            variant="outline"
            leftIcon={<GoogleIcon />}
            className={styles.googleButton}
            onClick={() => handleGoogleLogin()}
            isLoading={isAuthGoogle && isLoading}
            disabled={!isAuthGoogle && isLoading}
          >
            Lanjutkan dengan Google
          </SubmitButton>

          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <span />
            </div>
            <span className={styles.dividerText}>atau</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <FormInput
                name="full_name"
                label="Nama lengkap"
                placeholder="Nama Anda"
                leftIcon={<UserRound />}
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <FormInput
                name="email"
                label="Email"
                type="email"
                placeholder="nama@contoh.com"
                leftIcon={<Mail />}
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <FormInput
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                leftIcon={<LockKeyhole />}
                rightIcon={showPassword ? <EyeOff /> : <Eye />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            <SubmitButton
              type="submit"
              rightIcon={<ArrowRight />}
              className={styles.submit}
              isLoading={isLoading}
            >
              Buat akun Klarisa
            </SubmitButton>
          </form>

          <p className={styles.switch}>
            Sudah memiliki akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
