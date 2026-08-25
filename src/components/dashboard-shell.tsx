"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FilePlus2,
  FileSearch,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
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

type DashboardShellProps = {
  children: React.ReactNode;
  recentDocuments: Array<{ id: string; title: string }>;
  user: {
    name: string;
    email: string;
    initials: string;
  };
};

export function DashboardShell({ children, user, recentDocuments }: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { handleLogout, isLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const sidebar = (
    <div className={cn("flex h-full flex-col bg-white px-3 py-5 text-[#172031]", isSidebarCollapsed && "lg:px-1")}>
      <div className={cn("flex items-center gap-2 border-b border-[#e7ebf1] px-2 pb-5", isSidebarCollapsed && "lg:gap-1 lg:px-0")}>
        <Link href="/" className={cn("flex min-w-0 flex-1 items-center gap-2", isSidebarCollapsed && "lg:w-full lg:flex-none lg:justify-center")} onClick={() => setIsOpen(false)}>
          <Image src="/klarisa/logo.png" alt="Klarisa" width={25} height={25} className="size-6 object-contain" />
          <span className={cn("grid min-w-0 gap-0.5", isSidebarCollapsed && "lg:hidden")}>
            <b className="text-sm leading-none">Klarisa</b>
            <small className="truncate text-[9px] text-slate-400">Workspace pribadi</small>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          aria-label={isSidebarCollapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
          title={isSidebarCollapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
          className={cn("hidden size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:border-klarisa-secondary hover:text-klarisa-secondary lg:grid", isSidebarCollapsed && "lg:hidden")}
        >
          <PanelLeftClose className="size-4" />
        </button>

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
              aria-current={active ? "page" : undefined}
              title={isSidebarCollapsed ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#edf2ff] hover:text-klarisa-secondary",
                active && "bg-[#eaf0ff] text-klarisa-secondary",
                isSidebarCollapsed && "lg:!h-11 lg:!w-11 lg:!min-h-0 lg:justify-self-center lg:justify-center lg:px-0",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className={cn(isSidebarCollapsed && "lg:sr-only")}>{label}</span>
            </Link>
          );
        })}
      </nav>
      {isSidebarCollapsed && (
        <div className="mt-3 hidden border-t border-[#e7ebf1] pt-3 lg:grid">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label="Perluas sidebar"
            title="Perluas sidebar"
            className="grid size-10 place-items-center justify-self-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:border-klarisa-secondary hover:text-klarisa-secondary"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      )}


      <div className={cn("grid gap-3 px-2 pt-8 text-[10px] text-slate-500", isSidebarCollapsed && "lg:hidden")}>
        <b className="text-[9px] tracking-[0.18em] text-slate-400">TERKINI</b>
        {recentDocuments.map((document) => (
          <Link
            key={document.id}
            href={`/dashboard/create?id=${document.id}`}
            onClick={() => setIsOpen(false)}
            className="truncate transition-colors hover:text-klarisa-secondary"
          >
            {document.title}
          </Link>
        ))}
        {recentDocuments.length === 0 && <span className="leading-5 text-slate-400">Belum ada draft terbaru.</span>}
      </div>

      <div className={cn("mt-auto flex items-center gap-2 border-t border-[#e7ebf1] px-2 pt-4", isSidebarCollapsed && "lg:justify-center")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#edf2ff] text-[10px] font-bold text-klarisa-secondary">
          {user.initials}
        </span>
        <span className={cn("grid min-w-0 flex-1 gap-0.5", isSidebarCollapsed && "lg:hidden")}>
          <b className="truncate text-[10px]">{user.name}</b>
          <small className="truncate text-[9px] text-slate-400">{user.email}</small>
        </span>
        <button
          type="button"
          onClick={() => handleLogout()}
          disabled={isLoading}
          aria-label="Keluar dari workspace"
          className={cn("grid size-9 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50", isSidebarCollapsed && "lg:hidden")}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <main className={cn("min-h-svh bg-[#f7f8fb] text-[#172031] lg:grid", isSidebarCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[216px_minmax(0,1fr)]")}>
      <aside className={cn("fixed inset-y-0 left-0 z-50 hidden border-r border-[#e1e6ee] transition-[width] duration-200 lg:block", isSidebarCollapsed ? "w-[72px]" : "w-[216px]")}>
        {sidebar}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <aside id="workspace-navigation" aria-label="Navigasi workspace" className="relative h-full w-[min(86vw,300px)] border-r border-[#e1e6ee] shadow-2xl">
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
            aria-controls="workspace-navigation"
            aria-expanded={isOpen}
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
