"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  FilePen,
  FileSearch,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button, SubmitButton } from "@/components/ui/button";
import { ActionPopover } from "@/components/ui/action-popover";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { SidebarRecentChats } from "@/components/sidebar-recent-chats";
import { SearchChatDialog } from "@/components/draf/chat-ai/search-chat-dialog";
import { updateChatTitleAction, deleteChatAction } from "@/app/actions/chat.action";
import {
  CHAT_EVENTS,
  type ChatSelectEventDetail,
  type ChatUpdatedEventDetail,
  type ChatTitleChangeEventDetail,
  dispatchChatReset,
  dispatchChatUpdated,
  dispatchChatDeleted,
} from "@/lib/chat-events";
import { useCreateDraftNavigation } from "@/hooks/useCreateDraftNavigation";
import type { ChatRow } from "@/types/chat.type";

const navigation = [
  { label: "Cari kontrak", href: "/dashboard", icon: Search, exact: true },
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
    avatarUrl?: string | null;
  };
};

function getPageSubtitle(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/dashboard/search") return "CARI KONTRAK";
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
  const searchChatId = searchParams?.get("chat_id") || null;
  const initialTitleFromChats = initialChats?.find((c) => c.id === searchChatId)?.title || null;
  const [activeChatId, setActiveChatId] = useState<string | null>(searchChatId);
  const [activeChatTitle, setActiveChatTitle] = useState<string | null>(initialTitleFromChats);
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [isMobileChatPopoverOpen, setIsMobileChatPopoverOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { handleLogout, isLoading } = useAuth();
  const { handleNavigateToCreateDraft } = useCreateDraftNavigation();

  useEffect(() => {
    setActiveChatId(searchChatId);
    if (!searchChatId) {
      setActiveChatTitle(null);
    } else {
      const matchingChat = initialChats?.find((c) => c.id === searchChatId);
      if (matchingChat?.title) {
        setActiveChatTitle(matchingChat.title);
      }
    }
  }, [searchChatId, initialChats]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSelect = (event: Event) => {
      const { chatId } = (event as CustomEvent<ChatSelectEventDetail>).detail;
      if (chatId) {
        setActiveChatId(chatId);
        const matchingChat = initialChats?.find((c) => c.id === chatId);
        if (matchingChat?.title) {
          setActiveChatTitle(matchingChat.title);
        }
      }
    };

    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ chat: ChatRow }>;
      if (customEvent.detail?.chat?.id) {
        setActiveChatId(customEvent.detail.chat.id);
        if (customEvent.detail.chat.title) {
          setActiveChatTitle(customEvent.detail.chat.title);
        }
      }
    };

    const handleUpdated = (event: Event) => {
      const { chatId, title } = (event as CustomEvent<ChatUpdatedEventDetail>).detail;
      if (chatId === activeChatId) {
        setActiveChatTitle(title);
      }
    };

    const handleTitleChange = (event: Event) => {
      const { title, chatId } = (event as CustomEvent<ChatTitleChangeEventDetail>).detail;
      setActiveChatTitle(title);
      if (chatId) {
        setActiveChatId(chatId);
      }
    };

    const handleReset = () => {
      setActiveChatId(null);
      setActiveChatTitle(null);
    };

    const handleDeleted = (event: Event) => {
      const { chatId: deletedId } = (
        event as CustomEvent<{ chatId: string }>
      ).detail;
      setActiveChatId((prev) => (prev === deletedId ? null : prev));
      if (deletedId === activeChatId) {
        setActiveChatTitle(null);
      }
    };

    window.addEventListener(CHAT_EVENTS.SELECT, handleSelect);
    window.addEventListener(CHAT_EVENTS.CREATED, handleCreated);
    window.addEventListener(CHAT_EVENTS.UPDATED, handleUpdated);
    window.addEventListener(CHAT_EVENTS.TITLE_CHANGE, handleTitleChange);
    window.addEventListener(CHAT_EVENTS.RESET, handleReset);
    window.addEventListener(CHAT_EVENTS.DELETED, handleDeleted);
    return () => {
      window.removeEventListener(CHAT_EVENTS.SELECT, handleSelect);
      window.removeEventListener(CHAT_EVENTS.CREATED, handleCreated);
      window.removeEventListener(CHAT_EVENTS.UPDATED, handleUpdated);
      window.removeEventListener(CHAT_EVENTS.TITLE_CHANGE, handleTitleChange);
      window.removeEventListener(CHAT_EVENTS.RESET, handleReset);
      window.removeEventListener(CHAT_EVENTS.DELETED, handleDeleted);
    };
  }, [activeChatId, initialChats]);

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

  const handleMobileNewChat = () => {
    setIsMobileChatPopoverOpen(false);
    setActiveChatId(null);
    setActiveChatTitle(null);
    handleNavigateToCreateDraft();
  };

  const handleSaveRename = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("Nama percakapan tidak boleh kosong.");
      return false;
    }

    setIsSubmittingRename(true);
    try {
      if (activeChatId) {
        const res = await updateChatTitleAction(activeChatId, trimmed);
        if (!res.success) {
          toast.error(res.error ?? "Gagal mengganti nama percakapan.");
          return false;
        }
        dispatchChatUpdated(activeChatId, trimmed);
      }

      setActiveChatTitle(trimmed);
      toast.success("Nama percakapan berhasil diperbarui.");
      return true;
    } catch {
      toast.error("Terjadi kesalahan saat mengganti nama percakapan.");
      return false;
    } finally {
      setIsSubmittingRename(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSubmittingDelete(true);
    try {
      if (activeChatId) {
        const res = await deleteChatAction(activeChatId);
        if (!res.success) {
          toast.error(res.error ?? "Gagal menghapus percakapan.");
          return;
        }
        dispatchChatDeleted(activeChatId);
      }

      dispatchChatReset();
      setActiveChatId(null);
      setActiveChatTitle(null);
      router.push("/dashboard/create");
      toast.success("Percakapan berhasil dihapus.");
      setIsDeleteOpen(false);
    } catch {
      toast.error("Terjadi kesalahan saat menghapus percakapan.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

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

      <nav aria-label="Menu workspace" className="grid gap-1 pt-4 pr-3 shrink-0">
        {navigation.map(({ label, href, icon: Icon, exact }) => {
          const isCreateContract = href === "/dashboard/create";
          const isRecentChatActive = Boolean(activeChatId);
          // If on /dashboard/create viewing a recent chat from TERKINI, "Buat kontrak" should NOT be active
          const active = isCreateContract
            ? pathname === href && !isRecentChatActive
            : (exact ? pathname === href : pathname.startsWith(href));

          if (isCreateContract) {
            return (
              <button
                key={href}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveChatId(null);
                  setActiveChatTitle(null);
                  handleNavigateToCreateDraft();
                }}
                aria-current={active ? "page" : undefined}
                title={isSidebarCollapsed ? label : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#edf2ff] hover:text-klarisa-secondary outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 w-full text-left cursor-pointer",
                  active && "bg-[#eaf0ff] text-klarisa-secondary",
                  isSidebarCollapsed && "lg:!h-11 lg:!w-11 lg:!min-h-0 lg:justify-self-center lg:justify-center lg:px-0",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className={cn(isSidebarCollapsed && "lg:sr-only")}>{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              aria-current={active ? "page" : undefined}
              title={isSidebarCollapsed ? label : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#edf2ff] hover:text-klarisa-secondary outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
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
        <div className="hidden lg:grid pt-1 pr-3 shrink-0">
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
        className={cn("flex-1 min-h-0", isSidebarCollapsed && "lg:hidden")}
        initialChats={initialChats}
        onCloseSidebar={() => setIsOpen(false)}
      />

      <div className={cn("mt-auto shrink-0 flex items-center gap-2 border-t border-[#e7ebf1] px-2 pr-3 pt-4", isSidebarCollapsed && "lg:justify-center")}>
        {user.avatarUrl && !avatarError ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            onError={() => setAvatarError(true)}
            className="size-8 shrink-0 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#edf2ff] text-xs font-bold text-klarisa-secondary">
            {user.initials}
          </span>
        )}
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
          title="Keluar dari workspace"
          className={cn(isSidebarCollapsed && "lg:hidden")}
        >
          <LogOut className="size-4" />
        </SubmitButton>
      </div>
    </div>
  );

  const isDraftDetail = pathname.startsWith("/dashboard/draft");
  const isFixedWorkspace =
    isDraftDetail ||
    pathname.startsWith("/dashboard/review/result") ||
    pathname.startsWith("/dashboard/create");

  return (
    <main
      className={cn(
        "bg-[#f7f8fb] text-[#172031] transition-[grid-template-columns] duration-300 ease-in-out lg:grid lg:h-svh lg:min-h-0 lg:overflow-hidden",
        isFixedWorkspace ? "h-svh overflow-hidden flex flex-col" : "min-h-svh",
        isSidebarCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[216px_minmax(0,1fr)]"
      )}
    >
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

      <section
        className={cn(
          "relative min-w-0 max-w-full overflow-x-clip lg:col-start-2 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto",
          isFixedWorkspace && "h-full flex flex-col min-h-0 overflow-hidden lg:overflow-y-hidden"
        )}
      >
        {/* Mobile Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[#e1e6ee] bg-[#f7f8fb] px-4 lg:hidden">
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

          {(() => {
            const isDraftRoute =
              pathname.startsWith("/dashboard/create") ||
              pathname.startsWith("/dashboard/draft");
            const isDraftWithChat = isDraftRoute && Boolean(activeChatTitle?.trim());
            const mobileSubtitle = isDraftWithChat
              ? activeChatTitle?.trim()
              : pageSubtitle;

            if (isDraftWithChat) {
              return (
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span
                    title={mobileSubtitle ?? undefined}
                    className="truncate text-xs font-semibold text-slate-800"
                  >
                    {mobileSubtitle}
                  </span>

                  <ActionPopover
                    open={isMobileChatPopoverOpen}
                    onOpenChange={setIsMobileChatPopoverOpen}
                    align="start"
                    sideOffset={6}
                    className="w-40"
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        aria-label="Opsi percakapan"
                      >
                        <ChevronDown
                          className={cn(
                            "size-3.5 transition-transform duration-200",
                            isMobileChatPopoverOpen && "rotate-180"
                          )}
                        />
                      </Button>
                    }
                    items={[
                      {
                        text: "Cari",
                        icon: <Search className="size-3.5 text-slate-500" />,
                        onClick: () => setIsSearchChatOpen(true),
                      },
                      {
                        text: "Percakapan baru",
                        icon: <Plus className="size-3.5 text-slate-500" />,
                        onClick: handleMobileNewChat,
                      },
                      {
                        text: "Ganti Nama",
                        icon: <Pencil className="size-3.5 text-slate-500" />,
                        onClick: () => setIsRenameOpen(true),
                      },
                    ]}
                    footer={[
                      {
                        text: "Hapus",
                        icon: <Trash2 className="size-3.5 text-red-500" />,
                        variant: "destructive",
                        onClick: () => setIsDeleteOpen(true),
                      },
                    ]}
                  />
                </div>
              );
            }

            return (
              <span
                title={mobileSubtitle ?? undefined}
                className="text-xs truncate flex-1 min-w-0 text-klarisa-secondary font-bold tracking-wider uppercase"
              >
                {mobileSubtitle}
              </span>
            );
          })()}
        </header>

        <div className={cn("min-w-0", isFixedWorkspace && "flex-1 min-h-0 flex flex-col overflow-hidden")}>{children}</div>
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

      {/* Mobile Rename Chat Dialog */}
      <FormDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        item="Percakapan"
        title="Ganti Nama Percakapan"
        defaultValue={activeChatTitle || "Draf Kontrak"}
        isLoading={isSubmittingRename}
        onConfirm={handleSaveRename}
      />

      {/* Mobile Delete Chat Dialog */}
      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Percakapan"
        item={activeChatTitle || "Percakapan"}
        isLoading={isSubmittingDelete}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
