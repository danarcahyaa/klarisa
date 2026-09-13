"use client";

import Image from "next/image";
import { Sparkles, Bot, User, MessageSquarePlus } from "lucide-react";
import type { AiMessage } from "@/types/draft-editor.type";

export interface AIAssistantTabProps {
  aiMessages: AiMessage[];
  onSelectPrompt?: (prompt: string) => void;
}


/**
 * AI Assistant tab component for Klarisa AI chat and prompts.
 */
export function AIAssistantTab({
  aiMessages,
  onSelectPrompt,
}: AIAssistantTabProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
      
      {/* Conversation Thread */}
      <div className="flex-1 space-y-3 pt-1 item-center justify-center">
        {aiMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-2">
              <Bot className="size-5" />
            </div>
            <p className="text-xs font-medium text-slate-600">Belum ada percakapan</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Ketik pertanyaan di bawah untuk mulai berdiskusi dengan Klarisa AI.
            </p>
          </div>
        ) : (
          aiMessages.map((item, index) => (
            <article
              key={`${item.role}-${index}`}
              className={`flex gap-2.5 ${
                item.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  item.role === "user"
                    ? "bg-slate-700 text-white"
                    : "bg-blue-100 border border-blue-200 text-blue-700"
                }`}
              >
                {item.role === "user" ? (
                  <User className="size-3.5" />
                ) : (
                  <Image
                    src="/klarisa/logo-ai.svg"
                    alt="AI"
                    width={18}
                    height={18}
                    className="size-4 object-contain"
                  />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  item.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-xs"
                    : "bg-white border border-slate-200 text-slate-700 shadow-xs rounded-tl-xs"
                }`}
              >
                <div className="font-semibold text-[10px] mb-1 opacity-75">
                  {item.role === "user" ? "Anda" : "Klarisa AI"}
                </div>
                <div className="whitespace-pre-wrap text-[11px]">{item.body}</div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
