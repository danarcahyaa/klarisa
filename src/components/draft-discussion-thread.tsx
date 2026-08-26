"use client";

import { Check, Edit3, MoreHorizontal, Reply, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { DraftComment } from "@/types/contract.type";
import { Button, SubmitButton } from "@/components/ui/button";

type DraftDiscussionThreadProps = {
  comments: ReadonlyArray<DraftComment>;
  canManage: boolean;
  canComment: boolean;
  isPending: boolean;
  onFocusSource: (commentId: string) => void;
  onReply: (parentId: string) => void;
  onUpdate: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onSetResolved: (commentId: string, isResolved: boolean) => Promise<boolean>;
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function CommentEditor({ value, onChange, onSave, onCancel, isPending }: { value: string; onChange: (value: string) => void; onSave: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <div className="mt-2 grid gap-2">
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-20 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-xs leading-relaxed outline-none focus:border-klarisa-secondary"/>
      <span className="flex gap-2">
        <SubmitButton size="xs" type="button" isLoading={isPending} disabled={isPending || !value.trim()} onClick={onSave}>Simpan</SubmitButton>
        <Button variant="ghost" size="xs" type="button" onClick={onCancel}>Batal</Button>
      </span>
    </div>
  );
}

export function DraftDiscussionThread({ comments, canManage, canComment, isPending, onFocusSource, onReply, onUpdate, onDelete, onSetResolved }: DraftDiscussionThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; label: string } | null>(null);
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
      <div className="mt-5 grid max-h-[calc(100svh-355px)] gap-5 overflow-y-auto pr-1 xl:flex-1">
        {rootComments.map((item) => {
          const replies = comments.filter((reply) => reply.parentId === item.id);
          const isEditingRoot = editingId === item.id;
          const canOpenActions = item.isOwn || canManage;

          return (
            <article key={item.id} className={item.isResolved ? "opacity-70" : ""}>
              <div className="grid grid-cols-[32px_1fr] gap-3">
                <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#edf2ff] text-[10px] font-bold text-klarisa-secondary">{initials(item.authorName)}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Button variant="link" size="xs" type="button" onClick={() => onFocusSource(item.id)} className="h-auto p-0 text-xs font-semibold text-slate-900 min-w-0 text-left">
                      {item.isOwn ? "Anda" : item.authorName}
                    </Button>
                    {item.isResolved && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"><Check className="size-3"/>Selesai</span>}
                  </div>
                  {item.selectedText && (
                    <Button variant="ghost" size="xs" type="button" onClick={() => onFocusSource(item.id)} className="mt-1 h-auto border border-amber-300 p-1.5 text-left text-[10px] font-normal text-slate-500">
                      “{item.selectedText}”
                    </Button>
                  )}
                  {isEditingRoot ? <CommentEditor value={draftBody} onChange={setDraftBody} onSave={() => void saveEdit()} onCancel={() => setEditingId(null)} isPending={isPending}/> : <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>}
                  <div className="mt-2 flex items-center gap-1.5">
                    <time className="mr-auto shrink-0 whitespace-nowrap text-[10px] text-slate-400">{formatDate(item.createdAt)}</time>
                    {canComment && !item.isResolved && <Button variant="ghost" size="xs" type="button" onClick={() => onReply(item.id)}><Reply className="size-3"/>Balas</Button>}
                    {item.isOwn && !isEditingRoot && <Button variant="ghost" size="xs" type="button" onClick={() => startEditing(item)}><Edit3 className="size-3"/>Ubah</Button>}
                    {canOpenActions && (
                      <div className="relative">
                        <Button variant="ghost" size="icon-xs" type="button" aria-label="Aksi komentar" aria-expanded={openActionId === item.id} onClick={() => setOpenActionId((current) => current === item.id ? null : item.id)}>
                          <MoreHorizontal className="size-4"/>
                        </Button>
                        {openActionId === item.id && (
                          <div className="absolute right-0 z-20 mt-1 grid w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                            <Button variant="destructive" size="xs" type="button" disabled={isPending} onClick={() => requestRemoveComment(item.id, "komentar")} className="w-full justify-start text-xs font-medium">
                              <Trash2 className="size-3.5"/>Hapus komentar
                            </Button>
                            {canManage && (
                              <Button variant="ghost" size="xs" type="button" disabled={isPending} onClick={() => { setOpenActionId(null); void onSetResolved(item.id, !item.isResolved); }} className="w-full justify-start text-xs font-medium">
                                {item.isResolved ? <><RotateCcw className="size-3.5"/>Buka lagi</> : <><Check className="size-3.5"/>Tandai selesai</>}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {replies.map((reply) => {
                    const isEditingReply = editingId === reply.id;
                    return (
                      <div key={reply.id} className="mt-3 grid grid-cols-[28px_1fr] gap-2.5 border-l border-slate-200 pl-3">
                        <i className="grid size-7 place-items-center rounded-full bg-slate-100 text-xs font-bold not-italic text-slate-500">{initials(reply.authorName)}</i>
                        <div>
                          <b className="text-xs font-semibold text-slate-900">{reply.isOwn ? "Anda" : reply.authorName}</b>
                          {isEditingReply ? <CommentEditor value={draftBody} onChange={setDraftBody} onSave={() => void saveEdit()} onCancel={() => setEditingId(null)} isPending={isPending}/> : <p className="mt-1 text-xs leading-relaxed text-slate-600">{reply.body}</p>}
                          <span className="mt-1.5 flex items-center gap-2">
                            <time className="mr-auto shrink-0 whitespace-nowrap text-[10px] text-slate-400">{formatDate(reply.createdAt)}</time>
                            {reply.isOwn && !isEditingReply && <Button variant="ghost" size="xs" type="button" onClick={() => startEditing(reply)}>Ubah</Button>}
                            {reply.isOwn && <SubmitButton variant="destructive" size="xs" type="button" disabled={isPending} onClick={() => requestRemoveComment(reply.id, "balasan")}>Hapus</SubmitButton>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
        {rootComments.length === 0 && <p className="rounded-md border border-dashed border-slate-200 px-3 py-5 text-center text-[10px] leading-relaxed text-slate-400">Pilih teks kontrak, lalu tulis komentar pertama.</p>}
      </div>
      {isMounted && commentToDelete && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <button type="button" aria-label="Batal menghapus komentar" onClick={() => setCommentToDelete(null)} className="absolute inset-0"/>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-comment-title" aria-describedby="delete-comment-description" className="relative w-full max-w-xs rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <span className="grid size-9 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="size-4"/></span>
            <h2 id="delete-comment-title" className="mt-3 text-lg font-semibold tracking-[-.03em]">Hapus {commentToDelete.label}?</h2>
            <p id="delete-comment-description" className="mt-1.5 text-xs leading-5 text-slate-500">Sorotan diskusi pada teks sumber juga akan dihapus.</p>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" size="sm" type="button" disabled={isPending} onClick={() => setCommentToDelete(null)}>Batal</Button>
              <SubmitButton variant="destructive" size="sm" type="button" isLoading={isPending} loadingText="Menghapus..." onClick={() => void confirmRemoveComment()}>Hapus</SubmitButton>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
