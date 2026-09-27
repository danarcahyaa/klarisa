'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, Mail, UserRound, Eye, EyeOff } from 'lucide-react'

import { FormInput } from '@/components/ui/form-input'
import { SubmitButton } from '@/components/ui/submit-button'
import GoogleIcon from '@/components/ui/google-icon'
import { ReusableAlert } from '@/components/ui/reusable-alert'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { handleRegister, handleGoogleLogin, isLoading, isAuthGoogle, error, clearError } = useAuth()
  
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

  React.useEffect(() => {
    if (!displayError) return
    const timeoutId = window.setTimeout(() => {
      setLocalError(null)
      clearError()
    }, 5000)
    return () => window.clearTimeout(timeoutId)
  }, [clearError, displayError])

  return (
    <main className="grid min-h-svh bg-background text-foreground md:grid-cols-[1.05fr_.95fr]">
      <section className="hidden min-h-full flex-col bg-slate-900 px-[clamp(2.125rem,7vw,6.25rem)] py-9 text-white md:flex">
        <Link href="/" className="inline-flex w-max items-center gap-2.5 text-xl font-semibold tracking-[-.6px] text-white no-underline">
          <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
          Klarisa
        </Link>
        <div className="my-auto max-w-[580px]">
          <p className="mb-[22px] text-[10px] font-bold tracking-[1.6px] text-indigo-300">MULAI DARI SATU DOKUMEN</p>
          <h1 className="max-w-[600px] font-heading text-[clamp(3.25rem,5.3vw,5.125rem)] font-normal leading-[.93] tracking-[-5.5px] text-white">Mulai dengan kontrak yang bisa dipahami.</h1>
          <span className="mt-7 block max-w-[410px] text-sm leading-[1.65] text-slate-400">
            Klarisa membantu menemukan risiko klausul kontrak. Klarisa membantu menyusun draft kontrak dengan cepat.
          </span>
        </div>
      </section>

      <section className="grid min-h-svh place-items-center px-6 py-10 md:min-h-0 md:px-[30px] md:py-11">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-6 inline-flex items-center gap-2.5 text-xl font-semibold tracking-[-.6px] text-foreground no-underline md:hidden">
            <img src="/klarisa/logo.png" alt="Klarisa Logo" width="20" height="20" />
            Klarisa
          </Link>
          <h2 className="mb-6 font-heading text-[clamp(2.125rem,3.1vw,2.875rem)] font-normal leading-none tracking-[-2.8px]">Buat akun Anda</h2>
          
          {displayError && (
            <ReusableAlert
              variant="destructive"
              description={displayError}
              className="mb-4"
            />
          )}

          <SubmitButton
            type="button"
            variant="outline"
            leftIcon={<GoogleIcon />}
            className="w-full"
            onClick={() => handleGoogleLogin()}
            isLoading={isAuthGoogle && isLoading}
            disabled={!isAuthGoogle && isLoading}
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
              className="mt-6 w-full"
              isLoading={isLoading}
            >
              Buat akun Klarisa
            </SubmitButton>
          </form>

          <p className="mt-5 text-center text-[11px] text-slate-500">
            Sudah memiliki akun? <Link className="font-bold text-klarisa-secondary" href="/login">Masuk</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
