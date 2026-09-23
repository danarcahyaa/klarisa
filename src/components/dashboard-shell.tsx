"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FilePen,
  FileSearch,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button, SubmitButton } from "@/components/ui/button";
import { SidebarRecentChats } from "@/components/sidebar-recent-chats";
import { SearchChatDialog } from "@/components/draf/chat-ai/search-chat-dialog";
import {
  CHAT_EVENTS,
  type ChatSelectEventDetail,
  dispatchChatReset,
} from "@/lib/chat-events";
import type { ChatRow } from "@/types/chat.type";

const navigation = [
  { label: "Cari kontrak", href: "/dashboard/search", icon: Search, exact: true },
  { label: "Review kontrak", href: "/dashboard/review", icon: FileSearch, exact: false },
  { label: "Draft kontrak", href: "/dashboard/create", icon: FilePen, exact: false },
] as const;

type DashboardShellProps = {
  children: React.ReactNode;
  recentDocuments?: Array<{ id: string; title: string }>;
  initialChats?: ChatRow[];
  user: {
    name: string;
    email: string;
    initials: string;
  };
};

function getPageSubtitle(pathname: string): string {
  if (pathname === "/dashboard/search") return "CARI KONTRAK";
  if (pathname.startsWith("/dashboard/review")) return "REVIEW KONTRAK";
  if (pathname.startsWith("/dashboard/create") || pathname.startsWith("/dashboard/draft")) return "DRAFT KONTRAK";
  if (pathname.startsWith("/dashboard/shared")) return "DRAFT DIBAGIKAN";
  return "WORKSPACE KONTRAK";
}

