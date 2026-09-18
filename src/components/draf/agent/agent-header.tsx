"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionPopover } from "@/components/ui/action-popover";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { SearchChatDialog } from "@/components/draf/chat-ai/search-chat-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

export interface AgentHeaderProps {
  /** Chat title text */
  title: string;
  /** Chat ID if persisted in database */
  chatId: string | null;
  /** Callback fired when user renames the chat title */
  onRename?: (newTitle: string) => void;
  /** Callback fired when user starts a new conversation */
  onNewChat?: () => void;
  /** Callback fired when user deletes the chat */
  onDelete?: () => void;
  /** Callback fired when user selects a chat from the search dialog */
  onSelectChat?: (chatId: string) => void;
  /** Callback fired to open search dialog externally */
  onOpenSearch?: () => void;
  /** Callback fired when user clicks chevron right to close/collapse panel */
  onClose?: () => void;
  /** Whether chat details are currently loading */
  isLoading?: boolean;
  /** Whether actions should be disabled (e.g. while streaming) */
  isActionDisabled?: boolean;
  /** Whether the conversation is empty */
  isEmpty?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sticky header component for active AI agent panel sessions.
 * Features transparent background with progressive gradient blur,
 * chat title with dropdown popover (Percakapan baru, Ganti nama, Hapus),
 * and a chevron right button.
 */
export function AgentHeader({
  title,
  chatId,
  onRename,
  onNewChat,
  onDelete,
  onSelectChat,
  onOpenSearch,
  onClose,
  isLoading = false,
  isActionDisabled = false,
  isEmpty = false,
  className,
}: AgentHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    handleRenameChat,
    handleDeleteChat,
    isSubmitting: isChatSubmitting,
  } = useChat();

  const displayTitle = title?.trim() || "Draf Kontrak";

  const handleNewChat = () => {
    setIsPopoverOpen(false);
    onNewChat?.();
  };

  const handleSaveRename = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("Nama percakapan tidak boleh kosong.");
      return false;
    }

    if (chatId) {
      const success = await handleRenameChat(chatId, trimmed);
      if (!success) {
        return false;
      }
    } else {
      toast.success("Judul percakapan berhasil diubah.");
    }

    onRename?.(trimmed);
    return true;
  };

  const handleConfirmDelete = async () => {
    if (chatId) {
      const success = await handleDeleteChat(chatId);
      if (!success) {
        return;
      }
    } else {
      toast.success("Percakapan berhasil dihapus.");
    }

    onDelete?.();
    setIsDeleteOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 mb-3 z-20 w-full transition-all duration-300 shrink-0",
          className
        )}
      >
        {/* Progressive gradient blur background matching create draf */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -bottom-6 -z-10 bg-gradient-to-b from-[#f7f8fb] from-60% via-[#f7f8fb]/90 via-80% to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_65%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_65%,transparent_100%)] dark:from-slate-950 dark:via-slate-950/90"
        />

        <div className="flex w-full items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isLoading ? (
              <div className="flex items-center gap-2 py-0.5 animate-in fade-in duration-200">
                <Skeleton className="h-4 w-28 sm:w-36 rounded" />
                <Skeleton className="size-5 rounded" />
              </div>
            ) : isEmpty ? null : (
              <>
                <span
                  title={displayTitle}
                  className="truncate text-xs font-semibold text-slate-800 max-w-[180px] sm:max-w-[220px] dark:text-slate-200"
                >
                  {displayTitle}
                </span>

                <ActionPopover
                  open={isPopoverOpen}
                  onOpenChange={setIsPopoverOpen}
                  align="start"
                  sideOffset={6}
                  className="w-44"
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      aria-label="Opsi percakapan"
                      className="h-6 w-6 p-0 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    >
                      <ChevronDown
                        className={cn(
                          "size-3.5 text-slate-500 transition-transform duration-200 dark:text-slate-400",
                          isPopoverOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  }
                  items={[
                    {
                      text: "Cari percakapan",
                      icon: <Search className="size-3.5 text-slate-500" />,
                      onClick: () => {
                        setIsPopoverOpen(false);
                        if (onOpenSearch) {
                          onOpenSearch();
                        } else {
                          setIsSearchOpen(true);
                        }
                      },
                    },
                    {
                      text: "Percakapan baru",
                      icon: <Plus className="size-3.5 text-slate-500" />,
                      disabled: isActionDisabled,
                      onClick: handleNewChat,
                    },
                    {
                      text: "Ganti nama",
                      icon: <Pencil className="size-3.5 text-slate-500" />,
                      disabled: isActionDisabled,
                      onClick: () => setIsRenameOpen(true),
                    },
                  ]}
                  footer={[
                    {
                      text: "Hapus",
                      icon: <Trash2 className="size-3.5 text-red-500" />,
                      variant: "destructive",
                      disabled: isActionDisabled,
                      onClick: () => setIsDeleteOpen(true),
                    },
                  ]}
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label="Tutup panel"
                onClick={onClose}
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              >
                <ChevronRight className="size-3.5 text-slate-500" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <SearchChatDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        currentChatId={chatId}
        onSelectChat={(selectedId) => {
          setIsSearchOpen(false);
          onSelectChat?.(selectedId);
        }}
      />

      <FormDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        title="Ganti Nama Percakapan"
        defaultValue={displayTitle}
        isLoading={isChatSubmitting}
        onConfirm={handleSaveRename}
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Percakapan"
        item={displayTitle}
        isLoading={isChatSubmitting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
