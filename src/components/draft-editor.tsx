"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreHorizontal,
  Redo2,
  Reply,
  Save,
  Search,
  Send,
  Share2,
  Trash2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useDraft } from "@/hooks/useDraft";
import type { ContractDetail, DraftComment } from "@/types/contract.type";

const DRAFT_KEY = "klarisa:draft:content";
const TITLE_KEY = "klarisa:draft:title";

const toolbar = [
  ["Tebal (Ctrl+B)", Bold, "bold"],
  ["Miring (Ctrl+I)", Italic, "italic"],
  ["Garis bawah (Ctrl+U)", Underline, "underline"],
  ["Daftar", List, "insertUnorderedList"],
  ["Daftar bernomor", ListOrdered, "insertOrderedList"],
  ["Rata kiri", AlignLeft, "justifyLeft"],
  ["Rata tengah", AlignCenter, "justifyCenter"],
  ["Rata kanan", AlignRight, "justifyRight"],
] as const;

const defaultDocument = `
  <p><mark class="bg-amber-200 px-1">SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</mark></p>
  <p class="mt-3">Nomor: [NOMOR_KONTRAK]/SPK/2026</p>
  <p class="mt-3">Pada hari ini, [HARI], tanggal [TANGGAL], disepakati perjanjian kerja sama antara:</p>
  <p class="mt-2 pl-6">[NAMA PIHAK PERTAMA] (selanjutnya disebut “PIHAK PERTAMA”)</p>
  <p class="mt-2 pl-6">[NAMA PIHAK KEDUA] (selanjutnya disebut “PIHAK KEDUA”)</p>
  <h2 class="mt-7 font-sans text-sm font-bold">PASAL 1: RUANG LINGKUP &amp; BIAYA</h2>
  <p class="mt-2 pl-6">PIHAK KEDUA melaksanakan pekerjaan [OBJEK_PEKERJAAN] dengan total nilai imbalan Rp [NOMINAL].</p>
  <p class="mt-2 pl-6">Pembayaran dilakukan bertahap: Uang Muka (DP) [DP]% dan Pelunasan [PELUNASAN]% maksimal 7 hari kerja setelah pekerjaan diserahkan.</p>
  <h2 class="mt-7 font-sans text-sm font-bold">PASAL 2: HAK CIPTA &amp; KERAHASIAAN (NDA)</h2>
  <p class="mt-2 pl-6">HKI: Hak moral dan hak cipta tetap melekat pada PIHAK KEDUA. PIHAK PERTAMA memperoleh Hak Guna Pakai Komersial secara sah setelah pembayaran lunas.</p>
  <p class="mt-2 pl-6">Kerahasiaan: PARA PIHAK wajib menjaga kerahasiaan seluruh data, aset, dan informasi teknis proyek ini dari pihak ketiga.</p>
  <h2 class="mt-7 font-sans text-sm font-bold">PASAL 3: KETENTUAN SERAH TERIMA</h2>
  <p class="mt-2 pl-6">Pekerjaan dinyatakan selesai setelah PIHAK PERTAMA menyetujui hasil akhir dan menandatangani tanda terima pekerjaan.</p>
`;

type SaveStatus = "saved" | "saving";
type SidebarTab = "conversation" | "discussion";
type AiMessage = { role: "assistant" | "user"; body: string };

