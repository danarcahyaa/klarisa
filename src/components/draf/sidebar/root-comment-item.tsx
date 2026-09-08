"use client";

import {
  Check,
  Edit3,
  MoreHorizontal,
  Reply,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommentEditor } from "./comment-editor";
import { ReplyItem } from "./reply-item";
import type { DraftComment } from "@/types/contract.type";

interface RootCommentItemProps {
  comment: DraftComment;
  replies: DraftComment[];
  isEditing: boolean;
  editingReplyId: string | null;
  draftBody: string;
  isPending: boolean;
  canManage: boolean;
  canComment: boolean;
  isActionOpen: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onToggleAction: () => void;
  onCloseAction: () => void;
  onRequestDeleteComment: () => void;
  onToggleResolved: () => void;
  onFocusSource: (id: string) => void;
  onReply: (id: string) => void;
  onStartEditReply: (reply: DraftComment) => void;
  onRequestDeleteReply: (id: string) => void;
  formatDate: (value: string) => string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Renders a single root comment with its nested replies.
 */
export function RootCommentItem({
  comment,
  replies,
  isEditing,
  editingReplyId,
  draftBody,
  isPending,
  canManage,
  canComment,
  isActionOpen,
  onDraftChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onToggleAction,
  onCloseAction,
  onRequestDeleteComment,
  onToggleResolved,
  onFocusSource,
  onReply,
  onStartEditReply,
  onRequestDeleteReply,
  formatDate,
}: RootCommentItemProps) {
  const canOpenActions = comment.isOwn || canManage;

  return (
    <article className={comment.isResolved ? "opacity-70" : ""}>
      <div className="grid grid-cols-[32px_1fr] gap-3">
        <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#edf2ff] text-[10px] font-bold text-klarisa-secondary">
          {initials(comment.authorName)}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              size="xs"
              type="button"
              onClick={() => onFocusSource(comment.id)}
              className="h-auto min-w-0 p-0 text-left text-xs font-semibold text-slate-900"
            >
              {comment.isOwn ? "Anda" : comment.authorName}
            </Button>

            {comment.isResolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <Check className="size-3" />
                Selesai
              </span>
            )}
          </div>

          {comment.selectedText && (
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={() => onFocusSource(comment.id)}
              className="mt-1 h-auto border border-amber-300 p-1.5 text-left text-[10px] font-normal text-slate-500"
            >
              "{comment.selectedText}"
            </Button>
          )}

          {isEditing ? (
            <CommentEditor
              value={draftBody}
              onChange={onDraftChange}
              onSave={onSave}
              onCancel={onCancelEdit}
              isPending={isPending}
            />
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {comment.body}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1.5">
            <time className="mr-auto shrink-0 whitespace-nowrap text-[10px] text-slate-400">
              {formatDate(comment.createdAt)}
            </time>

            {canComment && !comment.isResolved && (
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="size-3" />
                Balas
              </Button>
            )}

            {comment.isOwn && !isEditing && (
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={onStartEdit}
              >
                <Edit3 className="size-3" />
                Ubah
              </Button>
            )}

            {canOpenActions && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  aria-label="Aksi komentar"
                  aria-expanded={isActionOpen}
                  onClick={onToggleAction}
                >
                  <MoreHorizontal className="size-4" />
                </Button>

                {isActionOpen && (
                  <div className="absolute right-0 z-20 mt-1 grid w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                    <Button
                      variant="destructive"
                      size="xs"
                      type="button"
                      disabled={isPending}
                      onClick={onRequestDeleteComment}
                      className="w-full justify-start text-xs font-medium"
                    >
                      <Trash2 className="size-3.5" />
                      Hapus komentar
                    </Button>

                    {canManage && (
                      <Button
                        variant="ghost"
                        size="xs"
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          onCloseAction();
                          onToggleResolved();
                        }}
                        className="w-full justify-start text-xs font-medium"
                      >
                        {comment.isResolved ? (
                          <>
                            <RotateCcw className="size-3.5" />
                            Buka lagi
                          </>
                        ) : (
                          <>
                            <Check className="size-3.5" />
                            Tandai selesai
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              isEditing={editingReplyId === reply.id}
              draftBody={draftBody}
              isPending={isPending}
              onDraftChange={onDraftChange}
              onSave={onSave}
              onCancelEdit={onCancelEdit}
              onStartEdit={() => onStartEditReply(reply)}
              onRequestDelete={() => onRequestDeleteReply(reply.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
