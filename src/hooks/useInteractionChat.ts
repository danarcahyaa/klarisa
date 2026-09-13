"use client";

import { useEffect, useRef } from "react";
import type { AIChatBoxRef } from "@/components/ai-chat-box";
import { streamDraftFromApiAction } from "@/app/actions/stream-draft-chat.action";
import { saveDraftChatAction } from "@/app/actions/draft.action";
import { extractAiResponseText } from "@/lib/gemini/chat-ai.utils";
import { truncateWords } from "@/lib/utils";
import type {
  ChatMessageItem,
  UseInteractionChatOptions,
  UseInteractionChatReturn,
} from "@/types/draft.type";

export type { UseInteractionChatOptions, UseInteractionChatReturn };

/**
 * Custom React hook for managing ongoing AI chat interactions:
 * streaming message responses, auto-scrolling, and template selection.
 */
export function useInteractionChat({
  setPrompt,
  messages,
  setMessages,
  chatId,
  setChatId,
  firstChatTitle,
  setFirstChatTitle,
  interactionId,
  setInteractionId,
  isLoading,
  setIsLoading,
  setError,
  setStreamingAiId,
  handleInitialChat,
  onGenerated,
}: UseInteractionChatOptions): UseInteractionChatReturn {
  const chatBoxRef = useRef<AIChatBoxRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastMessageRef = useRef<{ id: string; content: string } | null>(null);
  const prevChatIdRef = useRef<string | null>(chatId);
  const hasInitiallyScrolledRef = useRef<boolean>(false);

  // Reset initial scroll tracker if active chat session changes
  useEffect(() => {
    if (chatId !== prevChatIdRef.current) {
      prevChatIdRef.current = chatId;
      hasInitiallyScrolledRef.current = false;
      lastMessageRef.current = null;
    }
  }, [chatId]);

  // Auto-scroll to bottom only on initial load, when new messages are added at the bottom, or during AI streaming
  useEffect(() => {
    if (messages.length === 0) {
      lastMessageRef.current = null;
      return;
    }

    const currentLastMessage = messages[messages.length - 1];
    const prevLast = lastMessageRef.current;

    // Check if initial scroll hasn't occurred yet for this chat thread
    if (!hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true;
      lastMessageRef.current = { id: currentLastMessage.id, content: currentLastMessage.content };
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      return;
    }

    const isNewBottomMessage =
      !prevLast ||
      prevLast.id !== currentLastMessage.id ||
      prevLast.content !== currentLastMessage.content;

    lastMessageRef.current = { id: currentLastMessage.id, content: currentLastMessage.content };

    // Only scroll to bottom if there is a new message appended or updated at the bottom, or when actively waiting for AI
    if (isNewBottomMessage || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSelectTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    chatBoxRef.current?.focus();
  };

  /**
   * Primary send handler: delegates to handleInitialChat if thread is new,
   * otherwise appends to the active chat session.
   */
  const handleSend = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // If chat does not exist yet, trigger initial chat creation
    if (!chatId && messages.length === 0) {
      await handleInitialChat(trimmed);
      return;
    }

    const aiMessageId = crypto.randomUUID();

    try {
      setPrompt("");

      const currentTitle = firstChatTitle || truncateWords(trimmed, 7);
      if (!firstChatTitle) {
        setFirstChatTitle(currentTitle);
      }

      const userMessage: ChatMessageItem = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        date: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsLoading(true);
      setError(null);
      const res = await streamDraftFromApiAction({
        prompt: trimmed,
        interactionId: interactionId ?? undefined,
        onChunk: (_textDelta, fullText) => {
          setStreamingAiId(aiMessageId);
          setMessages((prev) => {
            const existingIndex = prev.findIndex((m) => m.id === aiMessageId);
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], content: fullText };
              return updated;
            }
            return [
              ...prev,
              {
                id: aiMessageId,
                role: "ai",
                content: fullText,
                date: new Date().toISOString(),
              },
            ];
          });
        },
        onInteractionId: (newId: string) => {
          setInteractionId(newId);
        },
      });

      if (!res.success || !res.data) {
        throw new Error(res.error ?? "Gagal memproses respons AI.");
      }

      if (res.data.interactionId) {
        setInteractionId(res.data.interactionId);
      }

      const aiText = extractAiResponseText(res.data);
      if (aiText) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex((m) => m.id === aiMessageId);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], content: aiText };
            return updated;
          }
          return [
            ...prev,
            {
              id: aiMessageId,
              role: "ai",
              content: aiText,
              date: new Date().toISOString(),
            },
          ];
        });
      }

      // Save follow-up message to database atomically
      const saveRes = await saveDraftChatAction({
        question: trimmed,
        answer: aiText || "Draf kontrak berhasil diproses.",
        chatId,
        title: currentTitle,
        lastInteractionId: res.data.interactionId ?? null,
        metadata: res.data.toolCalls ? { toolCalls: res.data.toolCalls } : null,
      });

      if (saveRes.success && saveRes.data?.chat_id && !chatId) {
        const newChatId = saveRes.data.chat_id;
        setChatId(newChatId);

        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("chat_id", newChatId);
          url.searchParams.delete("id");
          window.history.replaceState(null, "", url.toString());
        }
      }

      onGenerated?.(res.data);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga saat memproses pesan.";
      setError(errorMsg);
      setMessages((prev) => {
        const existingIndex = prev.findIndex((m) => m.id === aiMessageId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], content: errorMsg };
          return updated;
        }
        return [
          ...prev,
          {
            id: aiMessageId,
            role: "ai",
            content: errorMsg,
            date: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
      setStreamingAiId(null);
    }
  };

  return {
    chatBoxRef,
    messagesEndRef,
    handleSend,
    handleSelectTemplate,
  };
}
