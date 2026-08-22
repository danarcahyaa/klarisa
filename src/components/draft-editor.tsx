"use client";

import { Bold, List, ListOrdered, Redo2, Search, Send, Share2, TextAlignJustify, Underline, Undo2 } from "lucide-react";
import { useState } from "react";

const toolbar = [
  ["Tebal", Bold, "bold"],
  ["Garis bawah", Underline, "underline"],
  ["Daftar", List, "insertUnorderedList"],
  ["Daftar bernomor", ListOrdered, "insertOrderedList"],
  ["Rata kiri kanan", TextAlignJustify, "justifyFull"],
] as const;

export function DraftEditor() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(["Mas, bagian ini sebaiknya diberi batas waktu yang jelas."]);
  const sendMessage = () => {
    const value = message.trim();
    if (!value) return;
    setMessages((current) => [...current, value]);
    setMessage("");
  };
  const command = (name: string) => {
    document.execCommand(name);
  };
  return <div className="min-h-[calc(100svh-57px)] bg-white">
    <header className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-7"><span className="grid gap-1"><b className="text-xs">Surat Perjanjian Kerja Sama Jasa Digital</b><small className="text-[9px] text-slate-400">10 September 2026 · Draft v.01</small></span><button type="button" className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-md bg-[#172031] px-4 text-xs font-bold text-white"><Share2 className="size-4"/>Bagikan</button></header>
    <div className="grid min-h-[calc(100svh-125px)] xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="min-w-0 border-b border-slate-200 xl:border-r xl:border-b-0">
        <div className="sticky top-16 z-20 flex min-h-13 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:top-[57px] sm:px-6">
          <button type="button" aria-label="Cari" className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Search className="size-4"/></button>
          <button type="button" aria-label="Urungkan" onClick={()=>command("undo")} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Undo2 className="size-4"/></button>
          <button type="button" aria-label="Ulangi" onClick={()=>command("redo")} className="mr-2 grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Redo2 className="size-4"/></button>
          {toolbar.map(([label,Icon,name])=><button key={label} type="button" aria-label={label} onMouseDown={event=>event.preventDefault()} onClick={()=>command(name)} className="grid size-9 shrink-0 place-items-center rounded hover:bg-slate-100"><Icon className="size-4"/></button>)}
        </div>
        <article contentEditable suppressContentEditableWarning className="mx-auto min-h-[calc(100svh-178px)] max-w-[900px] px-5 py-8 text-sm leading-7 outline-none sm:px-10 lg:px-14">
          <p><mark className="bg-amber-200 px-1">SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</mark></p><p className="mt-3">Nomor: [NOMOR_KONTRAK]/SPK/2026</p><p className="mt-3">Pada hari ini, [HARI], tanggal [TANGGAL], disepakati perjanjian kerja sama antara:</p><p className="mt-2 pl-6">[NAMA PIHAK PERTAMA] (selanjutnya disebut “PIHAK PERTAMA”)</p><p className="mt-2 pl-6">[NAMA PIHAK KEDUA] (selanjutnya disebut “PIHAK KEDUA”)</p>
          <h2 className="mt-7 font-sans text-sm font-bold">PASAL 1: RUANG LINGKUP &amp; BIAYA</h2><p className="mt-2 pl-6">PIHAK KEDUA melaksanakan pekerjaan [OBJEK_PEKERJAAN] dengan total nilai imbalan Rp [NOMINAL].</p><p className="mt-2 pl-6">Pembayaran dilakukan bertahap: Uang Muka (DP) [DP]% dan Pelunasan [PELUNASAN]% maksimal 7 hari kerja setelah pekerjaan diserahkan.</p>
          <h2 className="mt-7 font-sans text-sm font-bold">PASAL 2: HAK CIPTA &amp; KERAHASIAAN (NDA)</h2><p className="mt-2 pl-6">HKI: Hak moral dan hak cipta tetap melekat pada PIHAK KEDUA. PIHAK PERTAMA memperoleh Hak Guna Pakai Komersial secara sah setelah pembayaran lunas.</p><p className="mt-2 pl-6">Kerahasiaan: PARA PIHAK wajib menjaga kerahasiaan seluruh data, aset, dan informasi teknis proyek ini dari pihak ketiga.</p>
          <h2 className="mt-7 font-sans text-sm font-bold">PASAL 3: KETENTUAN SERAH TERIMA</h2><p className="mt-2 pl-6">Pekerjaan dinyatakan selesai setelah PIHAK PERTAMA menyetujui hasil akhir dan menandatangani tanda terima pekerjaan.</p>
        </article>
      </section>
      <aside className="flex min-h-[440px] flex-col bg-white p-5"><div className="flex gap-2 border-b border-slate-200 pb-3"><button className="text-[10px] text-slate-500">Percakapan</button><button className="rounded bg-slate-100 px-3 py-2 text-[10px] font-bold">Diskusi</button></div><div className="mt-5 grid gap-4">{messages.map((item,index)=><article key={`${item}-${index}`} className="grid grid-cols-[30px_1fr] gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#edf2ff] text-[9px] font-bold text-klarisa-secondary">{index===0?"JS":"AN"}</span><span><b className="text-[11px]">{index===0?"Joko Sam":"Anda"}</b><small className="mt-1 block text-[10px] leading-5 text-slate-600">{item}</small></span></article>)}</div><div className="mt-auto rounded-lg bg-slate-100 p-4"><textarea value={message} onChange={event=>setMessage(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendMessage();}}} placeholder="Tanyakan sesuatu, @ untuk menandai..." className="min-h-20 w-full resize-none bg-transparent text-xs outline-none"/><button type="button" onClick={sendMessage} aria-label="Kirim komentar" className="ml-auto grid size-9 place-items-center rounded-full bg-[#172031] text-white"><Send className="size-4"/></button></div></aside>
    </div>
  </div>;
}
