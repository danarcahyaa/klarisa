"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FilePlus2,
  FileSearch,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Share2,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Ringkasan", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Cari dokumen", href: "/dashboard/search", icon: Search, exact: true },
  { label: "Review kontrak", href: "/dashboard/review", icon: FileSearch, exact: false },
  { label: "Buat kontrak", href: "/dashboard/create", icon: FilePlus2, exact: false },
  { label: "Draft dibagikan", href: "/dashboard/shared", icon: Share2, exact: false },
] as const;

const recentDocuments = [
  "Perjanjian Kerja Sama Desain",
  "Draft Identitas Visual",
  "Kontrak Freelancer Ilustrasi",
];

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    initials: string;
  };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { handleLogout, isLoading } = useAuth();

  const sidebar = (
    <div className="flex h-full flex-col bg-white px-3 py-5 text-[#172031]">
      <div className="flex items-center gap-2 border-b border-[#e7ebf1] px-2 pb-5">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2" onClick={() => setIsOpen(false)}>
          <Image src="/klarisa/logo.png" alt="Klarisa" width={25} height={25} className="size-6 object-contain" />
          <span className="grid min-w-0 gap-0.5">
            <b className="text-sm leading-none">Klarisa</b>
            <small className="truncate text-[9px] text-slate-400">Workspace pribadi</small>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setIsOpen(false)}
          className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav aria-label="Menu workspace" className="grid gap-1 pt-4">
        {navigation.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#edf2ff] hover:text-klarisa-secondary",
                active && "bg-[#eaf0ff] text-klarisa-secondary",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-3 px-2 pt-8 text-[10px] text-slate-500">
        <b className="text-[9px] tracking-[0.18em] text-slate-400">TERKINI</b>
        {recentDocuments.map((document) => (
          <Link
            key={document}
            href="/dashboard/search"
            onClick={() => setIsOpen(false)}
            className="truncate transition-colors hover:text-klarisa-secondary"
          >
            {document}
          </Link>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-[#e7ebf1] px-2 pt-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#edf2ff] text-[10px] font-bold text-klarisa-secondary">
          {user.initials}
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <b className="truncate text-[10px]">{user.name}</b>
          <small className="truncate text-[9px] text-slate-400">{user.email}</small>
        </span>
        <button
          type="button"
          onClick={() => handleLogout()}
          disabled={isLoading}
          aria-label="Keluar dari workspace"
          className="grid size-9 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-svh bg-[#f7f8fb] text-[#172031] lg:grid lg:grid-cols-[216px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[216px] border-r border-[#e1e6ee] lg:block">
        {sidebar}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative h-full w-[min(86vw,300px)] border-r border-[#e1e6ee] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <section className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[#e1e6ee] bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[57px] lg:px-10">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Buka menu workspace"
            className="grid size-10 place-items-center rounded-md border border-slate-200 text-slate-700 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <b className="text-[9px] tracking-[0.18em] text-klarisa-secondary">WORKSPACE</b>
          <span className="ml-auto hidden text-[10px] text-slate-400 sm:block">
            Dokumen dan keputusan Anda tersimpan di satu tempat.
          </span>
          <Link
            href="/dashboard/search"
            aria-label="Cari dokumen"
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition-colors hover:border-klarisa-secondary hover:text-klarisa-secondary sm:ml-2"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Cari dokumen</span>
          </Link>
        </header>
        {children}
      </section>
    </main>
  );
}
