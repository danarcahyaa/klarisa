"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  History,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreHorizontal,
  Redo2,
  RotateCcw,
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
import { Button, SubmitButton } from "@/components/ui/button";
import { useDraft } from "@/hooks/useDraft";
import { DraftDiscussionThread } from "@/components/draft-discussion-thread";
import type { ContractDetail, DraftComment, DraftVersionContent } from "@/types/contract.type";

const DRAFT_BACKUP_KEY = "klarisa:draft:backup";
const LEGACY_DRAFT_KEY = "klarisa:draft:content";
const LEGACY_TITLE_KEY = "klarisa:draft:title";

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
  <p>SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</p>
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

type SaveStatus = "saved" | "saving" | "error";
type SidebarTab = "conversation" | "discussion";
type AiMessage = { role: "assistant" | "user"; body: string };
type LocalDraftBackup = { content: string; title: string; savedAt: string };

function readLocalDraftBackup(draftId: string) {
  try {
    const value = localStorage.getItem(`${DRAFT_BACKUP_KEY}:${draftId}`);
    if (!value) return null;
    const backup = JSON.parse(value) as Partial<LocalDraftBackup>;
    if (typeof backup.content !== "string" || typeof backup.title !== "string" || typeof backup.savedAt !== "string") return null;
    return backup as LocalDraftBackup;
  } catch {
    return null;
  }
}

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
  const nodes: Text[] = [];
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text);
  else {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (range.intersectsNode(current)) nodes.push(current as Text);
      current = walker.nextNode();
    }
  }
  let firstMarker: HTMLElement | null = null;
  for (const node of nodes) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.data.length;
    if (start >= end) continue;
    const segment = document.createRange();
    segment.setStart(node, start);
    segment.setEnd(node, end);
    const marker = document.createElement("span");
    marker.dataset.draftCommentId = commentId;
    marker.className = "draft-comment-anchor rounded-sm bg-amber-200 px-0.5 ring-1 ring-amber-300";
    segment.surroundContents(marker);
    firstMarker ??= marker;
  }
  return firstMarker;
}

function removeCommentAnchors(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-draft-comment-id]").forEach((marker) => {
    if (!marker.textContent?.trim()) {
      marker.remove();
      return;
    }
    marker.replaceWith(...Array.from(marker.childNodes));
  });
}

function getPersistableContent(editor: HTMLElement) {
  const clone = editor.cloneNode(true) as HTMLElement;
  removeCommentAnchors(clone);
  return clone.innerHTML;
}

