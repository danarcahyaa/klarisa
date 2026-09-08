"use client";

import { Button, SubmitButton } from "@/components/ui/button";
import { CommentEditor } from "./comment-editor";
import type { DraftComment } from "@/types/contract.type";

interface ReplyItemProps {
  reply: DraftComment;
  isEditing: boolean;
  draftBody: string;
  isPending: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onRequestDelete: () => void;
  formatDate: (value: string) => string;
}

/**
 * Renders a single reply comment within a threaded discussion.
 */
export function ReplyItem({
  reply,
  isEditing,
  draftBody,
  isPending,
  onDraftChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onRequestDelete,
  formatDate,
}: ReplyItemProps) {
  return (
    <div className="mt-3 grid grid-cols-[28px_1fr] gap-2.5 border-l border-slate-200 pl-3">
      <i className="grid size-7 place-items-center rounded-full bg-slate-100 text-xs font-bold not-italic text-slate-500">
        {reply.authorName
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()}
      </i>
      <div>
        <b className="text-xs font-semibold text-slate-900">
          {reply.isOwn ? "Anda" : reply.authorName}
        </b>

        {isEditing ? (
          <CommentEditor
            value={draftBody}
            onChange={onDraftChange}
            onSave={onSave}
            onCancel={onCancelEdit}
            isPending={isPending}
          />
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {reply.body}
          </p>
        )}

        <span className="mt-1.5 flex items-center gap-2">
          <time className="mr-auto shrink-0 whitespace-nowrap text-[10px] text-slate-400">
            {formatDate(reply.createdAt)}
          </time>

          {reply.isOwn && !isEditing && (
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={onStartEdit}
            >
              Ubah
            </Button>
          )}

          {reply.isOwn && (
            <SubmitButton
              variant="destructive"
              size="xs"
              type="button"
              disabled={isPending}
              onClick={onRequestDelete}
            >
              Hapus
            </SubmitButton>
          )}
        </span>
      </div>
    </div>
  );
}