function findTextRange(root: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let startNode: Text | null = null;
  let endNode: Text | null = null;
  let startOffset = 0;
  let endOffset = 0;
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const nextOffset = offset + node.data.length;
    if (!startNode && start >= offset && start <= nextOffset) {
      startNode = node;
      startOffset = start - offset;
    }
    if (end >= offset && end <= nextOffset) {
      endNode = node;
      endOffset = end - offset;
      break;
    }
    offset = nextOffset;
    current = walker.nextNode();
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

function wrapCommentRange(range: Range, commentId: string) {
  const marker = document.createElement("mark");
  marker.dataset.draftCommentId = commentId;
  marker.className = "rounded-sm bg-amber-200 px-0.5 ring-1 ring-amber-300";
  marker.append(range.extractContents());
  range.insertNode(marker);
  return marker;
}

function renderCommentAnchors(editor: HTMLElement, comments: DraftComment[]) {
  const anchored = comments
    .filter((item) => !item.parentId && item.positionStart !== null && item.positionEnd !== null)
    .sort((a, b) => (b.positionStart ?? 0) - (a.positionStart ?? 0));
  for (const comment of anchored) {
    if (editor.querySelector(`[data-draft-comment-id="${comment.id}"]`)) continue;
    const range = findTextRange(editor, comment.positionStart!, comment.positionEnd!);
    if (range && !range.collapsed) wrapCommentRange(range, comment.id);
  }
}

export function DraftEditor({ initialDraft }: { initialDraft: ContractDetail }) {
  const router = useRouter();
  const {
    data: remoteDraft,
    isSaving,
    isCommenting,
    isSharing,
    isDeleting,
    error: remoteError,
    saveDraft: saveRemoteDraft,
    deleteDraft,
    addComment,
    deleteComment,
    inviteCollaborator,
    dismissError,
  } = useDraft(initialDraft);
  const editorRef = useRef<HTMLElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIndexRef = useRef(0);
  const orphanSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState(initialDraft.title);
  const [message, setMessage] = useState("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("conversation");
  const aiMessages: AiMessage[] = [{ role: "assistant", body: "Percakapan Klarisa AI akan tersedia setelah layanan Gemini dan sumber hukum terhubung." }];
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [notice, setNotice] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedDraftText, setSelectedDraftText] = useState("");
  const [selectedTextPosition, setSelectedTextPosition] = useState<{ start: number; end: number } | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const canEdit = remoteDraft.permission === "owner";
  const canComment = canEdit || remoteDraft.permission === "commenter";

  useEffect(() => {
    if (!notice && !remoteError) return;
    const timeoutId = window.setTimeout(() => {
      setNotice("");
      dismissError();
    }, remoteError ? 6000 : 3500);
    return () => window.clearTimeout(timeoutId);
  }, [dismissError, notice, remoteError]);

  const persistLocally = useCallback(() => {
    if (!editorRef.current) return;
    localStorage.setItem(`${DRAFT_KEY}:${remoteDraft.id}`, editorRef.current.innerHTML);
    localStorage.setItem(`${TITLE_KEY}:${remoteDraft.id}`, title);
    setSaveStatus("saved");
  }, [remoteDraft.id, title]);

  const saveDraft = useCallback(async (createVersion = false) => {
    persistLocally();
    if (!editorRef.current || !remoteDraft || !canEdit) return false;
    const saved = await saveRemoteDraft({ title, content: editorRef.current.innerHTML, createVersion });
    if (saved) setNotice(createVersion ? "Versi baru draft berhasil disimpan." : "Draft berhasil disimpan.");
    return saved;
  }, [canEdit, persistLocally, remoteDraft, saveRemoteDraft, title]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void saveDraft(false); }, 900);
  }, [saveDraft]);

  const updateActiveCommands = useCallback(() => {
    const selection = window.getSelection();
    if (!editorRef.current || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const rangeContainer = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;
    if (!rangeContainer || !editorRef.current.contains(rangeContainer)) return;
    selectionRangeRef.current = range.cloneRange();
    const selectedText = range.toString().trim();
    if (!range.collapsed && selectedText) {
      const prefixRange = document.createRange();
      prefixRange.selectNodeContents(editorRef.current);
      prefixRange.setEnd(range.startContainer, range.startOffset);
      const start = prefixRange.toString().length;
      setSelectedDraftText(selectedText);
      setSelectedTextPosition({ start, end: start + range.toString().length });
    } else if (document.activeElement === editorRef.current) {
      setSelectedDraftText("");
      setSelectedTextPosition(null);
    }
    const next = new Set<string>();
    toolbar.forEach(([, , command]) => {
      if (document.queryCommandState(command)) next.add(command);
    });
    setActiveCommands(next);
    const highlightColor = String(document.queryCommandValue("hiliteColor")).toLowerCase();
    setIsHighlighted(
      highlightColor.includes("253, 230, 138")
      || highlightColor.includes("fde68a")
      || highlightColor.includes("rgb(253, 230, 138)"),
    );
  }, []);

  const restoreEditorSelection = useCallback(() => {
    const editor = editorRef.current;
    const range = selectionRangeRef.current;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return false;
    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  }, []);

  useEffect(() => {
    const savedContent = localStorage.getItem(`${DRAFT_KEY}:${initialDraft.id}`);
    const savedTitle = localStorage.getItem(`${TITLE_KEY}:${initialDraft.id}`);
    if (editorRef.current) {
      editorRef.current.innerHTML = savedContent || initialDraft.content || defaultDocument;
      renderCommentAnchors(editorRef.current, initialDraft.comments);
    }
    queueMicrotask(() => setTitle(savedTitle || initialDraft.title));
    document.addEventListener("selectionchange", updateActiveCommands);
    return () => {
      document.removeEventListener("selectionchange", updateActiveCommands);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (orphanSyncTimerRef.current) clearTimeout(orphanSyncTimerRef.current);
    };
  }, [initialDraft.comments, initialDraft.content, initialDraft.id, initialDraft.title, updateActiveCommands]);

  const runCommand = (command: string, value?: string) => {
    restoreEditorSelection();
    document.execCommand(command, false, value);
    updateActiveCommands();
    scheduleSave();
  };

  const insertLink = () => {
    const selection = window.getSelection()?.toString();
    if (!selection) {
      setNotice("Pilih teks terlebih dahulu untuk menambahkan tautan.");
      return;
    }
    const url = window.prompt("Masukkan alamat tautan:", "https://");
    if (url?.startsWith("https://") || url?.startsWith("http://")) runCommand("createLink", url);
  };

  const toggleHighlight = () => {
    if (!restoreEditorSelection() || selectionRangeRef.current?.collapsed) {
      setNotice("Pilih teks terlebih dahulu untuk memberi atau menghapus sorotan.");
      return;
    }
    const currentColor = String(document.queryCommandValue("hiliteColor")).toLowerCase();
    const hasHighlight = currentColor.includes("253, 230, 138") || currentColor.includes("fde68a");
    const color = hasHighlight ? "transparent" : "#fde68a";
    const applied = document.execCommand("hiliteColor", false, color);
    if (!applied) document.execCommand("backColor", false, color);
    setIsHighlighted(!hasHighlight);
    updateActiveCommands();
    scheduleSave();
  };

  const findNext = () => {
    const editor = editorRef.current;
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");
    if (!editor || !query) return;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const matches: Array<{ node: Text; start: number }> = [];
    let current = walker.nextNode();
    while (current) {
      const text = current.textContent?.toLocaleLowerCase("id-ID") ?? "";
      let start = text.indexOf(query);
      while (start >= 0) {
        matches.push({ node: current as Text, start });
        start = text.indexOf(query, start + query.length);
      }
      current = walker.nextNode();
    }
    if (matches.length === 0) {
      setSearchFeedback("Tidak ditemukan");
      return;
    }
    const matchIndex = searchIndexRef.current % matches.length;
    const match = matches[matchIndex];
    const range = document.createRange();
    range.setStart(match.node, match.start);
    range.setEnd(match.node, match.start + query.length);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    match.node.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchIndexRef.current = matchIndex + 1;
    setSearchFeedback(`${matchIndex + 1} dari ${matches.length}`);
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      void saveDraft(true);
      setNotice("Draft disimpan.");
    }
    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      setIsSearchOpen(true);
    }
  };

  const shareDraft = async () => {
    const saved = await saveDraft(false);
    if (!saved) return;
    setIsShareOpen(true);
  };

  const confirmDeleteDraft = async () => {
    const deleted = await deleteDraft();
    if (!deleted) return;
    localStorage.removeItem(`${DRAFT_KEY}:${remoteDraft.id}`);
    localStorage.removeItem(`${TITLE_KEY}:${remoteDraft.id}`);
    router.push("/dashboard/search");
    router.refresh();
  };

  const submitInvitation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invited = await inviteCollaborator({ email: inviteEmail });
    if (!invited) return;
    await navigator.clipboard.writeText(window.location.href);
    setInviteEmail("");
    setIsShareOpen(false);
    setNotice("Pihak terkait ditambahkan dan tautan draft disalin.");
  };

  const sendMessage = async () => {
    const value = message.trim();
    if (!value) return;
    if (activeSidebarTab === "conversation") {
      setNotice("Percakapan AI belum diaktifkan.");
      return;
    } else {
      if (!replyToId && (!selectedDraftText || !selectedTextPosition)) {
        setNotice("Pilih teks kontrak terlebih dahulu sebelum menulis komentar.");
        return;
      }
      const comment = await addComment(replyToId
        ? { body: value, parentId: replyToId }
        : {
            body: value,
            selectedText: selectedDraftText,
            positionStart: selectedTextPosition!.start,
            positionEnd: selectedTextPosition!.end,
          });
      if (!comment) return;
      if (!replyToId && restoreEditorSelection() && selectionRangeRef.current) {
        const marker = wrapCommentRange(selectionRangeRef.current, comment.id);
        marker.scrollIntoView({ behavior: "smooth", block: "center" });
        scheduleSave();
      }
      setReplyToId(null);
      setSelectedDraftText("");
      setSelectedTextPosition(null);
    }
    setMessage("");
  };

  const focusCommentSource = (commentId: string) => {
    const marker = editorRef.current?.querySelector<HTMLElement>(`[data-draft-comment-id="${commentId}"]`);
    if (!marker) {
      setNotice("Teks sumber komentar sudah tidak tersedia.");
      return;
    }
    marker.scrollIntoView({ behavior: "smooth", block: "center" });
    marker.animate([{ boxShadow: "0 0 0 0 rgba(47,91,211,0)" }, { boxShadow: "0 0 0 4px rgba(47,91,211,.2)" }, { boxShadow: "0 0 0 0 rgba(47,91,211,0)" }], { duration: 900 });
  };

  const syncOrphanedComments = useCallback(() => {
    if (!editorRef.current || remoteDraft.permission !== "owner") return;
    const anchoredComments = remoteDraft.comments.filter((item) => !item.parentId && item.positionStart !== null);
    for (const comment of anchoredComments) {
      const marker = editorRef.current.querySelector<HTMLElement>(`[data-draft-comment-id="${comment.id}"]`);
      if (!marker || !marker.textContent?.trim()) void deleteComment(comment.id);
    }
  }, [deleteComment, remoteDraft.comments, remoteDraft.permission]);

  const handleEditorInput = () => {
    scheduleSave();
    if (orphanSyncTimerRef.current) clearTimeout(orphanSyncTimerRef.current);
    orphanSyncTimerRef.current = setTimeout(syncOrphanedComments, 350);
  };

  const rootComments = remoteDraft.comments.filter((item) => !item.parentId);
  const replyTarget = replyToId ? remoteDraft.comments.find((item) => item.id === replyToId) : null;

  return <div className="min-h-[calc(100svh-57px)] bg-white">
    <header className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-7">
      <span className="grid min-w-0 flex-1 gap-1">
        <input value={title} readOnly={!canEdit} onChange={(event) => { setTitle(event.target.value); scheduleSave(); }} onBlur={() => void saveDraft(false)} aria-label="Judul dokumen" className="w-full max-w-xl bg-transparent text-xs font-bold outline-none focus:text-klarisa-secondary read-only:cursor-default"/>
        <small className="flex items-center gap-1.5 text-[9px] text-slate-400">Draft v.{String(remoteDraft.metadata.version ?? 1).padStart(2, "0")} · {isSaving || saveStatus === "saving" ? "Menyimpan..." : <><Check className="size-3 text-green-600"/>Tersimpan</>}</small>
      </span>
      {canEdit && <button type="button" onClick={() => void saveDraft(true)} disabled={isSaving} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-klarisa-secondary hover:text-klarisa-secondary disabled:opacity-50"><Save className="size-4"/><span className="hidden sm:inline">Simpan versi</span></button>}
      {remoteDraft.permission === "owner" && <button type="button" onClick={shareDraft} disabled={isSharing} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white hover:bg-klarisa-secondary disabled:cursor-wait disabled:opacity-60"><Share2 className="size-4"/>{isSharing ? "Menyiapkan..." : "Bagikan"}</button>}
      {remoteDraft.permission === "owner" && <div className="relative"><button type="button" aria-label="Aksi draft lainnya" aria-expanded={isActionsOpen} onClick={() => setIsActionsOpen((current) => !current)} className="grid size-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"><MoreHorizontal className="size-4"/></button>{isActionsOpen && <div className="absolute top-12 right-0 z-50 w-44 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg"><button type="button" onClick={() => { setIsActionsOpen(false); setIsDeleteOpen(true); }} className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="size-4"/>Hapus draft</button></div>}</div>}
    </header>

    {(notice || remoteError) && <div role={remoteError ? "alert" : "status"} className="fixed top-20 right-4 z-50 flex max-w-xs items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs font-semibold shadow-lg"><Check className="size-4 text-klarisa-secondary"/><span>{remoteError || notice}</span><button type="button" onClick={() => { setNotice(""); dismissError(); }} aria-label="Tutup pemberitahuan" className="grid size-7 shrink-0 place-items-center rounded hover:bg-slate-100"><X className="size-4 text-slate-400"/></button></div>}

    {isShareOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]"><button type="button" aria-label="Tutup panel bagikan" onClick={() => setIsShareOpen(false)} className="absolute inset-0"/><section role="dialog" aria-modal="true" aria-labelledby="share-draft-title" className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-bold tracking-[.18em] text-klarisa-secondary">BAGIKAN DRAFT</p><h2 id="share-draft-title" className="mt-2 text-xl font-semibold tracking-[-.03em]">Tambahkan pihak terkait.</h2><p className="mt-2 text-xs leading-5 text-slate-500">Pengguna yang diundang dapat menyorot teks, berdiskusi, dan meninjau draft, tetapi tidak dapat mengubah isi kontrak.</p></div><button type="button" onClick={() => setIsShareOpen(false)} aria-label="Tutup" className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-slate-100"><X className="size-4"/></button></div><form onSubmit={submitInvitation} className="mt-6 grid gap-4"><label className="grid gap-2 text-[10px] font-bold text-slate-600">Email pengguna<input type="email" required value={inviteEmail} onChange={(event)=>setInviteEmail(event.target.value)} placeholder="nama@contoh.com" className="h-11 rounded-md border border-slate-200 px-3 text-xs font-normal outline-none focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10"/></label><div className="rounded-md bg-[#f5f7ff] px-4 py-3 text-[10px] leading-5 text-slate-600"><b className="text-klarisa-secondary">Akses pihak terkait:</b> komentar dan review tanpa izin menyunting.</div><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsShareOpen(false)} className="min-h-10 rounded-md border border-slate-200 px-4 text-xs font-bold">Batal</button><button type="submit" disabled={isSharing} className="min-h-10 rounded-md bg-[#172031] px-4 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{isSharing ? "Menambahkan..." : "Undang dan salin tautan"}</button></div></form></section></div>}

    {isDeleteOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-[2px]"><button type="button" aria-label="Batal menghapus draft" onClick={() => setIsDeleteOpen(false)} className="absolute inset-0"/><section role="alertdialog" aria-modal="true" aria-labelledby="delete-draft-title" aria-describedby="delete-draft-description" className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"><span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="size-4"/></span><h2 id="delete-draft-title" className="mt-4 text-xl font-semibold tracking-[-.03em]">Hapus draft ini?</h2><p id="delete-draft-description" className="mt-2 text-xs leading-5 text-slate-500">Draft, versi tersimpan, komentar, dan akses pihak terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)} className="min-h-10 rounded-md border border-slate-200 px-4 text-xs font-bold disabled:opacity-50">Batal</button><button type="button" disabled={isDeleting} onClick={() => void confirmDeleteDraft()} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"><Trash2 className="size-4"/>{isDeleting ? "Menghapus..." : "Hapus permanen"}</button></div></section></div>}

    <div className="grid min-h-[calc(100svh-125px)] xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="min-w-0 border-b border-slate-200 xl:border-r xl:border-b-0">
        <div className="sticky top-16 z-20 border-b border-slate-200 bg-white lg:top-[57px]">
          {isSearchOpen && <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 sm:px-6"><Search className="size-4 text-klarisa-secondary"/><input autoFocus value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); searchIndexRef.current = 0; setSearchFeedback(""); }} onKeyDown={(event) => { if (event.key === "Enter") findNext(); if (event.key === "Escape") setIsSearchOpen(false); }} placeholder="Cari di dalam kontrak..." className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"/><span className="text-[9px] text-slate-400">{searchFeedback}</span><button type="button" onClick={findNext} className="h-8 rounded bg-[#172031] px-3 text-[9px] font-bold text-white">Cari berikutnya</button><button type="button" onClick={() => setIsSearchOpen(false)} aria-label="Tutup pencarian" className="grid size-8 place-items-center"><X className="size-4"/></button></div>}
          <div className="flex min-h-13 items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
            <button type="button" aria-label="Cari dalam dokumen" onClick={() => setIsSearchOpen((current) => !current)} className={cn("grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100", isSearchOpen && "bg-[#edf2ff] text-klarisa-secondary")}><Search className="size-4"/></button>
            <span className="mx-1 h-6 w-px shrink-0 bg-slate-200"/>
            <button type="button" aria-label="Urungkan" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Undo2 className="size-4"/></button>
            <button type="button" aria-label="Ulangi" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Redo2 className="size-4"/></button>
            <select aria-label="Gaya paragraf" defaultValue="p" onChange={(event) => runCommand("formatBlock", event.target.value)} className="mx-2 h-9 shrink-0 rounded border border-slate-200 bg-white px-2 text-[10px] outline-none"><option value="p">Paragraf</option><option value="h2">Judul pasal</option><option value="blockquote">Kutipan</option></select>
            {toolbar.map(([label, Icon, command]) => <button key={label} type="button" title={label} aria-label={label} aria-pressed={activeCommands.has(command)} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand(command)} className={cn("grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100", activeCommands.has(command) && "bg-[#eaf0ff] text-klarisa-secondary")}><Icon className="size-4"/></button>)}
            <button type="button" title="Sorot kuning" aria-label="Sorot teks dengan warna kuning" aria-pressed={isHighlighted} onMouseDown={(event) => event.preventDefault()} onClick={toggleHighlight} className={cn("grid size-9 shrink-0 place-items-center rounded hover:bg-amber-100", isHighlighted && "bg-amber-200 text-amber-900")}><Highlighter className="size-4"/></button>
            <button type="button" aria-label="Tambahkan tautan" onMouseDown={(event) => event.preventDefault()} onClick={insertLink} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Link2 className="size-4"/></button>
          </div>
        </div>

        <article ref={editorRef} contentEditable={canEdit} suppressContentEditableWarning spellCheck onInput={handleEditorInput} onKeyDown={handleEditorKeyDown} onMouseUp={updateActiveCommands} onKeyUp={updateActiveCommands} dangerouslySetInnerHTML={{ __html: initialDraft.content }} className="mx-auto min-h-[calc(100svh-178px)] max-w-[900px] px-5 py-8 text-sm leading-7 outline-none selection:bg-[#dce6ff] empty:before:text-slate-400 empty:before:content-['Mulai_tulis_kontrak_Anda...'] sm:px-10 lg:px-14 [&_a]:text-klarisa-secondary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-klarisa-secondary [&_blockquote]:pl-4 [&_h2]:mt-7 [&_h2]:font-sans [&_h2]:text-sm [&_h2]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:min-h-[1.25rem] [&_ul]:list-disc"/>
      </section>

      <aside className="flex min-h-[440px] flex-col bg-white p-5">
        <div className="flex gap-1 border-b border-slate-200 pb-3"><button type="button" aria-pressed={activeSidebarTab === "conversation"} onClick={() => { setActiveSidebarTab("conversation"); setMessage(""); }} className={cn("rounded px-3 py-2 text-[10px]", activeSidebarTab === "conversation" ? "bg-slate-100 font-bold text-slate-900" : "text-slate-500 hover:text-slate-900")}>Percakapan</button><button type="button" aria-pressed={activeSidebarTab === "discussion"} onClick={() => { setActiveSidebarTab("discussion"); setMessage(""); }} className={cn("rounded px-3 py-2 text-[10px]", activeSidebarTab === "discussion" ? "bg-slate-100 font-bold text-slate-900" : "text-slate-500 hover:text-slate-900")}>Diskusi</button></div>
        {activeSidebarTab === "conversation" ? <>
          <div className="mt-5 rounded-lg border border-blue-100 bg-[#f7f9ff] p-4"><div className="flex items-center gap-2"><Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={28} height={28} className="size-7 object-contain"/><b className="text-[11px]">Klarisa AI</b><Image src="/klarisa/ai.png" alt="" aria-hidden width={13} height={13} className="ml-auto size-3.5 object-contain"/></div><p className="mt-3 text-[10px] leading-5 text-slate-500">Tanyakan isi draft atau minta bantuan memperjelas kalimat yang Anda pilih.</p></div>
          <div className="mt-5 grid gap-4">{aiMessages.map((item, index) => <article key={`${item.role}-${index}`} className={cn("grid grid-cols-[30px_1fr] gap-3", item.role === "user" && "grid-cols-[1fr_30px]")}><span className={cn("grid size-8 place-items-center rounded-full bg-[#edf2ff]", item.role === "user" && "order-2 bg-slate-100 text-[9px] font-bold text-slate-600")}>{item.role === "assistant" ? <Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={22} height={22} className="size-5 object-contain"/> : "AN"}</span><span className={item.role === "user" ? "text-right" : ""}><b className="text-[11px]">{item.role === "assistant" ? "Klarisa AI" : "Anda"}</b><small className="mt-1 block text-[10px] leading-5 text-slate-600">{item.body}</small></span></article>)}</div>
        </> : <>
          <div className="mt-5"><p className="text-[10px] font-bold text-slate-700">Diskusi pihak terkait</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Komentar dari orang yang terlibat dalam dokumen ini.</p></div>
          {selectedDraftText && !replyToId && <div className="mt-4 rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-3"><p className="text-[9px] font-bold tracking-[.12em] text-amber-700">TEKS DIPILIH</p><p className="mt-1 line-clamp-3 text-[10px] leading-5 text-slate-600">“{selectedDraftText}”</p></div>}
          <div className="mt-5 grid gap-4">{rootComments.map((item)=><article key={item.id} className="grid grid-cols-[30px_1fr] gap-3"><span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#edf2ff] text-[9px] font-bold text-klarisa-secondary">{item.avatarUrl ? <Image src={item.avatarUrl} alt="" width={32} height={32} className="size-8 object-cover"/> : item.authorName.split(" ").slice(0,2).map((part)=>part[0]).join("").toUpperCase()}</span><span><button type="button" onClick={()=>focusCommentSource(item.id)} className="text-left"><b className="text-[11px]">{item.isOwn ? "Anda" : item.authorName}</b>{item.selectedText && <small className="mt-1 block border-l-2 border-amber-300 pl-2 text-[9px] leading-4 text-slate-400">“{item.selectedText}”</small>}<small className="mt-2 block text-[10px] leading-5 text-slate-600">{item.body}</small></button><span className="mt-1 flex items-center gap-3"><time className="text-[9px] text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time><button type="button" onClick={()=>{setReplyToId(item.id);setMessage("");}} className="inline-flex items-center gap-1 text-[9px] font-bold text-klarisa-secondary"><Reply className="size-3"/>Balas</button></span>{remoteDraft.comments.filter((reply)=>reply.parentId===item.id).map((reply)=><span key={reply.id} className="mt-3 grid grid-cols-[24px_1fr] gap-2 border-l border-slate-200 pl-3"><i className="grid size-6 place-items-center rounded-full bg-slate-100 text-[8px] font-bold not-italic text-slate-500">{reply.authorName.split(" ").slice(0,2).map((part)=>part[0]).join("").toUpperCase()}</i><span><b className="text-[10px]">{reply.isOwn?"Anda":reply.authorName}</b><small className="mt-1 block text-[10px] leading-5 text-slate-600">{reply.body}</small></span></span>)}</span></article>)}{rootComments.length === 0 && <p className="rounded-md border border-dashed border-slate-200 px-3 py-5 text-center text-[10px] leading-5 text-slate-400">Pilih teks kontrak, lalu tulis komentar pertama.</p>}</div>
        </>}
        <div className="mt-auto rounded-lg bg-slate-100 p-4">{activeSidebarTab === "discussion" && replyTarget && <div className="mb-2 flex items-center justify-between rounded bg-white px-3 py-2 text-[9px] text-slate-500"><span>Membalas {replyTarget.isOwn?"komentar Anda":replyTarget.authorName}</span><button type="button" onClick={()=>setReplyToId(null)} aria-label="Batal membalas"><X className="size-3"/></button></div>}<textarea value={message} disabled={activeSidebarTab === "conversation" || !canComment} onChange={(event)=>setMessage(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void sendMessage();}}} placeholder={activeSidebarTab === "conversation" ? "Percakapan AI belum diaktifkan..." : !canComment ? "Anda hanya dapat melihat diskusi ini" : replyToId ? "Tulis balasan..." : selectedDraftText ? "Tulis komentar untuk teks yang dipilih..." : "Pilih teks kontrak untuk mulai berkomentar"} className="min-h-20 w-full resize-none bg-transparent text-xs outline-none disabled:cursor-not-allowed"/><button type="button" disabled={activeSidebarTab === "conversation" || isCommenting || !canComment || (!replyToId && !selectedDraftText)} onClick={() => void sendMessage()} aria-label={activeSidebarTab === "conversation" ? "Kirim pertanyaan ke Klarisa AI" : "Kirim komentar diskusi"} className="ml-auto grid size-9 place-items-center rounded-full bg-[#172031] text-white hover:bg-klarisa-secondary disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4"/></button></div>
      </aside>
    </div>
  </div>;
}
