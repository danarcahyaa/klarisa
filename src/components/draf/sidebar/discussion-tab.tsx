"use client";

import { X } from "lucide-react";
import type { DraftComment } from "@/types/contract.type";
import { Button } from "@/components/ui/button";
import { DraftDiscussionThread } from "@/components/draft-discussion-thread";

export interface DiscussionTabProps {
  comments: DraftComment[];
  canEdit: boolean;
  selectedDraftText: string;
  onClearSelectedText: () => void;
  onFocusCommentSource: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onUpdateComment: (commentId: string, body: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onSetResolved: (commentId: string, resolved: boolean) => Promise<boolean>;
}

/**
 * Discussion tab in draft editor sidebar listing user comments and selected text targets.
 */
export function DiscussionTab({
  comments,
  canEdit,
  selectedDraftText,
  onClearSelectedText,
  onFocusCommentSource,
  onReply,
  onUpdateComment,
  onDeleteComment,
  onSetResolved,
}: DiscussionTabProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="mt-3">
        <p className="text-xs font-semibold text-slate-700">
          Diskusi pihak terkait
        </p>
        <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
          Komentar dari orang yang terlibat dalam dokumen ini.
        </p>
      </div>

      {selectedDraftText && (
        <div className="mt-2.5 rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-bold tracking-wider text-amber-700 uppercase">
              TEKS UNTUK DIKOMENTARI
            </p>
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={onClearSelectedText}
              aria-label="Batalkan teks yang dipilih"
            >
              <X className="size-3" />
            </Button>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-600">
            "{selectedDraftText}"
          </p>
        </div>
      )}

      <DraftDiscussionThread
        comments={comments}
        canManage={canEdit}
        canComment={!canEdit}
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
