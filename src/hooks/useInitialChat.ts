"use client";

import { useCallback } from "react";
import { streamDraftFromApiAction } from "@/app/actions/stream-draft-chat.action";
import { saveDraftChatAction } from "@/app/actions/draft.action";
import { extractAiResponseText } from "@/lib/gemini/chat-ai.utils";
import { truncateWords } from "@/lib/utils";
import type {
  ChatMessageItem,
  UseInitialChatOptions,
  UseInitialChatReturn,
} from "@/types/draft.type";

export type { UseInitialChatOptions, UseInitialChatReturn };

/**
 * Custom React hook for handling the initial chat turn of a new draft chat thread.
 * Streams the AI response, persists the new thread to the database atomically,
 * and synchronizes the created chat_id with URL query parameters.
 */
export function useInitialChat({
  prompt,
  setPrompt,
  setMessages,
  setChatId,
  setFirstChatTitle,
  setInteractionId,
  isLoading,
  setIsLoading,
  setError,
  setStreamingAiId,
  onGenerated,
}: UseInitialChatOptions): UseInitialChatReturn {
  /**
   * Initial chat handler when starting a new draft chat thread.
   */
  const handleInitialChat = useCallback(
    async (text?: string): Promise<void> => {
      const promptToSend = (text ?? prompt).trim();
      if (!promptToSend || isLoading) return;

      const aiMessageId = crypto.randomUUID();

      try {
        // Clear input text
        setPrompt("");

        // Derive title from prompt (maximum 7 words)
        const initialTitle = truncateWords(promptToSend, 7);
        setFirstChatTitle(initialTitle);

        // Show user prompt immediately in the message list
        const userMessage: ChatMessageItem = {
          id: crypto.randomUUID(),
          role: "user",
          content: promptToSend,
          date: new Date().toISOString(),
        };
        setMessages([userMessage]);

        setIsLoading(true);
        setError(null);
        const res = await streamDraftFromApiAction({
          prompt: promptToSend,
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

        // Save new chat thread to database atomically
        const saveRes = await saveDraftChatAction({
          question: promptToSend,
          answer: aiText || "Draf kontrak berhasil diproses.",
          chatId: null, // Initial chat creation
          title: initialTitle,
          lastInteractionId: res.data.interactionId ?? null,
          metadata: res.data.toolCalls ? { toolCalls: res.data.toolCalls } : null,
        });

        if (saveRes.success && saveRes.data?.chat_id) {
          const newChatId = saveRes.data.chat_id;
          setChatId(newChatId);

          // Update URL query parameter to chat_id
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
    },
    [prompt, isLoading, onGenerated, setPrompt, setFirstChatTitle, setMessages, setIsLoading, setError, setStreamingAiId, setInteractionId, setChatId]
  );

  return {
    handleInitialChat,
  };
}
