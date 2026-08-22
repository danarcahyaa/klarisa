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
  Redo2,
  Save,
  Search,
  Send,
  Share2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useContract } from "@/hooks/useContract";

const DRAFT_KEY = "klarisa:draft:contract-v1";
const TITLE_KEY = "klarisa:draft:contract-title-v1";

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

export function DraftEditor() {
  const searchParams = useSearchParams();
  const { data: remoteDraft, isLoading, isSaving, error: remoteError, saveDraft: saveRemoteDraft, dismissError } = useContract(searchParams.get("id"));
  const editorRef = useRef<HTMLElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIndexRef = useRef(0);
  const [title, setTitle] = useState("Surat Perjanjian Kerja Sama Jasa Digital");
  const [message, setMessage] = useState("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("conversation");
  const [discussionMessages, setDiscussionMessages] = useState(["Mas, bagian ini sebaiknya diberi batas waktu yang jelas."]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([{ role: "assistant", body: "Halo, saya siap membantu menjelaskan atau merapikan bagian draft yang Anda pilih." }]);
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [notice, setNotice] = useState("");

  const persistLocally = useCallback(() => {
    if (!editorRef.current) return;
    localStorage.setItem(DRAFT_KEY, editorRef.current.innerHTML);
    localStorage.setItem(TITLE_KEY, title);
    setSaveStatus("saved");
  }, [title]);

  const saveDraft = useCallback(async (createVersion = false) => {
    persistLocally();
    if (!editorRef.current || !remoteDraft) return;
    const saved = await saveRemoteDraft({ title, content: editorRef.current.innerHTML, createVersion });
    if (saved) setNotice(createVersion ? "Versi baru draft berhasil disimpan." : "Draft berhasil disimpan.");
  }, [persistLocally, remoteDraft, saveRemoteDraft, title]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void saveDraft(false); }, 900);
  }, [saveDraft]);

  const updateActiveCommands = useCallback(() => {
    if (!editorRef.current?.contains(document.activeElement)) return;
    const next = new Set<string>();
    toolbar.forEach(([, , command]) => {
      if (document.queryCommandState(command)) next.add(command);
    });
    setActiveCommands(next);
    const highlightColor = document.queryCommandValue("hiliteColor").toLowerCase();
    setIsHighlighted(highlightColor.includes("253") || highlightColor.includes("fde68a"));
  }, []);

  useEffect(() => {
    const savedContent = localStorage.getItem(DRAFT_KEY);
    const savedTitle = localStorage.getItem(TITLE_KEY);
    if (editorRef.current && savedContent) editorRef.current.innerHTML = savedContent;
    if (savedTitle) queueMicrotask(() => setTitle(savedTitle));
    document.addEventListener("selectionchange", updateActiveCommands);
    return () => {
      document.removeEventListener("selectionchange", updateActiveCommands);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [updateActiveCommands]);

  useEffect(() => {
    if (!remoteDraft || !editorRef.current) return;
    setTitle(remoteDraft.title);
    editorRef.current.innerHTML = remoteDraft.content || defaultDocument;
  }, [remoteDraft]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
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
    editorRef.current?.focus();
    const color = isHighlighted ? "transparent" : "#fde68a";
    const applied = document.execCommand("hiliteColor", false, color);
    if (!applied) document.execCommand("backColor", false, color);
    setIsHighlighted(!isHighlighted);
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
    void saveDraft(false);
    const shareData = { title, text: `Tinjau draft: ${title}`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setNotice("Draft siap dibagikan.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("Tautan draft disalin.");
      }
    } catch {
      setNotice("Pembagian draft dibatalkan.");
    }
  };

  const sendMessage = () => {
    const value = message.trim();
    if (!value) return;
    if (activeSidebarTab === "conversation") {
      setAiMessages((current) => [...current, { role: "user", body: value }, { role: "assistant", body: "Pertanyaan sudah dicatat. Jawaban AI akan tersedia setelah layanan model dihubungkan." }]);
    } else {
      setDiscussionMessages((current) => [...current, value]);
    }
    setMessage("");
  };

  return <div className="min-h-[calc(100svh-57px)] bg-white">
    <header className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-7">
      <span className="grid min-w-0 flex-1 gap-1">
        <input value={title} onChange={(event) => { setTitle(event.target.value); scheduleSave(); }} onBlur={() => void saveDraft(false)} aria-label="Judul dokumen" className="w-full max-w-xl bg-transparent text-xs font-bold outline-none focus:text-klarisa-secondary"/>
        <small className="flex items-center gap-1.5 text-[9px] text-slate-400">Draft v.{String(remoteDraft?.metadata.version ?? 1).padStart(2, "0")} · {isLoading ? "Memuat..." : isSaving || saveStatus === "saving" ? "Menyimpan..." : <><Check className="size-3 text-green-600"/>Tersimpan</>}</small>
      </span>
      <button type="button" onClick={() => void saveDraft(true)} disabled={isSaving || isLoading} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-klarisa-secondary hover:text-klarisa-secondary disabled:opacity-50"><Save className="size-4"/><span className="hidden sm:inline">Simpan versi</span></button>
      <button type="button" onClick={shareDraft} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white hover:bg-klarisa-secondary"><Share2 className="size-4"/>Bagikan</button>
    </header>

    {(notice || remoteError) && <div role={remoteError ? "alert" : "status"} className="fixed top-20 right-4 z-50 flex max-w-xs items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs font-semibold shadow-lg"><Check className="size-4 text-klarisa-secondary"/><span>{remoteError || notice}</span><button type="button" onClick={() => { setNotice(""); dismissError(); }} aria-label="Tutup pemberitahuan" className="grid size-7 shrink-0 place-items-center rounded hover:bg-slate-100"><X className="size-4 text-slate-400"/></button></div>}

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

        <article ref={editorRef} contentEditable suppressContentEditableWarning spellCheck onInput={scheduleSave} onKeyDown={handleEditorKeyDown} onMouseUp={updateActiveCommands} onKeyUp={updateActiveCommands} dangerouslySetInnerHTML={{ __html: defaultDocument }} className="mx-auto min-h-[calc(100svh-178px)] max-w-[900px] px-5 py-8 text-sm leading-7 outline-none selection:bg-[#dce6ff] empty:before:text-slate-400 empty:before:content-['Mulai_tulis_kontrak_Anda...'] sm:px-10 lg:px-14 [&_a]:text-klarisa-secondary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-klarisa-secondary [&_blockquote]:pl-4 [&_h2]:mt-7 [&_h2]:font-sans [&_h2]:text-sm [&_h2]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:min-h-[1.25rem] [&_ul]:list-disc"/>
      </section>

      <aside className="flex min-h-[440px] flex-col bg-white p-5">
        <div className="flex gap-1 border-b border-slate-200 pb-3"><button type="button" aria-pressed={activeSidebarTab === "conversation"} onClick={() => { setActiveSidebarTab("conversation"); setMessage(""); }} className={cn("rounded px-3 py-2 text-[10px]", activeSidebarTab === "conversation" ? "bg-slate-100 font-bold text-slate-900" : "text-slate-500 hover:text-slate-900")}>Percakapan</button><button type="button" aria-pressed={activeSidebarTab === "discussion"} onClick={() => { setActiveSidebarTab("discussion"); setMessage(""); }} className={cn("rounded px-3 py-2 text-[10px]", activeSidebarTab === "discussion" ? "bg-slate-100 font-bold text-slate-900" : "text-slate-500 hover:text-slate-900")}>Diskusi</button></div>
        {activeSidebarTab === "conversation" ? <>
          <div className="mt-5 rounded-lg border border-blue-100 bg-[#f7f9ff] p-4"><div className="flex items-center gap-2"><Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={28} height={28} className="size-7 object-contain"/><b className="text-[11px]">Klarisa AI</b><Image src="/klarisa/ai.png" alt="" aria-hidden width={13} height={13} className="ml-auto size-3.5 object-contain"/></div><p className="mt-3 text-[10px] leading-5 text-slate-500">Tanyakan isi draft atau minta bantuan memperjelas kalimat yang Anda pilih.</p></div>
          <div className="mt-5 grid gap-4">{aiMessages.map((item, index) => <article key={`${item.role}-${index}`} className={cn("grid grid-cols-[30px_1fr] gap-3", item.role === "user" && "grid-cols-[1fr_30px]")}><span className={cn("grid size-8 place-items-center rounded-full bg-[#edf2ff]", item.role === "user" && "order-2 bg-slate-100 text-[9px] font-bold text-slate-600")}>{item.role === "assistant" ? <Image src="/klarisa/logo-ai.png" alt="Klarisa AI" width={22} height={22} className="size-5 object-contain"/> : "AN"}</span><span className={item.role === "user" ? "text-right" : ""}><b className="text-[11px]">{item.role === "assistant" ? "Klarisa AI" : "Anda"}</b><small className="mt-1 block text-[10px] leading-5 text-slate-600">{item.body}</small></span></article>)}</div>
        </> : <>
          <div className="mt-5"><p className="text-[10px] font-bold text-slate-700">Diskusi pihak terkait</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Komentar dari orang yang terlibat dalam dokumen ini.</p></div>
          <div className="mt-5 grid gap-4">{discussionMessages.map((item,index)=><article key={`${item}-${index}`} className="grid grid-cols-[30px_1fr] gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#edf2ff] text-[9px] font-bold text-klarisa-secondary">{index===0?"JS":"AN"}</span><span><b className="text-[11px]">{index===0?"Joko Sam":"Anda"}</b><small className="mt-1 block text-[10px] leading-5 text-slate-600">{item}</small></span></article>)}</div>
        </>}
        <div className="mt-auto rounded-lg bg-slate-100 p-4"><textarea value={message} onChange={(event)=>setMessage(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendMessage();}}} placeholder={activeSidebarTab === "conversation" ? "Tanyakan isi draft kepada Klarisa AI..." : "Tulis komentar, @ untuk menandai pihak..."} className="min-h-20 w-full resize-none bg-transparent text-xs outline-none"/><button type="button" onClick={sendMessage} aria-label={activeSidebarTab === "conversation" ? "Kirim pertanyaan ke Klarisa AI" : "Kirim komentar diskusi"} className="ml-auto grid size-9 place-items-center rounded-full bg-[#172031] text-white hover:bg-klarisa-secondary"><Send className="size-4"/></button></div>
      </aside>
    </div>
  </div>;
}
