"use client";

import { Check, Edit3, MoreHorizontal, Reply, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { DraftComment } from "@/types/contract.type";

type DraftDiscussionThreadProps = {
  comments: DraftComment[];
  canManage: boolean;
  canComment: boolean;
  isPending: boolean;
  onFocusSource: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onUpdate: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onSetResolved: (commentId: string, resolved: boolean) => Promise<boolean>;
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function CommentEditor({ value, onChange, onSave, onCancel, isPending }: { value: string; onChange: (value: string) => void; onSave: () => void; onCancel: () => void; isPending: boolean }) {
  return <div className="mt-2 grid gap-2">
    <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-20 w-full resize-y rounded-md border border-slate-200 px-2 py-2 text-[10px] leading-5 outline-none focus:border-klarisa-secondary"/>
    <span className="flex gap-2"><button type="button" disabled={isPending || !value.trim()} onClick={onSave} className="rounded bg-[#172031] px-2.5 py-1.5 text-[9px] font-bold text-white disabled:opacity-50">Simpan</button><button type="button" onClick={onCancel} className="px-1 text-[9px] font-semibold text-slate-500">Batal</button></span>
  </div>;
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

  return <><div className="mt-5 grid max-h-[calc(100svh-355px)] gap-5 overflow-y-auto pr-1 xl:flex-1">
    {rootComments.map((item) => {
      const replies = comments.filter((reply) => reply.parentId === item.id);
      const isEditingRoot = editingId === item.id;
      const canOpenActions = item.isOwn || canManage;

      return <article key={item.id} className={item.isResolved ? "opacity-70" : ""}>
        <div className="grid grid-cols-[30px_1fr] gap-3">
          <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#edf2ff] text-[9px] font-bold text-klarisa-secondary">{initials(item.authorName)}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><button type="button" onClick={() => onFocusSource(item.id)} className="min-w-0 text-left"><b className="text-[11px]">{item.isOwn ? "Anda" : item.authorName}</b></button>{item.isResolved && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700"><Check className="size-2.5"/>Selesai</span>}</div>
            {item.selectedText && <button type="button" onClick={() => onFocusSource(item.id)} className="mt-1 block border-l-2 border-amber-300 pl-2 text-left text-[9px] leading-4 text-slate-400">“{item.selectedText}”</button>}
            {isEditingRoot ? <CommentEditor value={draftBody} onChange={setDraftBody} onSave={() => void saveEdit()} onCancel={() => setEditingId(null)} isPending={isPending}/> : <p className="mt-2 text-[10px] leading-5 text-slate-600">{item.body}</p>}
            <div className="mt-2 flex items-center gap-2"><time className="mr-auto text-[9px] text-slate-400">{formatDate(item.createdAt)}</time>{canComment && !item.isResolved && <button type="button" onClick={() => onReply(item.id)} className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-[9px] font-bold text-klarisa-secondary hover:bg-[#edf2ff]"><Reply className="size-3"/>Balas</button>}{item.isOwn && !isEditingRoot && <button type="button" onClick={() => startEditing(item)} className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-[9px] font-bold text-slate-500 hover:bg-slate-100"><Edit3 className="size-3"/>Ubah</button>}{canOpenActions && <div className="relative"><button type="button" aria-label="Aksi komentar" aria-expanded={openActionId === item.id} onClick={() => setOpenActionId((current) => current === item.id ? null : item.id)} className="grid size-7 place-items-center rounded text-slate-500 hover:bg-slate-100"><MoreHorizontal className="size-4"/></button>{openActionId === item.id && <div className="absolute right-0 z-20 mt-1 grid w-36 rounded-md border border-slate-200 bg-white p-1 shadow-lg"><button type="button" disabled={isPending} onClick={() => requestRemoveComment(item.id, "komentar")} className="flex items-center gap-2 rounded px-2 py-2 text-left text-[9px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-3"/>Hapus komentar</button>{canManage && <button type="button" disabled={isPending} onClick={() => { setOpenActionId(null); void onSetResolved(item.id, !item.isResolved); }} className="flex items-center gap-2 rounded px-2 py-2 text-left text-[9px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{item.isResolved ? <><RotateCcw className="size-3"/>Buka lagi</> : <><Check className="size-3"/>Tandai selesai</>}</button>}</div>}</div>}</div>
            {replies.map((reply) => {
              const isEditingReply = editingId === reply.id;
              return <div key={reply.id} className="mt-3 grid grid-cols-[24px_1fr] gap-2 border-l border-slate-200 pl-3"><i className="grid size-6 place-items-center rounded-full bg-slate-100 text-[8px] font-bold not-italic text-slate-500">{initials(reply.authorName)}</i><div><b className="text-[10px]">{reply.isOwn ? "Anda" : reply.authorName}</b>{isEditingReply ? <CommentEditor value={draftBody} onChange={setDraftBody} onSave={() => void saveEdit()} onCancel={() => setEditingId(null)} isPending={isPending}/> : <p className="mt-1 text-[10px] leading-5 text-slate-600">{reply.body}</p>}<span className="mt-1 flex items-center gap-2"><time className="mr-auto text-[9px] text-slate-400">{formatDate(reply.createdAt)}</time>{reply.isOwn && !isEditingReply && <button type="button" onClick={() => startEditing(reply)} className="rounded px-1 text-[9px] font-bold text-slate-500 hover:bg-slate-100">Ubah</button>}{reply.isOwn && <button type="button" disabled={isPending} onClick={() => requestRemoveComment(reply.id, "balasan")} className="rounded px-1 text-[9px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Hapus</button>}</span></div></div>;
            })}
          </div>
        </div>
      </article>;
    })}
    {rootComments.length === 0 && <p className="rounded-md border border-dashed border-slate-200 px-3 py-5 text-center text-[10px] leading-5 text-slate-400">Pilih teks kontrak, lalu tulis komentar pertama.</p>}
  </div>{isMounted && commentToDelete && createPortal(<div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]"><button type="button" aria-label="Batal menghapus komentar" onClick={() => setCommentToDelete(null)} className="absolute inset-0"/><section role="alertdialog" aria-modal="true" aria-labelledby="delete-comment-title" aria-describedby="delete-comment-description" className="relative w-full max-w-xs rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"><span className="grid size-9 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="size-4"/></span><h2 id="delete-comment-title" className="mt-3 text-lg font-semibold tracking-[-.03em]">Hapus {commentToDelete.label}?</h2><p id="delete-comment-description" className="mt-1.5 text-xs leading-5 text-slate-500">Sorotan diskusi pada teks sumber juga akan dihapus.</p><div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={isPending} onClick={() => setCommentToDelete(null)} className="min-h-9 rounded-md border border-slate-200 px-3.5 text-xs font-bold">Batal</button><button type="button" disabled={isPending} onClick={() => void confirmRemoveComment()} className="min-h-9 rounded-md bg-red-600 px-3.5 text-xs font-bold text-white disabled:opacity-50">{isPending ? "Menghapus..." : "Hapus"}</button></div></section></div>, document.body)}</>;
}
