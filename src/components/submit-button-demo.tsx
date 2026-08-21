"use client"

import { useState } from "react"
import { SubmitButton } from "@/components/ui/submit-button"
import { FormInput } from "@/components/ui/form-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, User } from "lucide-react"

export function SubmitButtonDemo() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [inputError, setInputError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setInputError("Kata sandi minimal harus 6 karakter")
      return
    }

    setInputError("")
    setIsLoading(true)
    setIsSuccess(false)

    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <Card className="max-w-md mx-auto border border-border bg-card">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" /> Demo FormInput & SubmitButton
        </CardTitle>
        <CardDescription className="font-sans text-xs text-muted-foreground">
          Pengujian FormInput dengan icon di dalam input, label, error & SubmitButton spinner.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reusable FormInput for Email with Left Mail Icon inside input */}
          <FormInput
            label="Alamat Email"
            labelSubtext="Firma / Korporasi"
            type="email"
            required
            placeholder="nama@klarisa.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail />}
          />

          {/* Reusable FormInput for Password with Left Lock Icon & Right Eye Toggle Icon inside input */}
          <FormInput
            label="Kata Sandi"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (inputError) setInputError("")
            }}
            error={inputError}
            helperText="Masukkan minimal 6 karakter kombinasi kata sandi"
            leftIcon={<Lock />}
            rightIcon={showPassword ? <EyeOff /> : <Eye />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />

          <div className="pt-2">
            <SubmitButton
              type="submit"
              className="w-full"
              isLoading={isLoading}
              loadingText="Memproses Autentikasi..."
              leftIcon={<User className="h-4 w-4" />}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Masuk ke Platform
            </SubmitButton>
          </div>
        </form>

        {isSuccess && (
          <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Autentikasi berhasil! Data terkirim secara simulasi.</span>
          </div>
        )}

        <div className="pt-4 border-t border-border space-y-3">
          <span className="text-xs font-bold text-foreground block">Variasi Input & Button Lainnya:</span>
          
          <div className="flex flex-col gap-3">
            {/* FormInput with Error State Demo */}
            <FormInput
              label="Input dengan Pesan Error"
              placeholder="Username salah..."
              error="Username telah digunakan oleh akun lain"
              leftIcon={<User />}
            />

            {/* SubmitButton in Loading State Demo */}
            <SubmitButton
              type="button"
              size="sm"
              isLoading={true}
              loadingText="Mengunggah Dokumen..."
            >
              Unggah File
            </SubmitButton>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
