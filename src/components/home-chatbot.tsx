"use client"

import { MessageCircle, Send, X } from "lucide-react"
import { FormEvent, useState } from "react"
import { Button, SubmitButton } from "@/components/ui/button"

export function HomeChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return
    setMessages((currentMessages) => [
      ...currentMessages,
      { text: trimmedMessage, isUser: true },
      { text: "Terima kasih. Untuk pertanyaan lebih spesifik, mulai dari dokumen yang ingin Anda review.", isUser: false },
    ])
    setMessage("")
  }

  return (
    <div className="fixed right-4 bottom-4 z-60 sm:right-6 sm:bottom-6">
      {isOpen && (
        <section className="absolute right-0 bottom-15 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgb(15_23_42_/_18%)]" aria-label="Bantuan Klarisa">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div><p className="text-[10px] font-bold tracking-[.15em] text-klarisa-secondary">BANTUAN KLARISA</p><h2 className="mt-1 text-base font-semibold">Ada yang ingin ditanyakan?</h2></div>
            <Button variant="ghost" size="icon-xs" type="button" onClick={() => setIsOpen(false)} aria-label="Tutup bantuan"><X className="size-4" /></Button>
          </div>
          <div className="max-h-65 space-y-3 overflow-y-auto p-5 text-sm leading-6 text-slate-600">
            <p className="rounded-md bg-slate-100 p-3">Saya bisa membantu menjelaskan cara review kontrak dan arti istilah yang muncul.</p>
            {messages.map((chatMessage, index) => <p className={"max-w-[90%] rounded-md p-3 text-xs " + (chatMessage.isUser ? "ml-auto bg-indigo-50 text-indigo-900" : "bg-slate-100 text-slate-600")} key={index}>{chatMessage.text}</p>)}
            <Button variant="outline" size="sm" className="w-full justify-start" type="button" onClick={() => setMessage("Bagaimana cara memulai review?")}>Bagaimana cara memulai review?</Button>
            <Button variant="outline" size="sm" className="w-full justify-start" type="button" onClick={() => setMessage("Apa yang diperiksa Klarisa?")}>Apa yang diperiksa Klarisa?</Button>
          </div>
          <form className="flex items-center gap-2 border-t border-slate-200 p-3" onSubmit={handleSubmit}><input className="min-h-10 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs outline-none focus:border-klarisa-secondary focus:ring-3 focus:ring-klarisa-secondary/10" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tulis pertanyaan Anda..." aria-label="Tulis pertanyaan Anda" /><SubmitButton variant="default" size="icon-sm" type="submit" aria-label="Kirim pesan"><Send className="size-3.5" /></SubmitButton></form>
        </section>
      )}
      <Button variant="default" size="default" type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-label="Buka bantuan Klarisa"><MessageCircle className="size-4" /><span>Bantuan</span></Button>
    </div>
  )
}
