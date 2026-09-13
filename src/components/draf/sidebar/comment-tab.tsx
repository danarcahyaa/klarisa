"use client";

import { MessageSquare, X } from "lucide-react";
import type { DraftComment } from "@/types/contract.type";
import { Button } from "@/components/ui/button";
import { DraftDiscussionThread } from "@/components/draft-discussion-thread";

export interface CommentTabProps {
  comments?: DraftComment[];
  canEdit?: boolean;
  canComment?: boolean;
  selectedDraftText?: string;
  onClearSelectedText?: () => void;
  onFocusCommentSource?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onUpdateComment?: (commentId: string, body: string) => Promise<boolean>;
  onDeleteComment?: (commentId: string) => Promise<boolean>;
  onSetResolved?: (commentId: string, resolved: boolean) => Promise<boolean>;
}

/**
 * Comment tab component showing discussion comments, selected text targets, and replies.
 */
export function CommentTab({
  comments = [],
  canEdit = true,
  canComment = true,
  selectedDraftText = "",
  onClearSelectedText = () => {},
  onFocusCommentSource = () => {},
  onReply = () => {},
  onUpdateComment = async () => true,
  onDeleteComment = async () => true,
  onSetResolved = async () => true,
}: CommentTabProps) {
  const rootCommentsCount = comments.filter((c) => !c.parentId).length;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            Komentar & Diskusi
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {rootCommentsCount}
            </span>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Diskusi dan masukan dari anggota tim terkait dokumen ini.
          </p>
        </div>
      </div>

      {/* Selected Draft Text Callout */}
      {selectedDraftText && (
        <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase flex items-center gap-1">
              <MessageSquare className="size-3 text-amber-600" />
              Teks Yang Dipilih
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={onClearSelectedText}
              aria-label="Batalkan teks yang dipilih"
              className="size-5 hover:bg-amber-100 text-amber-700"
            >
              <X className="size-3" />
            </Button>
          </div>
          <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed italic text-amber-950">
            "{selectedDraftText}"
          </p>
        </div>
      )}

      {/* Discussion Thread */}
      <DraftDiscussionThread
        comments={comments}
        canManage={canEdit}
        canComment={canComment}
        isPending={false}
        onFocusSource={onFocusCommentSource}
        onReply={onReply}
        onUpdate={onUpdateComment}
        onDelete={onDeleteComment}
        onSetResolved={onSetResolved}
      />
    </div>
  );
}