function renderCommentAnchors(editor: HTMLElement, comments: DraftComment[]) {
  removeCommentAnchors(editor);
  const anchored = comments
    .filter((item) => !item.parentId && item.positionStart !== null && item.positionEnd !== null)
    .sort((a, b) => (b.positionStart ?? 0) - (a.positionStart ?? 0));
  for (const comment of anchored) {
    const range = findTextRange(editor, comment.positionStart!, comment.positionEnd!);
    const sourceText = range?.toString().replace(/\s+/g, " ").trim();
    const selectedText = comment.selectedText?.replace(/\s+/g, " ").trim();
    if (range && !range.collapsed && sourceText === selectedText) wrapCommentRange(range, comment.id);
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
    isLoadingVersion,
    isRestoringVersion,
    isManagingAccess,
    error: remoteError,
    saveDraft: saveRemoteDraft,
    deleteDraft,
    getDraftVersion,
    restoreDraftVersion,
    addComment,
    updateComment,
    deleteComment,
    setCommentResolved,
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    dismissError,
  } = useDraft(initialDraft);
  const editorRef = useRef<HTMLElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localBackupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIndexRef = useRef(0);
  const orphanSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusRef = useRef<SaveStatus>("saved");
  const preserveSelectionOnNextChangeRef = useRef(false);
  const [title, setTitle] = useState(initialDraft.title);
  const titleRef = useRef(initialDraft.title);
  const [message, setMessage] = useState("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("conversation");
  const aiMessages: AiMessage[] = [{ role: "assistant", body: "Percakapan Klarisa AI akan tersedia setelah layanan Gemini dan sumber hukum terhubung." }];
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [notice, setNotice] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DraftVersionContent | null>(null);
  const [versionToRestore, setVersionToRestore] = useState<DraftVersionContent | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedDraftText, setSelectedDraftText] = useState("");
  const [selectedTextPosition, setSelectedTextPosition] = useState<{ start: number; end: number } | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const canEdit = remoteDraft.permission === "owner";
  const canComment = canEdit || remoteDraft.permission === "commenter";

  const setEditorSaveStatus = useCallback((status: SaveStatus) => {
    saveStatusRef.current = status;
    setSaveStatus(status);
  }, []);

  const clearLocalBackup = useCallback(() => {
    localStorage.removeItem(`${DRAFT_BACKUP_KEY}:${remoteDraft.id}`);
    localStorage.removeItem(`${LEGACY_DRAFT_KEY}:${remoteDraft.id}`);
    localStorage.removeItem(`${LEGACY_TITLE_KEY}:${remoteDraft.id}`);
  }, [remoteDraft.id]);

  useEffect(() => {
    if (!notice && !remoteError) return;
    const timeoutId = window.setTimeout(() => {
      setNotice("");
      dismissError();
    }, remoteError ? 6000 : 3500);
    return () => window.clearTimeout(timeoutId);
  }, [dismissError, notice, remoteError]);

  const persistLocally = useCallback(() => {
    if (!canEdit || !editorRef.current) return;
    const backup: LocalDraftBackup = {
      content: getPersistableContent(editorRef.current),
      title: titleRef.current,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${DRAFT_BACKUP_KEY}:${remoteDraft.id}`, JSON.stringify(backup));
  }, [canEdit, remoteDraft.id]);

  const scheduleLocalBackup = useCallback(() => {
    if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
    localBackupTimerRef.current = setTimeout(persistLocally, 350);
  }, [persistLocally]);

  const saveDraft = useCallback(async (createVersion = false) => {
    if (!editorRef.current || !remoteDraft || !canEdit) return false;
    persistLocally();
    const saved = await saveRemoteDraft({ title: titleRef.current, content: getPersistableContent(editorRef.current), createVersion });
    setEditorSaveStatus(saved ? "saved" : "error");
    if (saved) {
      clearLocalBackup();
      setNotice(createVersion ? "Versi baru draft berhasil disimpan." : "Draft berhasil disimpan.");
    }
    return saved;
  }, [canEdit, clearLocalBackup, persistLocally, remoteDraft, saveRemoteDraft, setEditorSaveStatus]);

  const scheduleSave = useCallback(() => {
    setEditorSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void saveDraft(false); }, 900);
  }, [saveDraft, setEditorSaveStatus]);

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
      const end = start + range.toString().length;
      setSelectedTextPosition((current) => current?.start === start && current.end === end ? current : { start, end });
    } else if (document.activeElement === editorRef.current && !preserveSelectionOnNextChangeRef.current) {
      setSelectedDraftText("");
      setSelectedTextPosition(null);
    }
    const next = new Set<string>();
    toolbar.forEach(([, , command]) => {
      if (document.queryCommandState(command)) next.add(command);
    });
    setActiveCommands((current) => {
      const unchanged = current.size === next.size && [...next].every((command) => current.has(command));
      return unchanged ? current : next;
    });
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
    const backup = canEdit ? readLocalDraftBackup(initialDraft.id) : null;
    const backupTime = backup ? Date.parse(backup.savedAt) : Number.NaN;
    const remoteTime = Date.parse(initialDraft.updatedAt);
    const shouldRecoverBackup = Boolean(backup && Number.isFinite(backupTime) && backupTime > remoteTime);
    if (editorRef.current) {
      editorRef.current.innerHTML = shouldRecoverBackup ? backup!.content : initialDraft.content || defaultDocument;
      renderCommentAnchors(editorRef.current, initialDraft.comments);
    }
    queueMicrotask(() => {
      const recoveredTitle = shouldRecoverBackup ? backup!.title : initialDraft.title;
      titleRef.current = recoveredTitle;
      setTitle(recoveredTitle);
      if (shouldRecoverBackup) {
        setNotice("Perubahan lokal yang belum tersimpan berhasil dipulihkan.");
        void saveRemoteDraft({ title: backup!.title, content: backup!.content, createVersion: false }).then((saved) => {
          setEditorSaveStatus(saved ? "saved" : "error");
          if (saved) clearLocalBackup();
        });
      } else if (backup) {
        clearLocalBackup();
      }
    });
    document.addEventListener("selectionchange", updateActiveCommands);
    return () => {
      if (canEdit && saveStatusRef.current !== "saved") persistLocally();
      document.removeEventListener("selectionchange", updateActiveCommands);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
      if (orphanSyncTimerRef.current) clearTimeout(orphanSyncTimerRef.current);
    };
  }, [canEdit, clearLocalBackup, initialDraft.comments, initialDraft.content, initialDraft.id, initialDraft.title, initialDraft.updatedAt, persistLocally, saveRemoteDraft, setEditorSaveStatus, updateActiveCommands]);

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
    clearLocalBackup();
    router.push("/dashboard/search");
    router.refresh();
  };

  const previewVersion = async (versionId: string) => {
    const version = await getDraftVersion(versionId);
    if (version) setSelectedVersion(version);
  };

  const confirmRestoreVersion = async () => {
    if (!versionToRestore) return;
    const restored = await restoreDraftVersion(versionToRestore.id);
    if (!restored) return;
    titleRef.current = restored.title;
    setTitle(restored.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = restored.content;
      renderCommentAnchors(editorRef.current, []);
    }
    clearLocalBackup();
    setEditorSaveStatus("saved");
    setVersionToRestore(null);
    setSelectedVersion(null);
    setIsVersionsOpen(false);
    setNotice(`Draft dipulihkan ke versi ${String(restored.version).padStart(2, "0")}.`);
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

  const changeCollaboratorRole = async (userId: string, role: "commenter" | "viewer") => {
    const updated = await updateCollaboratorRole({ userId, role });
    if (updated) setNotice("Akses pihak terkait diperbarui.");
  };

  const revokeCollaboratorAccess = async (userId: string) => {
    const removed = await removeCollaborator(userId);
    if (removed) setNotice("Akses pihak terkait dicabut.");
  };

  const updateDiscussionComment = async (commentId: string, body: string) => {
    const updated = await updateComment(commentId, { body });
    if (updated) setNotice("Komentar diperbarui.");
    return updated;
  };

  const deleteDiscussionComment = async (commentId: string) => {
    const deleted = await deleteComment(commentId);
    if (deleted) {
      const remainingComments = remoteDraft.comments.filter((item) => item.id !== commentId && item.parentId !== commentId);
      if (editorRef.current) renderCommentAnchors(editorRef.current, remainingComments);
      setNotice("Komentar dan sorotan teksnya dihapus.");
    }
    return deleted;
  };

  const setDiscussionResolved = async (commentId: string, resolved: boolean) => {
    const updated = await setCommentResolved(commentId, resolved);
    if (updated) setNotice(resolved ? "Diskusi ditandai selesai." : "Diskusi dibuka kembali.");
    return updated;
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
      if (!replyToId && editorRef.current) {
        renderCommentAnchors(editorRef.current, [...remoteDraft.comments, comment]);
        editorRef.current.querySelector<HTMLElement>(`[data-draft-comment-id="${comment.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setReplyToId(null);
      clearSelectedDraftText();
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
    if (!canEdit) return;
    scheduleLocalBackup();
    scheduleSave();
    if (orphanSyncTimerRef.current) clearTimeout(orphanSyncTimerRef.current);
    orphanSyncTimerRef.current = setTimeout(syncOrphanedComments, 350);
  };

  const preserveDraftSelectionForComment = () => {
    // Clicking the composer collapses the browser selection before focus moves.
    // Keep the stored range so the comment still targets the selected text.
    preserveSelectionOnNextChangeRef.current = true;
    window.setTimeout(() => {
      preserveSelectionOnNextChangeRef.current = false;
    }, 0);
  };

  const clearSelectedDraftText = () => {
    selectionRangeRef.current = null;
    setSelectedDraftText("");
    setSelectedTextPosition(null);
  };

  const replyTarget = replyToId ? remoteDraft.comments.find((item) => item.id === replyToId) : null;

  return <div className="min-h-[calc(100svh-57px)] bg-white">
    <header className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-7">
      <span className="grid min-w-0 flex-1 gap-1">
        <input value={title} readOnly={!canEdit} onChange={(event) => { titleRef.current = event.target.value; setTitle(event.target.value); scheduleLocalBackup(); scheduleSave(); }} onBlur={() => void saveDraft(false)} aria-label="Judul dokumen" className="w-full max-w-xl bg-transparent text-xs font-bold outline-none focus:text-klarisa-secondary read-only:cursor-default"/>
        <small className="flex items-center gap-1.5 text-xs text-slate-400">Draft v.{String(remoteDraft.metadata.version ?? 1).padStart(2, "0")} · {!canEdit ? "Akses komentar" : isSaving || saveStatus === "saving" ? "Menyimpan..." : saveStatus === "error" ? <span className="text-red-600">Gagal tersimpan</span> : <><Check className="size-3 text-green-600"/>Tersimpan</>}</small>
      </span>
      {canEdit && (
        <Button variant="outline" size="sm" type="button" onClick={() => void saveDraft(true)} disabled={isSaving} className="hidden sm:inline-flex">
          <Save className="size-4" />
          <span className="hidden sm:inline">Simpan versi</span>
        </Button>
      )}
      {canEdit && (
        <Button variant="outline" size="sm" type="button" onClick={() => { setSelectedVersion(null); setIsVersionsOpen(true); }} className="hidden sm:inline-flex">
          <History className="size-4" />
          <span className="hidden sm:inline">Riwayat versi</span>
        </Button>
      )}
      {remoteDraft.permission === "owner" && (
        <SubmitButton variant="default" size="sm" type="button" isLoading={isSharing} loadingText="Menyiapkan..." onClick={shareDraft} leftIcon={<Share2 className="size-4" />}>
          Bagikan
        </SubmitButton>
      )}
      {remoteDraft.permission === "owner" && (
        <div className="relative">
          <Button variant="outline" size="icon-sm" type="button" aria-label="Aksi draft lainnya" aria-expanded={isActionsOpen} onClick={() => setIsActionsOpen((current) => !current)}>
            <MoreHorizontal className="size-4" />
          </Button>
          {isActionsOpen && (
            <div className="absolute top-12 right-0 z-50 w-44 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
              <Button variant="destructive" size="xs" type="button" onClick={() => { setIsActionsOpen(false); setIsDeleteOpen(true); }} className="w-full justify-start">
                <Trash2 className="size-4" />Hapus draft
              </Button>
            </div>
          )}
        </div>
      )}
    </header>

    {(notice || remoteError) && (
      <div role={remoteError ? "alert" : "status"} className="fixed top-20 right-4 z-50 flex max-w-xs items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs font-semibold shadow-lg">
        <Check className="size-4 text-klarisa-secondary" />
        <span>{remoteError || notice}</span>
        <Button variant="ghost" size="icon-xs" type="button" onClick={() => { setNotice(""); dismissError(); }} aria-label="Tutup pemberitahuan">
          <X className="size-4 text-slate-400" />
        </Button>
      </div>
    )}

    {isShareOpen && (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
        <button type="button" aria-label="Tutup panel bagikan" onClick={() => setIsShareOpen(false)} className="absolute inset-0" />
        <section role="dialog" aria-modal="true" aria-labelledby="share-draft-title" className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">BAGIKAN DRAFT</p>
              <h2 id="share-draft-title" className="mt-2 text-xl font-semibold tracking-[-.03em]">Tambahkan pihak terkait.</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">Atur siapa yang dapat melihat atau memberi komentar pada draft ini.</p>
            </div>
            <Button variant="ghost" size="icon-xs" type="button" onClick={() => setIsShareOpen(false)} aria-label="Tutup">
              <X className="size-4" />
            </Button>
          </div>
          <form onSubmit={submitInvitation} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-xs font-semibold text-slate-600">Email pengguna
              <input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="nama@contoh.com" className="h-11 rounded-md border border-slate-200 px-3 text-xs font-normal outline-none focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10" />
            </label>
            <div className="rounded-md bg-[#f5f7ff] px-4 py-3 text-xs leading-5 text-slate-600">
              <b className="text-klarisa-secondary">Komentator</b> dapat berdiskusi. <b className="text-klarisa-secondary">Peninjau</b> hanya dapat membaca isi draft.
            </div>
            <div className="flex justify-end gap-2">
              <SubmitButton variant="default" size="sm" type="submit" isLoading={isSharing} loadingText="Menambahkan...">
                Undang dan salin tautan
              </SubmitButton>
            </div>
          </form>
          {remoteDraft.collaborators.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">ORANG YANG MEMILIKI AKSES</p>
              <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1">
                {remoteDraft.collaborators.map((collaborator) => (
                  <div key={collaborator.userId} className="flex items-center gap-2 rounded-md border border-slate-200 p-2.5">
                    <span className="grid size-7 place-items-center rounded-full bg-[#edf2ff] text-xs font-bold text-klarisa-secondary">{collaborator.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-xs font-semibold">{collaborator.name}</b>
                      <small className="block text-xs text-slate-400">{collaborator.role === "commenter" ? "Dapat berkomentar" : "Hanya melihat"}</small>
                    </span>
                    <select aria-label={`Peran ${collaborator.name}`} value={collaborator.role === "commenter" ? "commenter" : "viewer"} disabled={isManagingAccess} onChange={(event) => void changeCollaboratorRole(collaborator.userId, event.target.value as "commenter" | "viewer")} className="h-8 rounded border border-slate-200 bg-white px-2 text-xs font-semibold outline-none">
                      <option value="commenter">Komentator</option>
                      <option value="viewer">Peninjau</option>
                    </select>
                    <Button variant="ghost" size="icon-xs" type="button" disabled={isManagingAccess} onClick={() => void revokeCollaboratorAccess(collaborator.userId)} aria-label={`Cabut akses ${collaborator.name}`}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsShareOpen(false)}>Selesai</Button>
          </div>
        </section>
      </div>
    )}

    {isVersionsOpen && (
      <div className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
        <button type="button" aria-label="Tutup riwayat versi" onClick={() => setIsVersionsOpen(false)} className="absolute inset-0" />
        <section role="dialog" aria-modal="true" aria-labelledby="version-history-title" className="relative grid max-h-[min(720px,calc(100svh-2rem))] w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 p-5 md:border-r md:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">RIWAYAT DRAFT</p>
                <h2 id="version-history-title" className="mt-2 text-lg font-semibold tracking-[-.03em]">Versi tersimpan</h2>
              </div>
              <Button variant="ghost" size="icon-xs" type="button" onClick={() => setIsVersionsOpen(false)} aria-label="Tutup">
                <X className="size-4" />
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Pilih versi untuk melihat isi sebelumnya.</p>
            <div className="mt-5 grid max-h-64 gap-1 overflow-y-auto md:max-h-[510px]">
              {remoteDraft.versions.map((version) => (
                <button key={version.id} type="button" onClick={() => void previewVersion(version.id)} disabled={isLoadingVersion} className={cn("grid gap-1 rounded-md px-3 py-3 text-left transition-colors hover:bg-[#f5f7ff] disabled:cursor-wait", selectedVersion?.id === version.id && "bg-[#edf2ff] text-klarisa-secondary")}>
                  <span className="flex items-center justify-between gap-3">
                    <b className="text-xs font-semibold">Versi {String(version.version).padStart(2, "0")}</b>
                    <time className="text-xs text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(version.createdAt))}</time>
                  </span>
                  <small className="truncate text-xs text-slate-500">{version.title}</small>
                </button>
              ))}
              {remoteDraft.versions.length === 0 && <p className="px-3 py-5 text-xs leading-5 text-slate-400">Belum ada versi tersimpan.</p>}
            </div>
          </div>
          <div className="flex min-h-0 flex-col bg-slate-50/60">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">PRATINJAU VERSI</p>
              <h3 className="mt-2 text-base font-semibold">{selectedVersion ? selectedVersion.title : "Pilih versi draft"}</h3>
            </div>
            {selectedVersion ? (
              <>
                <article dangerouslySetInnerHTML={{ __html: selectedVersion.content }} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 text-xs leading-6 text-slate-700 [&_h2]:mt-6 [&_h2]:font-sans [&_h2]:text-xs [&_h2]:font-bold [&_p]:mt-3" />
                <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
                  <small className="text-xs leading-5 text-slate-500">Pemulihan mengganti isi draft tanpa menambah riwayat. Diskusi lama tetap tersimpan, tetapi sorotannya tidak dipasang pada versi ini.</small>
                  <Button variant="default" size="sm" type="button" onClick={() => setVersionToRestore(selectedVersion)}>
                    <RotateCcw className="size-4" />Pulihkan versi ini
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <p className="max-w-xs text-xs leading-5 text-slate-400">Pilih salah satu versi di sebelah kiri untuk melihat isi dan memulihkannya bila diperlukan.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    {versionToRestore && (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
        <button type="button" aria-label="Batal memulihkan versi" onClick={() => setVersionToRestore(null)} className="absolute inset-0" />
        <section role="alertdialog" aria-modal="true" aria-labelledby="restore-version-title" aria-describedby="restore-version-description" className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
          <span className="grid size-10 place-items-center rounded-full bg-[#edf2ff] text-klarisa-secondary"><RotateCcw className="size-4" /></span>
          <h2 id="restore-version-title" className="mt-4 text-xl font-semibold tracking-[-.03em]">Pulihkan versi {String(versionToRestore.version).padStart(2, "0")}?</h2>
          <p id="restore-version-description" className="mt-2 text-xs leading-5 text-slate-500">Isi draft saat ini akan diganti dengan versi pilihan tanpa membuat versi baru. Diskusi sebelumnya tetap tersimpan, tetapi sorotan teksnya tidak dibawa ke versi yang dipulihkan.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" disabled={isRestoringVersion} onClick={() => setVersionToRestore(null)}>Batal</Button>
            <SubmitButton variant="default" size="sm" type="button" isLoading={isRestoringVersion} loadingText="Memulihkan..." onClick={() => void confirmRestoreVersion()} leftIcon={<RotateCcw className="size-4" />}>
              Pulihkan versi
            </SubmitButton>
          </div>
        </section>
      </div>
    )}

    {isDeleteOpen && (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
        <button type="button" aria-label="Batal menghapus draft" onClick={() => setIsDeleteOpen(false)} className="absolute inset-0" />
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-draft-title" aria-describedby="delete-draft-description" className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
          <span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="size-4" /></span>
          <h2 id="delete-draft-title" className="mt-4 text-xl font-semibold tracking-[-.03em]">Hapus draft ini?</h2>
          <p id="delete-draft-description" className="mt-2 text-xs leading-5 text-slate-500">Draft, versi tersimpan, komentar, dan akses pihak terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <SubmitButton variant="destructive" size="sm" type="button" isLoading={isDeleting} loadingText="Menghapus..." onClick={() => void confirmDeleteDraft()} leftIcon={<Trash2 className="size-4" />}>
              Hapus permanen
            </SubmitButton>
          </div>
        </section>
      </div>
    )}

    <div className="grid min-h-[calc(100svh-125px)] xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 border-b border-slate-200 xl:border-r xl:border-b-0">
        <div className="sticky top-16 z-20 border-b border-slate-200 bg-white lg:top-[57px]">
          {isSearchOpen && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 sm:px-6">
              <Search className="size-4 text-klarisa-secondary" />
              <input autoFocus value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); searchIndexRef.current = 0; setSearchFeedback(""); }} onKeyDown={(event) => { if (event.key === "Enter") findNext(); if (event.key === "Escape") setIsSearchOpen(false); }} placeholder="Cari di dalam kontrak..." className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none" />
              <span className="text-xs text-slate-400">{searchFeedback}</span>
              <Button variant="default" size="xs" type="button" onClick={findNext}>Cari berikutnya</Button>
              <Button variant="ghost" size="icon-xs" type="button" onClick={() => setIsSearchOpen(false)} aria-label="Tutup pencarian"><X className="size-4" /></Button>
            </div>
          )}
          <div className="flex min-h-13 items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
            <button type="button" aria-label="Cari dalam dokumen" onClick={() => setIsSearchOpen((current) => !current)} className={cn("grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100", isSearchOpen && "bg-[#edf2ff] text-klarisa-secondary")}><Search className="size-4" /></button>
            {canEdit && (
              <>
                <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />
                <button type="button" aria-label="Urungkan" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Undo2 className="size-4" /></button>
                <button type="button" aria-label="Ulangi" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Redo2 className="size-4" /></button>
                <select aria-label="Gaya paragraf" defaultValue="p" onChange={(event) => runCommand("formatBlock", event.target.value)} className="mx-2 h-9 shrink-0 rounded border border-slate-200 bg-white px-2 text-xs outline-none"><option value="p">Paragraf</option><option value="h2">Judul pasal</option><option value="blockquote">Kutipan</option></select>
                {toolbar.map(([label, Icon, command]) => <button key={label} type="button" title={label} aria-label={label} aria-pressed={activeCommands.has(command)} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand(command)} className={cn("grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100", activeCommands.has(command) && "bg-[#eaf0ff] text-klarisa-secondary")}><Icon className="size-4" /></button>)}
                <button type="button" aria-label="Tambahkan tautan" onMouseDown={(event) => event.preventDefault()} onClick={insertLink} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Link2 className="size-4" /></button>
              </>
            )}
          </div>
        </div>

        <article ref={editorRef} contentEditable={canEdit} suppressContentEditableWarning spellCheck onInput={handleEditorInput} onKeyDown={handleEditorKeyDown} onMouseUp={updateActiveCommands} onKeyUp={updateActiveCommands} dangerouslySetInnerHTML={{ __html: initialDraft.content }} className="mx-auto min-h-[calc(100svh-178px)] max-w-[900px] px-5 py-8 text-sm leading-7 outline-none selection:bg-[#dce6ff] empty:before:text-slate-400 empty:before:content-['Mulai_tulis_kontrak_Anda...'] sm:px-10 lg:px-14 [&_a]:text-klarisa-secondary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-klarisa-secondary [&_blockquote]:pl-4 [&_h2]:mt-7 [&_h2]:font-sans [&_h2]:text-sm [&_h2]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:min-h-[1.25rem] [&_ul]:list-disc" />
      </section>

      <aside className="flex min-h-[440px] flex-col bg-white p-5 xl:sticky xl:top-[57px] xl:h-[calc(100svh-125px)] xl:overflow-hidden [&>div:nth-last-child(2)]:mb-6">
        <div className="flex gap-1 border-b border-slate-200 pb-3">
          <Button variant={activeSidebarTab === "conversation" ? "secondary" : "ghost"} size="xs" type="button" onClick={() => { setActiveSidebarTab("conversation"); setMessage(""); }}>Percakapan</Button>
          <Button variant={activeSidebarTab === "discussion" ? "secondary" : "ghost"} size="xs" type="button" onClick={() => { setActiveSidebarTab("discussion"); setMessage(""); }}>Diskusi</Button>
        </div>
        {activeSidebarTab === "conversation" ? (
          <>
            <div className="mt-5 rounded-lg border border-blue-100 bg-[#f7f9ff] p-4"><div className="flex items-center gap-2"><Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={28} height={28} className="size-7 object-contain" /><b className="text-xs font-semibold">Klarisa AI</b><Image src="/klarisa/ai.png" alt="" aria-hidden width={13} height={13} className="ml-auto size-3.5 object-contain" /></div><p className="mt-3 text-xs leading-5 text-slate-500">Tanyakan isi draft atau minta bantuan memperjelas kalimat yang Anda pilih.</p></div>
            <div className="mt-5 grid gap-4">{aiMessages.map((item, index) => <article key={`${item.role}-${index}`} className={cn("grid grid-cols-[30px_1fr] gap-3", item.role === "user" && "grid-cols-[1fr_30px]")}><span className={cn("grid size-8 place-items-center rounded-full bg-[#edf2ff]", item.role === "user" && "order-2 bg-slate-100 text-xs font-bold text-slate-600")}>{item.role === "assistant" ? <Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={22} height={22} className="size-5 object-contain" /> : "AN"}</span><span className={item.role === "user" ? "text-right" : ""}><b className="text-xs font-semibold">{item.role === "assistant" ? "Klarisa AI" : "Anda"}</b><small className="mt-1 block text-xs leading-5 text-slate-600">{item.body}</small></span></article>)}</div>
          </>
        ) : (
          <>
            <div className="mt-5"><p className="text-xs font-semibold text-slate-700">Diskusi pihak terkait</p><p className="mt-1 text-xs text-slate-400">Komentar dari orang yang terlibat dalam dokumen ini.</p></div>
            {selectedDraftText && !replyToId && (
              <div className="mt-4 rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-wider text-amber-700 uppercase">TEKS UNTUK DIKOMENTARI</p>
                  <Button variant="ghost" size="icon-xs" type="button" onClick={clearSelectedDraftText} aria-label="Batalkan teks yang dipilih"><X className="size-3" /></Button>
                </div>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">“{selectedDraftText}”</p>
              </div>
            )}
            <DraftDiscussionThread comments={remoteDraft.comments} canManage={canEdit} canComment={canComment} isPending={isCommenting} onFocusSource={focusCommentSource} onReply={(commentId) => { setReplyToId(commentId); setMessage(""); }} onUpdate={updateDiscussionComment} onDelete={deleteDiscussionComment} onSetResolved={setDiscussionResolved} />
          </>
        )}
        <div className="mt-auto rounded-lg bg-slate-100 p-4">
          {activeSidebarTab === "discussion" && replyTarget && (
            <div className="mb-2 flex items-center justify-between rounded bg-white px-3 py-2 text-xs text-slate-500">
              <span>Membalas {replyTarget.isOwn ? "komentar Anda" : replyTarget.authorName}</span>
              <Button variant="ghost" size="icon-xs" type="button" onClick={() => setReplyToId(null)} aria-label="Batal membalas"><X className="size-3" /></Button>
            </div>
          )}
          <textarea value={message} disabled={activeSidebarTab === "conversation" || !canComment} onPointerDown={activeSidebarTab === "discussion" ? preserveDraftSelectionForComment : undefined} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={activeSidebarTab === "conversation" ? "Percakapan AI belum diaktifkan..." : !canComment ? "Anda hanya dapat melihat diskusi ini" : replyToId ? "Tulis balasan..." : selectedDraftText ? "Tulis komentar untuk teks yang dipilih..." : "Pilih teks kontrak untuk mulai berkomentar"} className="min-h-20 w-full resize-none bg-transparent text-xs outline-none disabled:cursor-not-allowed" />
          <SubmitButton variant="default" size="icon-sm" type="button" disabled={activeSidebarTab === "conversation" || isCommenting || !canComment || (!replyToId && !selectedDraftText)} onClick={() => void sendMessage()} aria-label={activeSidebarTab === "conversation" ? "Kirim pertanyaan ke Klarisa AI" : "Kirim komentar diskusi"} className="ml-auto">
            <Send className="size-4" />
          </SubmitButton>
        </div>
      </aside>
    </div>
  </div>;
}
