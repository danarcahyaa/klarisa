"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { CopyButton } from "@/components/ui/copy-button";
import { cn, formatIndonesianDate } from "@/lib/utils";

export interface TextChatProps {
  role: "user" | "ai" | "assistant";
  content?: React.ReactNode;
  children?: React.ReactNode;
  date?: string;
  className?: string;
}

/**
 * Text chat message component for displaying user queries and markdown-rendered AI responses
 * using Tailwind CSS typography classes directly.
 */
export function TextChat({
  role,
  content,
  children,
  date,
  className,
}: TextChatProps) {
  const isUser = role === "user";
  const displayContent = content ?? children;
  const textToCopy = typeof displayContent === "string" ? displayContent : "";
  const displayDate = date ? formatIndonesianDate(date) : "";

  return (
    <div
      className={cn(
        "group flex w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className={cn("flex flex-col", isUser ? "max-w-[85%] items-end" : "w-full items-start")}>
        <div
          className={cn(
            "text-sm leading-relaxed",
            isUser
              ? "rounded-lg border border-input bg-white px-4 py-3 text-slate-900 whitespace-pre-wrap"
              : "w-full bg-transparent px-0 text-slate-800 prose prose-sm max-w-none dark:prose-invert dark:text-slate-100 [&_p]:leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_p]:whitespace-pre-line [&_ol]:list-decimal [&_ul]:list-disc"
          )}
        >
          {isUser ? (
            displayContent
          ) : typeof displayContent === "string" ? (
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          ) : (
            displayContent
          )}
        </div>

        {/* Footer: Date and Copy button */}
        <div className="mt-1.5 flex items-center gap-1.5 text-slate-400">
          {isUser ? (
            <>
              {textToCopy && (
                <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <CopyButton valueToCopy={textToCopy} />
                </div>
              )}
              {displayDate && (
                <span className="text-[11px] select-none text-slate-400">
                  {displayDate}
                </span>
              )}
            </>
          ) : (
            <>
              {displayDate && (
                <span className="text-[11px] select-none text-slate-400">
                  {displayDate}
                </span>
              )}
              {textToCopy && (
                <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <CopyButton valueToCopy={textToCopy} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TextChat;
