"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionPopover } from "@/components/ui/action-popover";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { SearchChatDialog } from "./search-chat-dialog";
import { updateChatTitleAction, deleteChatAction } from "@/app/actions/chat.action";
import { dispatchChatUpdated, dispatchChatDeleted } from "@/lib/chat-events";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ChatHeaderProps {
  /** Chat title text */
  title: string | null;
  /** Chat ID if persisted in database */
  chatId: string | null;
  /** Callback fired when user renames the chat title */
  onRename?: (newTitle: string) => void;
  /** Callback fired when user deletes the chat */
  onDelete?: () => void;
  /** Callback fired when user starts a new conversation */
  onNewChat?: () => void;
  /** Callback fired when a chat item is selected from search dialog */
  onSelectChat?: (chatId: string) => void;
  /** Optional custom CSS classes */
  className?: string;
  /** Whether chat details are currently loading */
  isLoading?: boolean;
  /** Whether AI generation or database persistence is currently in progress */
  isActionDisabled?: boolean;
}

/**
 * Sticky header component for active draft chat sessions.
 * Displays chat title, dropdown options popover (Percakapan baru, Ganti Nama, Hapus),
 * and handles rename / delete dialog workflows.
 */
export function ChatHeader({
  title,
  chatId,
  onRename,
  onDelete,
  onNewChat,
  onSelectChat,
  className,
  isLoading = false,
  isActionDisabled = false,
}: ChatHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      if (chatId) {
        const res = await updateChatTitleAction(chatId, trimmed);
        if (!res.success) {
          toast.error(res.error ?? "Gagal mengganti nama percakapan.");
          return false;
        }
        dispatchChatUpdated(chatId, trimmed);
      }

      onRename?.(trimmed);
      toast.success("Nama percakapan berhasil diperbarui.");
      return true;
    } catch {
      toast.error("Terjadi kesalahan saat mengganti nama percakapan.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      if (chatId) {
        const res = await deleteChatAction(chatId);
        if (!res.success) {
          toast.error(res.error ?? "Gagal menghapus percakapan.");
          return;
        }
        dispatchChatDeleted(chatId);
      }

      onDelete?.();
      toast.success("Percakapan berhasil dihapus.");
      setIsDeleteOpen(false);
    } catch {
      toast.error("Terjadi kesalahan saat menghapus percakapan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-20 w-full  transition-all duration-300",
          className
        )}
      >
        {/* Progressive gradient blur background that smoothly fades from top to bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -bottom-6 -z-10 bg-gradient-to-b from-[#f7f8fb] from-60% via-[#f7f8fb]/90 via-80% to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_65%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_65%,transparent_100%)]"
        />

        <div className="flex w-full items-center justify-between px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isLoading ? (
              <div className="flex items-center gap-2 py-0.5 animate-in fade-in duration-200">
                <Skeleton className="h-4 w-32 sm:w-48 rounded" />
                <Skeleton className="size-5 rounded" />
              </div>
            ) : (
              <>
                <span
                  title={displayTitle}
                  className="truncate text-xs font-semibold text-slate-800 max-w-[220px] sm:max-w-md dark:text-slate-200"
                >
                  {displayTitle}
                </span>

                <ActionPopover
                  modal
                  open={isPopoverOpen}
                  onOpenChange={setIsPopoverOpen}
                  align="start"
                  sideOffset={6}
                  className="w-40 z-[150]"
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      aria-label="Opsi percakapan"
                      className="h-6 w-6 p-0 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer"
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
                      text: "Cari",
                      icon: <Search className="size-3.5 text-slate-500" />,
                      onClick: () => setIsSearchOpen(true),
                    },
                    {
                      text: "Percakapan baru",
                      icon: <Plus className="size-3.5 text-slate-500" />,
                      disabled: isActionDisabled,
                      onClick: handleNewChat,
                    },
                    {
                      text: "Ganti Nama",
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
        </div>
      </header>

      <FormDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        title="Ganti Nama Percakapan"
        defaultValue={displayTitle}
        isLoading={isSubmitting}
        onConfirm={handleSaveRename}
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={"Hapus Percakapan"}
        item={title || "Percakapan"}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
      />

      <SearchChatDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        currentChatId={chatId}
        onSelectChat={onSelectChat}
      />
    </>
  );
}
