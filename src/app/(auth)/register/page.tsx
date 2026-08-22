"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ShieldCheck, CheckCircle2, Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react"
import { InputForm } from "@/components/ui/input-form"
import { SubmitButton } from "@/components/ui/submit-button"

export default function RegisterPage() {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Nama depan wajib diisi"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Nama belakang wajib diisi"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid"
    }
    if (!formData.password) {
      newErrors.password = "Kata sandi wajib diisi"
    } else if (formData.password.length < 8) {
      newErrors.password = "Kata sandi minimal 8 karakter"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      // Simulation of registration API call / Supabase Auth
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // Handle post-register redirect or success state here
    } catch (err) {
      setErrors({ form: "Gagal mendaftar. Silakan coba lagi." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground antialiased">
      {/* ========================================== */}
      {/* PANEL KIRI (Branding & Value Proposition)  */}
      {/* ========================================== */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 bg-slate-900 text-white relative overflow-hidden border-r border-slate-800">
       

        {/* Header / Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <Image src="/klarisa/logo.png" alt="Klarisa Logo" width={25} height={25} priority className="object-contain" />
            <span className="font-heading font-semibold text-xl tracking-tight text-white">
              Klarisa
            </span>
          </Link>
        </div>

        {/* Core Value Proposition & Feature Highlights */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto py-12">
          <h1 className="font-heading text-6xl xl:text-7xl font-normal leading-[1.1] tracking-tight text-slate-100">
            Tinjau setiap <span className="text-sky-400 font-medium">klausul.</span>
            <br />
            Pahami risiko hukumnya.
          </h1>

          <p className="text-slate-400 text-sm xl:text-sm leading-relaxed">
            Klarisa membantu membaca klausul ambigu,
            memetakan risiko ke hukum positif Indonesia sebelum tanda tangan.
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* PANEL KANAN (Form Registrasi Terpusat)     */}
      {/* ========================================== */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 w-full">
        {/* Mobile Header Logo */}
        <div className="lg:hidden w-full max-w-md mb-8 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/klarisa/logo.png" alt="Klarisa Logo" width={28} height={28} priority />
            <span className="font-heading font-semibold text-lg tracking-tight">Klarisa</span>
          </Link>
          <Link href="/login" className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline">
            Masuk &rarr;
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Section Heading */}
          <div className="space-y-2 text-left">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Buat Akun Baru
            </h2>
          </div>

          {/* Form Alert Message */}
          {errors.form && (
            <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {errors.form}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Grid 2 Kolom: Nama Depan & Nama Belakang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputForm
                label="Nama Depan"
                name="firstName"
                type="text"
                placeholder="Masukkan nama depan"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
                leftIcon={<User className="size-4" />}
              />
              <InputForm
                label="Nama Belakang"
                name="lastName"
                type="text"
                placeholder="Masukkan nama belakang"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
            </div>

            {/* Field: Email */}
            <InputForm
              label="Alamat Email"
              name="email"
              type="email"
              placeholder="Masukkan alamat email Anda"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              leftIcon={<Mail className="size-4" />}
            />

            {/* Field: Kata Sandi */}
            <InputForm
              label="Kata Sandi"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              leftIcon={<Lock className="size-4" />}
              rightIcon={showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              onRightIconClick={() => setShowPassword(!showPassword)}
              helperText="Gunakan minimal 8 karakter dengan kombinasi huruf dan angka"
            />

            {/* Tombol Submit Kustom */}
            <div className="pt-2">
              <SubmitButton
                type="submit"
                isLoading={isLoading}
                loadingText="Mendaftarkan Akun..."
                rightIcon={<ArrowRight className="size-4" />}
                className="w-full"
              >
                Daftar Sekarang
              </SubmitButton>
            </div>
          </form>

          {/* Divider Pemisah */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">atau</span>
            </div>
          </div>

          {/* Opsi Lanjut dengan Google */}
          <SubmitButton
            type="button"
            variant="outline"
            isLoading={isGoogleLoading}
            loadingText="Menghubungkan..."
            onClick={handleGoogleSignIn}
            className="w-full"
            leftIcon={
              !isGoogleLoading && (
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )
            }
          >
            Lanjut dengan Akun Google
          </SubmitButton>

          {/* Footer Navigation & Legal Terms */}
          <div className="space-y-4 pt-4 text-center text-xs text-muted-foreground">
            <p>
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                Masuk di sini
              </Link>
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link href="/syarat-ketentuan" className="underline hover:text-foreground">
                Syarat &amp; Ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="/kebijakan-privasi" className="underline hover:text-foreground">
                Kebijakan Privasi
              </Link>{" "}
              Klarisa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
