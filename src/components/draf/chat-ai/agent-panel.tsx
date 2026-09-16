"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Editor } from "@tiptap/react";
import ReactMarkdown from "react-markdown";
import { 
  X, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowDownToLine, 
  FileText, 
  Scale, 
  ShieldCheck, 
  Wand2 
} from "lucide-react";
import { toast } from "sonner";
import { ChatAiTextbox } from "@/components/ui/chat-ai-textbox";
import { streamDraftFromApiAction } from "@/app/actions/stream-draft-chat.action";
import { cn } from "@/lib/utils";
import AIChatBox from "@/components/ai-chat-box";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AgentProps {
  /** Optional Tiptap editor instance to allow inserting content */
  editor?: Editor | null;
  /** Callback triggered when user closes the Agent sidebar */
  onClose?: () => void;
  /** Additional container styling */
  className?: string;
}


export function AgentPanel({ editor, onClose, className }: AgentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleCopy = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Teks disalin ke papan klip");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Gagal menyalin teks");
    }
  }, []);

  const handleInsertToEditor = useCallback((content: string) => {
    if (!editor) {
      toast.error("Editor tidak tersedia untuk menyisipkan teks.");
      return;
    }

    try {
      // Focus the editor and insert text/html at cursor position
      editor.chain().focus().insertContent(content).run();
      toast.success("Teks berhasil disisipkan ke dokumen!");
    } catch (err) {
      console.error("Failed to insert text into editor:", err);
      toast.error("Gagal menyisipkan teks ke editor.");
    }
  }, [editor]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    toast.info("Respons AI dihentikan.");
  }, []);

  const handleSend = useCallback(async (promptText?: string) => {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || isSending) return;

    setInput("");

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `ai-${Date.now() + 1}`;

    const userMsg: AgentMessage = {
      id: userMessageId,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    const assistantMsg: AgentMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await streamDraftFromApiAction({
        prompt: textToSend,
        signal: controller.signal,
        onChunk: (_delta, accumulated) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: accumulated } : msg
            )
          );
        },
      });

      if (!response.success && response.error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    `Maaf, terjadi kendala saat memproses permintaan: ${response.error}`,
                }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        const errorText =
          err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    `Gagal mendapatkan respons dari AI: ${errorText}`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [input, isSending]);

  const handleResetChat = useCallback(() => {
    if (isSending) handleStop();
    setMessages([]);
    toast.success("Riwayat obrolan AI telah dibersihkan.");
  }, [isSending, handleStop]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden h-full max-h-full bg-transparent",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleResetChat}
              title="Bersihkan Percakapan"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages / Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-xs flex flex-col">
        {messages.length === 0 ? (
          <div className="h-full flex-1 flex flex-col justify-center items-center text-center px-2 py-4">
            <div className="flex items-start justify-center gap-2">
              <Image src="/klarisa/logo-ai.svg" alt="Klarisa AI" width={17} height={17} />
              <h3 className="font-semibold font-heading text-slate-800 text-lg mb-1">
                Klarisa
              </h3>
            </div>
            
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mb-5">
              Tanyakan saran penulisan klausul atau lengkapi draf kontrak Anda.
            </p>

            <div className="w-full max-w-[340px]">
              <AIChatBox
                variant="small"
                isLoading={isSending}
                onSend={handleSend}
                onStop={handleStop}
                value={input}
                onChange={(e) => setInput(e)}
                placeholder="Ketik sesuatu..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1.5",
                    isUser ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-3.5 py-2.5 max-w-[90%] transition-all",
                      isUser
                        ? "bg-primary text-primary-foreground font-normal rounded-br-none shadow-xs"
                        : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none shadow-xs w-full"
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {message.content ? (
                          <div className="prose prose-xs max-w-none text-slate-800 [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 py-1 text-slate-400">
                            <span className="size-1.5 rounded-full bg-primary animate-ping" />
                            <span className="text-[11px] italic">Sedang menyusun respons...</span>
                          </div>
                        )}

                        {/* Action buttons on assistant message */}
                        {isAssistant && message.content && (
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopy(message.id, message.content)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/70 text-slate-600 transition-colors cursor-pointer"
                                title="Salin teks"
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check className="size-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-medium">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {editor && (
                              <button
                                type="button"
                                onClick={() => handleInsertToEditor(message.content)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-700 transition-colors font-medium cursor-pointer"
                                title="Sisipkan teks ini ke posisi kursor di dokumen"
                              >
                                <ArrowDownToLine className="size-3" />
                                <span>Sisipkan ke Dokumen</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}