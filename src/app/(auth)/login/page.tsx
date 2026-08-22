'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, LockKeyhole, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

import { FormInput } from '@/components/ui/form-input'
import { SubmitButton } from '@/components/ui/submit-button'
import GoogleIcon from '@/components/ui/google-icon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import styles from '../../auth.module.css'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const urlMessage = searchParams.get('message')

  const { handleLogin, handleGoogleLogin, isLoading, error, isAuthGoogle } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (urlError) setLocalError(urlError)
    if (urlMessage) setSuccessMessage(urlMessage)
  }, [urlError, urlMessage])

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
    setSuccessMessage(null)

    if (!formData.email || !formData.password) {
      setLocalError('Harap isi email dan password Anda.')
      return
    }

    await handleLogin(formData)
  }

  const displayError = localError || error

  return (
    <div className={styles.form}>
      <Link href="/" className={`${styles.logo} ${styles.mobileLogo}`}>
        <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
        Klarisa
      </Link>
      <h2>Masuk ke akun Anda</h2>
      
      {displayError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {successMessage && !displayError && (
        <Alert variant="success" className="mb-4">
          <CheckCircle2 />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <SubmitButton
        type="button"
        disabled={!isAuthGoogle && isLoading}
        variant="outline"
        leftIcon={<GoogleIcon />}
        className={styles.googleButton}
        onClick={() => handleGoogleLogin()}
        isLoading={isAuthGoogle && isLoading}
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
            disabled={isLoading}
          />
        </div>

        <SubmitButton
          type="submit"
          rightIcon={<ArrowRight />}
          className={styles.submit}
          isLoading={isLoading}
        >
          Masuk ke Klarisa
        </SubmitButton>
      </form>

      <p className={styles.switch}>
        Belum memiliki akun? <Link href="/register">Daftar</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <Link href="/" className={styles.logo}>
          <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
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
        <Suspense fallback={<div>Memuat halaman...</div>}>
          <LoginFormContent />
        </Suspense>
      </section>
    </main>
  )
}
