"use client"

import { MessageCircle, Send, X } from "lucide-react"
import { FormEvent, useState } from "react"

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
    <div className="landing-chatbot">
      {isOpen && (
        <section className="landing-chat-panel" aria-label="Bantuan Klarisa">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div><p className="landing-eyebrow">BANTUAN KLARISA</p><h2 className="mt-1 text-base font-semibold">Ada yang ingin ditanyakan?</h2></div>
            <button className="landing-chat-close" type="button" onClick={() => setIsOpen(false)} aria-label="Tutup bantuan"><X /></button>
          </div>
          <div className="landing-chat-messages space-y-3 p-5 text-sm leading-6 text-slate-600">
            <p className="rounded-md bg-slate-100 p-3">Saya bisa membantu menjelaskan cara review kontrak dan arti istilah yang muncul.</p>
            {messages.map((chatMessage, index) => <p className={"landing-chat-message" + (chatMessage.isUser ? " is-user" : "")} key={index}>{chatMessage.text}</p>)}
            <button className="landing-chat-suggestion" type="button" onClick={() => setMessage("Bagaimana cara memulai review?")}>Bagaimana cara memulai review?</button>
            <button className="landing-chat-suggestion" type="button" onClick={() => setMessage("Apa yang diperiksa Klarisa?")}>Apa yang diperiksa Klarisa?</button>
          </div>
          <form className="landing-chat-form" onSubmit={handleSubmit}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tulis pertanyaan Anda..." aria-label="Tulis pertanyaan Anda" /><button type="submit" aria-label="Kirim pesan"><Send /></button></form>
        </section>
      )}
      <button className="landing-chat-trigger" type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-label="Buka bantuan Klarisa"><MessageCircle /><span>Bantuan</span></button>
    </div>
  )
}
