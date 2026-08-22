"use client"

import { MessageCircle, Send, X } from "lucide-react"
import { useState } from "react"

export function HomeChatbot() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="landing-chatbot">
      {isOpen && (
        <section className="landing-chat-panel" aria-label="Bantuan Klarisa">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div><p className="landing-eyebrow">BANTUAN KLARISA</p><h2 className="mt-1 text-base font-semibold">Ada yang ingin ditanyakan?</h2></div>
            <button className="landing-chat-close" type="button" onClick={() => setIsOpen(false)} aria-label="Tutup bantuan"><X /></button>
          </div>
          <div className="space-y-3 p-5 text-sm leading-6 text-slate-600">
            <p className="rounded-md bg-slate-100 p-3">Saya bisa membantu menjelaskan cara review kontrak dan arti istilah yang muncul.</p>
            <button className="landing-chat-suggestion" type="button">Bagaimana cara memulai review?</button>
            <button className="landing-chat-suggestion" type="button">Apa yang diperiksa Klarisa?</button>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-200 p-3"><span className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-400">Tulis pertanyaan Anda...</span><span className="grid size-8 place-items-center rounded-full bg-slate-900 text-white"><Send className="size-3.5" /></span></div>
        </section>
      )}
      <button className="landing-chat-trigger" type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-label="Buka bantuan Klarisa"><MessageCircle /><span>Bantuan</span></button>
    </div>
  )
}
