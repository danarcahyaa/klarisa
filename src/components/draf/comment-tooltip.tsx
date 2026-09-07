"use client";

import { MessageSquarePlus, Send, X } from "lucide-react";
import { useState, useEffect } from "react";

import { Button, SubmitButton } from "@/components/ui/button";

export interface CommentTooltipProps {
  position: { top: number; left: number } | null;
  selectedText: string;
  onAddComment: (commentText: string) => Promise<boolean | void>;
  onClose: () => void;
  isCommenting: boolean;
}

/**
 * Floating tooltip menu displayed directly above highlighted text in the draft editor.
 * Allows users to quickly enter and submit comments attached to the selected text range.
 */
export function CommentTooltip({
  position,
  selectedText,
  onAddComment,
  onClose,
  isCommenting,
}: CommentTooltipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    // Reset state when selection changes
    setIsExpanded(false);
    setCommentText("");
  }, [selectedText]);

  if (!position || !selectedText.trim()) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    await onAddComment(commentText.trim());
    setCommentText("");
    setIsExpanded(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: `${Math.max(10, position.top - 50)}px`,
        left: `${Math.max(10, position.left)}px`,
      }}
      className="z-[80] transition-all duration-150 animate-in fade-in zoom-in-95"
    >
      {!isExpanded ? (
        <Button
          variant="default"
          size="xs"
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl hover:bg-slate-800 hover:scale-105"
        >
          <MessageSquarePlus className="size-3.5 text-amber-400" />
          <span>Beri Komentar</span>
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <MessageSquarePlus className="size-3.5 text-klarisa-secondary" />
              Komentar untuk Teks
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={onClose}
              aria-label="Tutup tooltip komentar"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="mt-2 rounded bg-amber-50 p-2 text-[10px] text-amber-900 border-l-2 border-amber-400 font-medium line-clamp-2">
            "{selectedText}"
          </div>

          <textarea
            autoFocus
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
            placeholder="Tulis komentar atau permintaan revisi..."
            className="mt-2.5 w-full resize-none rounded-md border border-slate-200 p-2 text-xs outline-none focus:border-klarisa-secondary focus:ring-1 focus:ring-klarisa-secondary/20"
          />

          <div className="mt-2 flex items-center justify-between">
            <small className="text-[10px] text-slate-400">Tekan Enter ↵</small>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => setIsExpanded(false)}
              >
                Batal
              </Button>
              <SubmitButton
                variant="default"
                size="xs"
                type="submit"
                isLoading={isCommenting}
                disabled={!commentText.trim()}
                leftIcon={<Send className="size-3" />}
              >
                Kirim
              </SubmitButton>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
