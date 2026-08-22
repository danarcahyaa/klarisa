'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, LockKeyhole, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

import { FormInput } from '@/components/ui/form-input'
import { SubmitButton } from '@/components/ui/submit-button'
import GoogleIcon from '@/components/ui/google-icon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const urlMessage = searchParams.get('message')
  const requestedNext = searchParams.get('next') || '/dashboard'
  const redirectTo = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/dashboard'

  const { handleLogin, handleGoogleLogin, isLoading, error, isAuthGoogle, clearError } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(urlError)
  const [successMessage, setSuccessMessage] = useState<string | null>(urlMessage)

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

    await handleLogin(formData, redirectTo)
  }

  const displayError = localError || error

  React.useEffect(() => {
    if (!displayError && !successMessage) return
    const timeoutId = window.setTimeout(() => {
      setLocalError(null)
      setSuccessMessage(null)
      clearError()
    }, 5000)
    return () => window.clearTimeout(timeoutId)
  }, [clearError, displayError, successMessage])

  return (
    <div className="w-full max-w-[400px]">
      <Link href="/" className="mb-6 inline-flex items-center gap-2.5 text-xl font-semibold tracking-[-.6px] text-foreground no-underline md:hidden">
        <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
        Klarisa
      </Link>
      <h2 className="mb-6 font-heading text-[clamp(2.125rem,3.1vw,2.875rem)] font-normal leading-none tracking-[-2.8px]">Masuk ke akun Anda</h2>
      
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
        className="w-full"
        onClick={() => handleGoogleLogin(redirectTo)}
        isLoading={isAuthGoogle && isLoading}
      >
        Lanjutkan dengan Google
      </SubmitButton>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <span className="relative bg-background px-3 text-[11px] font-semibold tracking-[.05em] text-slate-400 uppercase">atau</span>
      </div>

      <form onSubmit={handleSubmit}>
          <div className="grid gap-[17px]">
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
          className="mt-6 w-full"
          isLoading={isLoading}
        >
          Masuk ke Klarisa
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-[11px] text-slate-500">
        Belum memiliki akun? <Link className="font-bold text-klarisa-secondary" href="/register">Daftar</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh bg-background text-foreground md:grid-cols-[1.05fr_.95fr]">
      <section className="hidden min-h-full flex-col bg-slate-900 px-[clamp(2.125rem,7vw,6.25rem)] py-9 text-white md:flex">
        <Link href="/" className="inline-flex w-max items-center gap-2.5 text-xl font-semibold tracking-[-.6px] text-white no-underline">
          <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
          Klarisa
        </Link>
        <div className="my-auto max-w-[580px]">
          <p className="mb-[22px] text-[10px] font-bold tracking-[1.6px] text-indigo-300">CLARITY BEFORE COMMITMENT</p>
          <h1 className="max-w-[600px] font-heading text-[clamp(3.25rem,5.3vw,5.125rem)] font-normal leading-[.93] tracking-[-5.5px] text-white">Masuk untuk memahami sebelum menyetujui.</h1>
          <span className="mt-7 block max-w-[410px] text-sm leading-[1.65] text-slate-400">
            Klarisa membantu menemukan risiko klausul kontrak. Klarisa membantu menyusun draft kontrak dengan cepat.
          </span>
        </div>
      </section>

      <section className="grid min-h-svh place-items-center px-6 py-10 md:min-h-0 md:px-[30px] md:py-11">
        <Suspense fallback={<div>Memuat halaman...</div>}>
          <LoginFormContent />
        </Suspense>
      </section>
    </main>
  )
}
