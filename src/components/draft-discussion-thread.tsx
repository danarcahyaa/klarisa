"use client";

import { useEffect, useState } from "react";
import type { DraftComment } from "@/types/contract.type";
import { DeleteCommentModal } from "./draf/sidebar/delete-comment-modal";
import { RootCommentItem } from "./draf/sidebar/root-comment-item";

export interface DraftDiscussionThreadProps {
  comments: ReadonlyArray<DraftComment>;
  canManage: boolean;
  canComment: boolean;
  isPending: boolean;
  onFocusSource: (commentId: string) => void;
  onReply: (parentId: string) => void;
  onUpdate: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onSetResolved: (commentId: string, isResolved: boolean) => Promise<boolean>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Threaded discussion component rendering main comments and nested replies.
 */
export function DraftDiscussionThread({
  comments,
  canManage,
  canComment,
  isPending,
  onFocusSource,
  onReply,
  onUpdate,
  onDelete,
  onSetResolved,
}: DraftDiscussionThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const rootComments = comments.filter((item) => !item.parentId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const startEditing = (comment: DraftComment) => {
    setOpenActionId(null);
    setEditingId(comment.id);
    setDraftBody(comment.body);
  };

  const saveEdit = async () => {
    if (!editingId || !draftBody.trim()) return;
    const saved = await onUpdate(editingId, draftBody);
    if (saved) setEditingId(null);
  };

  const requestRemoveComment = (commentId: string, label: string) => {
    setOpenActionId(null);
    setCommentToDelete({ id: commentId, label });
  };

  const confirmRemoveComment = async () => {
    if (!commentToDelete) return;
    const deleted = await onDelete(commentToDelete.id);
    if (deleted) setCommentToDelete(null);
  };

  return (
    <>
      <div className="my-2.5 flex flex-1 flex-col min-h-0 gap-4 overflow-y-auto pr-1">
        {rootComments.map((item) => {
          const replies = comments.filter((reply) => reply.parentId === item.id);
          const editingReplyId =
            editingId && replies.some((r) => r.id === editingId)
              ? editingId
              : null;

          return (
            <RootCommentItem
              key={item.id}
              comment={item}
              replies={replies as DraftComment[]}
              isEditing={editingId === item.id}
              editingReplyId={editingReplyId}
              draftBody={draftBody}
              isPending={isPending}
              canManage={canManage}
              canComment={canComment}
              isActionOpen={openActionId === item.id}
              onDraftChange={setDraftBody}
              onSave={() => void saveEdit()}
              onCancelEdit={() => setEditingId(null)}
              onStartEdit={() => startEditing(item)}
              onToggleAction={() =>
                setOpenActionId((current) =>
                  current === item.id ? null : item.id,
                )
              }
              onCloseAction={() => setOpenActionId(null)}
              onRequestDeleteComment={() =>
                requestRemoveComment(item.id, "komentar")
              }
              onToggleResolved={() =>
                void onSetResolved(item.id, !item.isResolved)
              }
              onFocusSource={onFocusSource}
              onReply={onReply}
              onStartEditReply={startEditing}
              onRequestDeleteReply={(replyId) =>
                requestRemoveComment(replyId, "balasan")
              }
              formatDate={formatDate}
            />
          );
        })}

        {rootComments.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-5 text-center text-[10px] leading-relaxed text-slate-400">
            Pilih teks kontrak, lalu tulis komentar pertama.
          </p>
        )}
      </div>

      {isMounted && commentToDelete && (
        <DeleteCommentModal
          label={commentToDelete.label}
          isPending={isPending}
          onCancel={() => setCommentToDelete(null)}
          onConfirm={() => void confirmRemoveComment()}
        />
      )}
    </>
  );
}
