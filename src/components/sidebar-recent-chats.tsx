"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { ActionPopover } from "@/components/ui/action-popover";
import { FormDialog } from "@/components/ui/form-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { SearchChatDialog } from "@/components/draf/chat-ai/search-chat-dialog";
import { cn } from "@/lib/utils";
import { CHAT_EVENTS, dispatchChatSelect } from "@/lib/chat-events";
import type { ChatRow } from "@/types/chat.type";

export interface SidebarRecentChatsProps {
  /** Optional preloaded chats from server */
  initialChats?: ChatRow[];
  /** Callback fired when navigating to close mobile drawer */
  onCloseSidebar?: () => void;
  /** Custom wrapper CSS class */
  className?: string;
}

/**
 * Internal chat list that safely accesses useSearchParams inside Suspense.
 */
function RecentChatsList({
  initialChats = [],
  onCloseSidebar,
  className,
}: SidebarRecentChatsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchChatId = searchParams?.get("chat_id");
  const [currentChatId, setCurrentChatId] = useState<string | null>(searchChatId);

  useEffect(() => {
    setCurrentChatId(searchChatId);
  }, [searchChatId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ chat: ChatRow }>;
      if (customEvent.detail?.chat?.id) {
        setCurrentChatId(customEvent.detail.chat.id);
      }
    };

    const handleReset = () => {
      setCurrentChatId(null);
    };

    const handleDeleted = (event: Event) => {
      const { chatId: deletedId } = (
        event as CustomEvent<{ chatId: string }>
      ).detail;
      setCurrentChatId((prev) => (prev === deletedId ? null : prev));
    };

    window.addEventListener(CHAT_EVENTS.CREATED, handleCreated);
    window.addEventListener(CHAT_EVENTS.RESET, handleReset);
    window.addEventListener(CHAT_EVENTS.DELETED, handleDeleted);
    return () => {
      window.removeEventListener(CHAT_EVENTS.CREATED, handleCreated);
      window.removeEventListener(CHAT_EVENTS.RESET, handleReset);
      window.removeEventListener(CHAT_EVENTS.DELETED, handleDeleted);
    };
  }, []);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [renameChat, setRenameChat] = useState<ChatRow | null>(null);
  const [deleteChat, setDeleteChat] = useState<ChatRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    chats,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    containerRef,
    handleScroll,
    handleRenameChat,
    handleDeleteChat,
  } = useChat({
    enabled: true,
    limit: 15,
    initialChats,
  });

  const handleConfirmRename = async (newTitle: string) => {
    if (!renameChat) return false;
    const trimmed = newTitle.trim();
    if (!trimmed) return false;

    setIsSubmitting(true);
    try {
      const success = await handleRenameChat(renameChat.id, trimmed);
      if (success) {
        setRenameChat(null);
        return true;
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteChat) return;

    setIsSubmitting(true);
    try {
      const success = await handleDeleteChat(deleteChat.id, currentChatId ?? undefined);
      if (success) {
        setDeleteChat(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("grid pt-6 text-xs text-slate-500 pb-10", className)}>
      {/* Header section with TERKINI and Search button aligned with nav */}
      <div className="flex items-center justify-between px-2 pr-3 pb-2">
        <b className="text-xs font-bold tracking-wider text-slate-400 uppercase">TERKINI</b>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Cari percakapan"
          title="Cari percakapan"
          className="size-7 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <Search className="size-3.5" />
        </Button>
      </div>

      {/* Chats list or Empty state with hover-only scrollbar flush to the right border */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col gap-0.5 max-h-[calc(100vh-380px)] overflow-y-auto pb-3 pr-0 scrollbar-hover"
      >
        {isLoading && chats.length === 0 ? (
          <div className="space-y-2 py-1 mr-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        ) : chats.length === 0 ? (
          <span className="text-xs leading-5 text-slate-400 mr-2">Belum ada percakapan</span>
        ) : (
          <>
            {chats.map((chat) => {
              const isCurrent = chat.id === currentChatId;
              const displayTitle = chat.title?.trim() || "Percakapan baru";

              return (
                <Link
                  key={chat.id}
                  href={`/dashboard/create?chat_id=${chat.id}`}
                  onClick={() => {
                    dispatchChatSelect(chat.id);
                    setCurrentChatId(chat.id);
                    onCloseSidebar?.();
                  }}
                  className={cn(
                    "group relative flex items-center justify-between gap-1 rounded-md pl-2 pr-1.5 py-1.5 transition-colors hover:bg-[#edf2ff] mr-2 cursor-pointer",
                    isCurrent && "bg-[#edf2ff] text-klarisa-secondary font-medium"
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs transition-colors text-left",
                      isCurrent
                        ? "font-semibold text-klarisa-secondary"
                        : "font-medium text-slate-600 group-hover:text-klarisa-secondary"
                    )}
                    title={displayTitle}
                  >
                    {displayTitle}
                  </span>

                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className={cn(
                      "shrink-0 transition-opacity",
                      activePopoverId === chat.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <ActionPopover
                      open={activePopoverId === chat.id}
                      onOpenChange={(open) => setActivePopoverId(open ? chat.id : null)}
                      align="end"
                      sideOffset={4}
                      className="w-32 p-1"
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Opsi percakapan"
                          className="size-6 p-0 text-slate-400 hover:text-slate-700"
                        >
                          <MoreVertical className="size-3.5" />
                        </Button>
                      }
                      items={[
                        {
                          text: "Ganti nama",
                          icon: <Pencil className="size-3.5 text-slate-500" />,
                          onClick: () => setRenameChat(chat),
                        },
                        {
                          text: "Hapus",
                          icon: <Trash2 className="size-3.5 text-red-500" />,
                          variant: "destructive",
                          onClick: () => setDeleteChat(chat),
                        },
                      ]}
                    />
                  </div>
                </Link>
              );
            })}

            {/* Lazy Pagination Sentinel & Loader */}
            {hasMore && !isLoadingMore && (
              <div ref={sentinelRef} className="h-1 w-full pointer-events-none" aria-hidden="true" />
            )}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-2 text-slate-400 mr-1.5">
                <Loader2 className="size-3.5 animate-spin text-klarisa-primary" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <SearchChatDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        currentChatId={currentChatId}
        onSelectChat={(chatId) => {
          router.push(`/dashboard/create?chat_id=${chatId}`);
          onCloseSidebar?.();
        }}
        initialChats={chats}
      />

      <FormDialog
        open={!!renameChat}
        onOpenChange={(open) => {
          if (!open) setRenameChat(null);
        }}
        title="Ganti Nama Percakapan"
        item="Percakapan"
        defaultValue={renameChat?.title?.trim() || ""}
        isLoading={isSubmitting}
        onConfirm={handleConfirmRename}
      />

      <DeleteDialog
        open={!!deleteChat}
        onOpenChange={(open) => {
          if (!open) setDeleteChat(null);
        }}
        title="Hapus Percakapan"
        item={deleteChat?.title?.trim() || "Percakapan"}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

/**
 * Sidebar component displaying recent chats with Suspense boundary.
 */
export function SidebarRecentChats(props: SidebarRecentChatsProps) {
  return (
    <Suspense
      fallback={
        <div className={cn("grid gap-2 px-2 pt-6 text-xs text-slate-500", props.className)}>
          <div className="flex items-center justify-between">
            <b className="text-xs font-bold tracking-wider text-slate-400 uppercase">TERKINI</b>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              className="size-7 p-0 text-slate-400"
            >
              <Search className="size-3.5" />
            </Button>
          </div>
          <div className="space-y-2 py-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      }
    >
      <RecentChatsList {...props} />
    </Suspense>
  );
}
