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
import { Button, SubmitButton } from "@/components/ui/button";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { handleLogout, isLoading } = useAuth();

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
            <small className="truncate text-xs text-slate-400">Workspace pribadi</small>
          </span>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          aria-label={isSidebarCollapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
          title={isSidebarCollapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
          className={cn("hidden lg:inline-flex", isSidebarCollapsed && "lg:hidden")}
        >
          <PanelLeftClose className="size-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Tutup menu"
          onClick={() => setIsOpen(false)}
          className="lg:hidden"
        >
          <X className="size-4" />
        </Button>
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label="Perluas sidebar"
            title="Perluas sidebar"
            className="justify-self-center"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      )}


      <div className={cn("grid gap-2 px-2 pt-8 text-xs text-slate-500", isSidebarCollapsed && "lg:hidden")}>
        <b className="text-xs font-bold tracking-wider text-slate-400 uppercase">TERKINI</b>
        {recentDocuments.map((document) => (
          <Link
            key={document.id}
            href={`/dashboard/create?id=${document.id}`}
            onClick={() => setIsOpen(false)}
            className="truncate text-xs font-medium text-slate-600 transition-colors hover:text-klarisa-secondary"
          >
            {document.title}
          </Link>
        ))}
        {recentDocuments.length === 0 && <span className="text-xs leading-5 text-slate-400">Belum ada draft terbaru.</span>}
      </div>

      <div className={cn("mt-auto flex items-center gap-2 border-t border-[#e7ebf1] px-2 pt-4", isSidebarCollapsed && "lg:justify-center")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#edf2ff] text-xs font-bold text-klarisa-secondary">
          {user.initials}
        </span>
        <span className={cn("grid min-w-0 flex-1 gap-0.5", isSidebarCollapsed && "lg:hidden")}>
          <b className="truncate text-xs font-semibold">{user.name}</b>
          <small className="truncate text-xs text-slate-400">{user.email}</small>
        </span>
        <SubmitButton
          type="button"
          variant="ghost"
          size="icon"
          isLoading={isLoading}
          onClick={() => handleLogout()}
          aria-label="Keluar dari workspace"
          className={cn(isSidebarCollapsed && "lg:hidden")}
        >
          <LogOut className="size-4" />
        </SubmitButton>
      </div>
    </div>
  );

  return (
    <main className={cn("min-h-svh bg-[#f7f8fb] text-[#172031] lg:grid lg:h-svh lg:min-h-0 lg:overflow-hidden", isSidebarCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[216px_minmax(0,1fr)]")}>
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

      <section className="relative min-w-0 lg:col-start-2 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Buka menu navigation"
          aria-controls="workspace-navigation"
          aria-expanded={isOpen}
          className="fixed top-3 left-3 z-40 bg-white/90 shadow-sm backdrop-blur lg:hidden"
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0">{children}</div>
      </section>
    </main>
  );
}