export function DashboardShell({ children, user, initialChats }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageSubtitle = getPageSubtitle(pathname);
  const searchParams = useSearchParams();
  const searchChatId = searchParams?.get("chat_id") || searchParams?.get("id") || null;
  const [activeChatId, setActiveChatId] = useState<string | null>(searchChatId);
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const { handleLogout, isLoading } = useAuth();

  useEffect(() => {
    setActiveChatId(searchChatId);
  }, [searchChatId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSelect = (event: Event) => {
      const { chatId } = (event as CustomEvent<ChatSelectEventDetail>).detail;
      if (chatId) {
        setActiveChatId(chatId);
      }
    };

    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ chat: ChatRow }>;
      if (customEvent.detail?.chat?.id) {
        setActiveChatId(customEvent.detail.chat.id);
      }
    };

    const handleReset = () => {
      setActiveChatId(null);
    };

    const handleDeleted = (event: Event) => {
      const { chatId: deletedId } = (
        event as CustomEvent<{ chatId: string }>
      ).detail;
      setActiveChatId((prev) => (prev === deletedId ? null : prev));
    };

    window.addEventListener(CHAT_EVENTS.SELECT, handleSelect);
    window.addEventListener(CHAT_EVENTS.CREATED, handleCreated);
    window.addEventListener(CHAT_EVENTS.RESET, handleReset);
    window.addEventListener(CHAT_EVENTS.DELETED, handleDeleted);
    return () => {
      window.removeEventListener(CHAT_EVENTS.SELECT, handleSelect);
      window.removeEventListener(CHAT_EVENTS.CREATED, handleCreated);
      window.removeEventListener(CHAT_EVENTS.RESET, handleReset);
      window.removeEventListener(CHAT_EVENTS.DELETED, handleDeleted);
    };
  }, []);

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
    <div className={cn("flex h-full flex-col bg-white pl-3 pr-0 py-5 text-[#172031] transition-all duration-300 ease-in-out", isSidebarCollapsed && "lg:px-1")}>
      <div className={cn("relative flex items-center border-b border-[#e7ebf1] px-2 pr-3 pb-3 transition-all duration-300 ease-in-out", isSidebarCollapsed ? "lg:justify-center lg:px-0" : "gap-2")}>
        {/* Logo and Brand Link (Visible on mobile and desktop when expanded) */}
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center transition-all duration-300 ease-in-out",
            isSidebarCollapsed
              ? "lg:pointer-events-none lg:absolute lg:opacity-0 lg:scale-90 lg:-translate-x-2"
              : "opacity-100 scale-100 translate-x-0"
          )}
        >
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2 outline-none focus:outline-none focus-visible:outline-none"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/klarisa/logo.png"
              alt="Klarisa"
              width={25}
              height={25}
              className="size-4.5 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="grid min-w-0 gap-0.5">
              <b className="text-sm leading-none text-slate-800">Klarisa</b>
            </span>
          </Link>
        </div>

        {/* Collapse Button (Visible on desktop when expanded) */}
        <div
          className={cn(
            "hidden lg:flex items-center transition-all duration-300 ease-in-out",
            isSidebarCollapsed
              ? "pointer-events-none absolute opacity-0 scale-75"
              : "opacity-100 scale-100"
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarCollapsed(true)}
            aria-label="Minimalkan sidebar"
            title="Minimalkan sidebar"
            className="size-9 rounded-md transition-all duration-200"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        {/* Expand Button (Replaces logo on desktop when collapsed) */}
        <div
          className={cn(
            "hidden lg:flex items-center justify-center transition-all duration-300 ease-in-out",
            isSidebarCollapsed
              ? "opacity-100 scale-100 translate-x-0"
              : "pointer-events-none absolute opacity-0 scale-75 -translate-x-2"
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label="Perluas sidebar"
            title="Perluas sidebar"
            className="size-9 rounded-md"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>

        {/* Mobile Close Button */}
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

      <nav aria-label="Menu workspace" className="grid gap-1 pt-4 pr-3">
        {navigation.map(({ label, href, icon: Icon, exact }) => {
          const isCreateContract = href === "/dashboard/create";
          const isRecentChatActive = Boolean(activeChatId);
          // If on /dashboard/create viewing a recent chat from TERKINI, "Buat kontrak" should NOT be active
          const active = isCreateContract
            ? pathname === href && !isRecentChatActive
            : (exact ? pathname === href : pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                setIsOpen(false);
                if (isCreateContract) {
                  dispatchChatReset();
                  setActiveChatId(null);
                }
              }}
              aria-current={active ? "page" : undefined}
              title={isSidebarCollapsed ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#edf2ff] hover:text-klarisa-secondary outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
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

      {/* Collapsed Search Chat Item with Divider */}
      {isSidebarCollapsed && (
        <div className="hidden lg:grid pt-1 pr-3">
          <div className="my-2 border-t border-[#e7ebf1] mx-1" />
          <button
            type="button"
            onClick={() => setIsSearchChatOpen(true)}
            title="Percakapan"
            aria-label="Tampilkan percakapan"
            className={cn(
              "flex h-11 w-11 cursor-pointer items-center justify-center justify-self-center rounded-md text-xs font-semibold text-slate-600 transition-colors hover:bg-[#edf2ff] hover:text-klarisa-secondary outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
              (isSearchChatOpen || Boolean(activeChatId)) && "bg-[#eaf0ff] text-klarisa-secondary",
            )}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span className="sr-only">Tampilkan percakapan</span>
          </button>
        </div>
      )}

      <SidebarRecentChats
        className={cn(isSidebarCollapsed && "lg:hidden")}
        initialChats={initialChats}
        onCloseSidebar={() => setIsOpen(false)}
      />

      <div className={cn("mt-auto flex items-center gap-2 border-t border-[#e7ebf1] px-2 pr-3 pt-4", isSidebarCollapsed && "lg:justify-center")}>
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
    <main className={cn("min-h-svh bg-[#f7f8fb] text-[#172031] transition-[grid-template-columns] duration-300 ease-in-out lg:grid lg:h-svh lg:min-h-0 lg:overflow-hidden", isSidebarCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[216px_minmax(0,1fr)]")}>
      <aside className={cn("fixed inset-y-0 left-0 z-50 hidden border-r border-[#e1e6ee] transition-[width] duration-300 ease-in-out lg:block", isSidebarCollapsed ? "w-[72px]" : "w-[216px]")}>
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
        {/* Mobile Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e1e6ee] bg-[#f7f8fb] px-4 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            aria-label="Buka menu navigasi"
            aria-controls="workspace-navigation"
            aria-expanded={isOpen}
            className="size-9 shrink-0 bg-white shadow-xs"
          >
            <Menu className="size-4.5" />
          </Button>

          <span className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase truncate">
            {pageSubtitle}
          </span>
        </header>

        <div className="min-w-0">{children}</div>
      </section>

      {/* Search Chat Modal Dialog */}
      <SearchChatDialog
        open={isSearchChatOpen}
        onOpenChange={setIsSearchChatOpen}
        currentChatId={activeChatId}
        onSelectChat={(chatId) => {
          setActiveChatId(chatId);
          router.push(`/dashboard/create?chat_id=${chatId}`);
          setIsSearchChatOpen(false);
          setIsOpen(false);
        }}
        initialChats={initialChats}
      />
    </main>
  );
}
