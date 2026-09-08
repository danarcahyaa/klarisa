"use client";

import Image from "next/image";
import type { AiMessage } from "@/types/draft-editor.type";

export interface ConversationTabProps {
  aiMessages: AiMessage[];
}

/**
 * AI conversation tab in draft editor sidebar showing assistant responses and prompt status.
 */
export function ConversationTab({ aiMessages }: ConversationTabProps) {
  return (
    <>
      <div className="mt-5 rounded-lg border border-blue-100 bg-[#f7f9ff] p-4">
        <div className="flex items-center gap-2">
          <Image
            src="/klarisa/logo-ai.svg"
            alt="Klarisa AI"
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <b className="text-xs font-semibold">Klarisa AI</b>
          <Image
            src="/klarisa/ai.png"
            alt=""
            aria-hidden
            width={13}
            height={13}
            className="ml-auto size-3.5 object-contain"
          />
        </div>
        <p className="mt-3 text-[10px] leading-4 text-slate-500">
          Tanyakan isi draft atau minta bantuan memperjelas kalimat yang Anda
          pilih.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        {aiMessages.map((item, index) => (
          <article
            key={`${item.role}-${index}`}
            className={`grid gap-3 ${
              item.role === "user"
                ? "grid-cols-[1fr_30px]"
                : "grid-cols-[30px_1fr]"
            }`}
          >
            <span
              className={`grid size-8 place-items-center rounded-full ${
                item.role === "user"
                  ? "order-2 bg-slate-100 text-xs font-bold text-slate-600"
                  : "bg-[#edf2ff]"
              }`}
            >
              {item.role === "assistant" ? (
                <Image
                  src="/klarisa/logo-ai.svg"
                  alt="Klarisa AI"
                  width={22}
                  height={22}
                  className="size-5 object-contain"
                />
              ) : (
                "AN"
              )}
            </span>
            <span className={item.role === "user" ? "text-right" : ""}>
              <b className="text-xs font-semibold">
                {item.role === "assistant" ? "Klarisa AI" : "Anda"}
              </b>
              <small className="mt-1 block text-xs leading-5 text-slate-600">
                {item.body}
              </small>
            </span>
          </article>
        ))}
      </div>
    </>
  );
}
