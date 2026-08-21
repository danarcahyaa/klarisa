import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import { SubmitButtonDemo } from "@/components/submit-button-demo"
import { ChevronButton } from "@/components/ui/chevron-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Database,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Code2,
  ExternalLink,
  ChevronDown,
  Lock,
  FileText,
  AlertTriangle,
  Type,
  Palette,
  LayoutGrid,
  ShieldCheck,
  Server,
  Sliders,
} from "lucide-react"

export default function Home() {
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !==
      "https://your-supabase-project-ref.supabase.co"

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans pb-24">
      {/* Background Subtle Glow FX */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-klarisa-tertiary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-klarisa-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-klarisa-primary flex items-center justify-center text-white">
              <Sparkles className="h-5 w-5 font-bold" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">
              Klarisa <span className="font-sans text-xs font-normal text-muted-foreground">LegalTech System</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-klarisa-secondary/40 bg-klarisa-secondary/10 text-klarisa-secondary px-3 py-1 text-xs gap-1.5 font-medium rounded-md"
            >
              <Zap className="h-3.5 w-3.5" />
              Design System Docs
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Dokumentasi <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                <DropdownMenuLabel className="font-heading">Navigasi Cepat</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="focus:bg-muted cursor-pointer font-sans" asChild>
                  <a href="#typography">Sistem Tipografi</a>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-muted cursor-pointer font-sans" asChild>
                  <a href="#colors">Palet Warna Brand</a>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-muted cursor-pointer font-sans" asChild>
                  <a href="#components">Komponen UI (Shadcn)</a>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-muted cursor-pointer font-sans text-klarisa-secondary font-semibold" asChild>
                  <a href="#submit-button-docs">⭐ Reusable SubmitButton</a>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-muted cursor-pointer font-sans" asChild>
                  <a href="#paper-demo">Dokumen Hukum (.doc-paper)</a>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-muted cursor-pointer font-sans" asChild>
                  <a href="#tech-stack">Supabase & Backend</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-12 relative z-10 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-klarisa-success/30 bg-klarisa-success/10 text-klarisa-success text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Design System & Radix UI Synced
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Dokumentasi Design System <br />
            <span className="text-klarisa-tertiary">Platform LegalTech Klarisa</span>
          </h1>

          <p className="font-sans text-muted-foreground text-lg leading-relaxed">
            Spesifikasi lengkap tipografi, identitas warna brand, komponen UI Shadcn (Radix UI), dan elemen penyuntingan dokumen hukum resmi.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Uji Modal Dialog</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-card-foreground">
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center gap-2 text-klarisa-primary">
                    <Sparkles className="h-5 w-5" /> Dialog Interaktif Radix UI
                  </DialogTitle>
                  <DialogDescription className="font-sans text-muted-foreground pt-2">
                    Dialog berbasis `@radix-ui/react-dialog` dengan styling `rounded-md` dan `border-border`.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Input Pengujian</label>
                    <Input
                      placeholder="Masukkan nama dokumen..."
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <a
              href="#components"
              className="inline-flex items-center justify-center border border-border bg-card text-foreground hover:bg-muted px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Jelajahi Komponen UI
            </a>
          </div>
        </div>

        {/* 1. TYPOGRAPHY SYSTEM */}
        <section id="typography" className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2 text-foreground">
                <Type className="h-6 w-6 text-klarisa-secondary" /> 1. Sistem Tipografi (Typography System)
              </h2>
              <p className="font-sans text-sm text-muted-foreground pt-1">
                4 keluarga font Google & Serif standar dokumen hukum resmi.
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-border rounded-md">
              4 Font Families
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardDescription className="font-mono text-xs text-klarisa-secondary">font-heading / font-jakarta</CardDescription>
                <CardTitle className="font-heading text-2xl font-bold text-foreground">Plus Jakarta Sans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-heading text-sm text-muted-foreground">
                  Digunakan khusus untuk Judul Utama (Headings), Hero Section, Navbar, Title Modal, dan Header Komponen.
                </p>
                <div className="p-3 bg-muted/40 rounded-md font-heading text-xs font-semibold">
                  Sample: PERJANJIAN LISENSI PERANGKAT LUNAK
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription className="font-mono text-xs text-klarisa-secondary">font-sans / font-dm</CardDescription>
                <CardTitle className="font-sans text-2xl font-bold text-foreground">DM Sans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-sans text-sm text-muted-foreground">
                  Digunakan untuk antarmuka umum, teks deskripsi, tombol, formulir input, dan kartu informasi.
                </p>
                <div className="p-3 bg-muted/40 rounded-md font-sans text-xs">
                  Sample: Sistem secara otomatis menganalisis klausul kontrak Anda dalam hitungan detik.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription className="font-mono text-xs text-klarisa-secondary">font-doc / font-serif</CardDescription>
                <CardTitle className="font-doc text-2xl font-bold text-foreground">Times New Roman (Serif)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-doc text-base text-muted-foreground">
                  Format baku standar naskah akta, kontrak, dan dokumen perjanjian hukum resmi (.doc-paper).
                </p>
                <div className="p-3 bg-muted/40 rounded-md font-doc text-sm">
                  Sample: Pasal 1: Dalam Perjanjian ini, yang dimaksud dengan "Rahasia Informasi" adalah...
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription className="font-mono text-xs text-klarisa-secondary">font-mono</CardDescription>
                <CardTitle className="font-mono text-2xl font-bold text-foreground">JetBrains Mono</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-mono text-xs text-muted-foreground">
                  Digunakan untuk tag variabel [PIHAK PERTAMA], placeholder data, token metadata, dan kode.
                </p>
                <div className="p-3 bg-muted/40 rounded-md font-mono text-xs">
                  Sample: [PIHAK_PERTAMA_NAMA] = "PT Klarisa Teknologi Indonesia"
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 2. COLOR PALETTE */}
        <section id="colors" className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2 text-foreground">
                <Palette className="h-6 w-6 text-klarisa-tertiary" /> 2. Identitas Warna Brand & Sistem Semantik
              </h2>
              <p className="font-sans text-sm text-muted-foreground pt-1">
                Warna dasar brand Klarisa dan warna status semantik dokumen hukum.
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-border rounded-md">
              Klarisa Palette
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Navy */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-12 w-full rounded-md bg-klarisa-primary text-white flex items-center justify-between px-3 font-mono font-bold text-xs">
                  <span>Primary</span>
                  <span>#0F172A</span>
                </div>
                <CardTitle className="font-heading text-lg pt-2">Deep Slate Navy</CardTitle>
                <CardDescription className="text-xs">
                  Token: <code className="text-foreground font-mono">klarisa.primary</code> / <code className="text-foreground font-mono">--primary</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Digunakan untuk tombol utama (default), heading, navigasi, dan elemen struktural utama.
              </CardContent>
            </Card>

            {/* Secondary Blue */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-12 w-full rounded-md bg-klarisa-secondary text-white flex items-center justify-between px-3 font-mono font-bold text-xs">
                  <span>Secondary</span>
                  <span>#0284C7</span>
                </div>
                <CardTitle className="font-heading text-lg pt-2">Sky Blue</CardTitle>
                <CardDescription className="text-xs">
                  Token: <code className="text-foreground font-mono">klarisa.secondary</code> / <code className="text-foreground font-mono">--secondary</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Digunakan untuk sitasi hukum, indikator langkah aktif (wizard), dan ring fokus.
              </CardContent>
            </Card>

            {/* Tertiary Coral */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-12 w-full rounded-md bg-klarisa-tertiary text-white flex items-center justify-between px-3 font-mono font-bold text-xs">
                  <span>Tertiary</span>
                  <span>#FF4A18</span>
                </div>
                <CardTitle className="font-heading text-lg pt-2">Vibrant Coral</CardTitle>
                <CardDescription className="text-xs">
                  Token: <code className="text-foreground font-mono">klarisa.tertiary</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Digunakan untuk aksen hero, sorotan fitur penting, dan tombol perhatian khusus.
              </CardContent>
            </Card>
          </div>

          {/* Semantic Status Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-md bg-red-500/10 border border-red-500/30 space-y-1">
              <div className="font-bold text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Error / Flagged Issue (#DC2626)
              </div>
              <p className="text-xs text-red-800 dark:text-red-300">
                Menandai klausul pembatalan sepihak atau resiko hukum berat.
              </p>
            </div>

            <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Warning / Klausul Ambigu (#D97706)
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Menandai kalimat ambigu yang membutuhkan klarifikasi tambahan.
              </p>
            </div>

            <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Success / Fair Clause (#16A34A)
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Menandai klausul seimbang yang aman bagi kedua belah pihak.
              </p>
            </div>
          </div>
        </section>

        {/* 3. UI COMPONENTS SHOWCASE */}
        <section id="components" className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2 text-foreground">
                <LayoutGrid className="h-6 w-6 text-klarisa-primary" /> 3. Perpustakaan Komponen UI (Shadcn + Radix)
              </h2>
              <p className="font-sans text-sm text-muted-foreground pt-1">
                Semua komponen telah disesuaikan dengan <code className="text-foreground font-mono">rounded-md</code>, <code className="text-foreground font-mono">border-border</code>, dan tanpa bayangan kasar.
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-border rounded-md">
              Shadcn Radix UI
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Button Component Showcase */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Tombol (Button Component)</CardTitle>
                <CardDescription className="text-xs">
                  Varian & Ukuran tombol konsisten (`rounded-md`, `h-9` default).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Button variant="default">Default (Navy)</Button>
                  <Button variant="blue">Variant Blue</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground w-full">Ukuran Tombol:</span>
                  <Button size="lg">Size Large (h-10)</Button>
                  <Button size="default">Default (h-9)</Button>
                  <Button size="sm">Size Small (h-8)</Button>
                  <Button size="xs">Size Extra Small (h-7)</Button>
                </div>
              </CardContent>
            </Card>

            {/* Input & Form Component Showcase */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Input Formulir (Input Component)</CardTitle>
                <CardDescription className="text-xs">
                  Tinggi `h-10`, `rounded-md`, border `border-input`, `focus-visible:ring-1`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Input Teks Standar</label>
                  <Input placeholder="Contoh: PT Klarisa Teknologi Indonesia" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Input Nonaktif (Disabled State)</label>
                  <Input placeholder="Formulir ini terkunci..." disabled />
                </div>
              </CardContent>
            </Card>

            {/* Badge Component Showcase */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Lencana Status (Badge Component)</CardTitle>
                <CardDescription className="text-xs">
                  Indikator status dengan `rounded-md` dan warna semantik.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="default">Default Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
                <Badge variant="destructive">Destructive Badge</Badge>
                <Badge className="bg-klarisa-secondary text-white">Sky Blue Badge</Badge>
                <Badge className="bg-emerald-600 text-white">Fair Clause Badge</Badge>
              </CardContent>
            </Card>

            {/* Dropdown Menu & Animated Chevron Button Showcase */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Tombol Chevron Interaktif (ChevronButton)</CardTitle>
                <CardDescription className="text-xs">
                  Animasi rotasi chevron otomatis (Up & Down / 180°) saat diklik atau menu terbuka.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <ChevronButton variant="outline">
                    Chevron Toggle (Interaktif)
                  </ChevronButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ChevronButton>Buka Doksli</ChevronButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border-border text-foreground">
                      <DropdownMenuLabel>Aksi Dokumen</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="focus:bg-muted cursor-pointer">
                        Unduh PDF Resmi
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-muted cursor-pointer">
                        Salin Tautan Bagikan
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-muted text-red-600 cursor-pointer">
                        Hapus Naskah
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <ChevronButton>Buka Doksli Asli</ChevronButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border-border text-foreground">
                      <DropdownMenuItem className="focus:bg-muted cursor-pointer">Kemitraan Lisensi</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-muted cursor-pointer">Kemitraan Vendor</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SubmitButton Reusable Component Showcase & Interactive Demo */}
          <div id="submit-button-docs" className="pt-6">
            <Card className="border border-klarisa-secondary/40 bg-gradient-to-br from-card via-card to-klarisa-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-klarisa-secondary/40 bg-klarisa-secondary/10 text-klarisa-secondary text-xs">
                    Komponen Reusable Formulir
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">src/components/ui/form-input.tsx & submit-button.tsx</span>
                </div>
                <CardTitle className="font-heading text-xl font-bold text-foreground pt-1">
                  Komponen FormInput & SubmitButton (Icon Inside & Spinner Loading)
                </CardTitle>
                <CardDescription className="font-sans text-xs text-muted-foreground">
                  Sistem input & tombol reusable: <strong>`FormInput`</strong> mendukung label, indikator error, serta ikon di <strong>dalam input</strong> (`leftIcon` & `rightIcon`). <strong>`SubmitButton`</strong> mendukung <strong>loading spinner (`Loader2`)</strong> dan penanganan klik ikon kanan (toggle password).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SubmitButtonDemo />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. PAPER DOCUMENT CANVAS DEMO */}
        <section id="paper-demo" className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-6 w-6 text-klarisa-secondary" /> 4. Lembar Kontrak Hukum (.doc-paper)
              </h2>
              <p className="font-sans text-sm text-muted-foreground pt-1">
                Tampilan naskah resmi berformat <code className="text-foreground font-mono">Times New Roman</code> (1rem, line-height 1.75, tanpa shadow).
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-border rounded-md">
              Class: .doc-paper
            </Badge>
          </div>

          <Card className="doc-paper p-8 space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <h3 className="font-bold text-xl tracking-tight text-foreground">PERJANJIAN KERJA SAMA KEMITRAAN</h3>
              <Badge className="bg-klarisa-secondary text-white text-xs font-sans">Draft v1.0</Badge>
            </div>

            <p className="text-foreground leading-relaxed">
              Perjanjian ini dibuat dan ditandatangani pada hari ini oleh dan antara <span className="clause-placeholder">[PIHAK PERTAMA]</span> selaku penyedia layanan platform teknologi dan <span className="clause-placeholder">[PIHAK KEDUA]</span> selaku mitra pengguna layanan.
            </p>

            <div className="clause-issue text-sm font-sans space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-red-600" /> Pasal 4 Ayat 2 (Flagged Issue / Potensi Resiko Hukum)
              </div>
              <p className="text-xs">
                Klausul pembatalan sepihak tanpa ganti rugi dinilai tidak seimbang dan berpotensi batal demi hukum menurut KUHPerdata.
              </p>
            </div>

            <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-sans space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Pasal 8 (Klausul Kerahasiaan / Fair Clause)
              </div>
              <p>Klausul menjaga kerahasiaan data berlaku 2 (dua) tahun secara timbal balik.</p>
            </div>
          </Card>
        </section>

        {/* 5. TECH STACK & SUPABASE STATUS */}
        <section id="tech-stack" className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2 text-foreground">
                <Server className="h-6 w-6 text-klarisa-primary" /> 5. Status Integrasi Supabase & Tech Stack
              </h2>
              <p className="font-sans text-sm text-muted-foreground pt-1">
                Kredensial & helper integrasi backend Supabase SSR.
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                isSupabaseConfigured
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-600"
              }
            >
              {isSupabaseConfigured ? "Supabase Connected" : "Kredensial Pending"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardDescription className="font-mono text-[10px]">src/lib/supabase/client.ts</CardDescription>
                <CardTitle className="font-heading text-sm">Browser Client</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                Helper Supabase untuk Client Components.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardDescription className="font-mono text-[10px]">src/lib/supabase/server.ts</CardDescription>
                <CardTitle className="font-heading text-sm">Server Client</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                Helper Supabase untuk Server Actions & Components.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardDescription className="font-mono text-[10px]">src/middleware.ts</CardDescription>
                <CardTitle className="font-heading text-sm">Auth Middleware</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                Menjaga & memperbarui sesi cookie Supabase.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardDescription className="font-mono text-[10px]">.env.local</CardDescription>
                <CardTitle className="font-heading text-sm">Environment Keys</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                Konfigurasi `NEXT_PUBLIC_SUPABASE_URL`.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
