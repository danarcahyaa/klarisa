"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { streamDraftAgentAction } from "@/app/actions/stream-draft-agent.action";
import { saveDraftChatAction } from "@/app/actions/draft.action";
import {
  extractAiResponseText,
  extractToolCallText,
  upsertAiChatMessage,
} from "@/lib/gemini/chat-ai.utils";
import type {
  UseChatResponseOptions,
  UseChatResponseReturn,
  StreamChatResponseParams,
} from "@/types/agent-contract.type";

export type { UseChatResponseOptions, UseChatResponseReturn, StreamChatResponseParams };

/**
 * Custom hook dedicated to handling AI chat responses:
 * - Manages AI response streaming lifecycle (`isSending`, `streamingAiId`).
 * - Tracks multi-turn conversational interactionId and chatId.
 * - Handles AbortController and response stopping.
 * - Updates chat message history via `upsertAiChatMessage` on stream chunks, tool calls, and errors.
 * - Flushes DOM synchronously when generation completes to immediately disable send button.
 * - Persists completed conversations to Supabase in the background.
 */
export function useChatResponse({
  setMessages,
  initialChatId,
}: UseChatResponseOptions): UseChatResponseReturn {
  const [isSending, setIsSending] = useState(false);
  const [streamingAiId, setStreamingAiId] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort ongoing response if hook unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Aborts the ongoing AI streaming response.
   */
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    flushSync(() => {
      setIsSending(false);
      setStreamingAiId(null);
    });
    toast.info("Respons dihentikan.");
  }, []);

  /**
   * Dispatches and streams an AI response, updating the message list as chunks arrive,
   * immediately disables the button upon generation complete, and saves conversation to Supabase.
   */
  const streamResponse = useCallback(
    async ({ prompt, selectedText, highlightId, title }: StreamChatResponseParams) => {
      const assistantMessageId = `ai-${Date.now()}`;

      setIsSending(true);
      setStreamingAiId(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await streamDraftAgentAction({
          prompt,
          selectedText,
          highlightId,
          interactionId,
          signal: controller.signal,
          onChunk: (_delta, accumulated) => {
            setStreamingAiId(assistantMessageId);
            setMessages((prev) =>
              upsertAiChatMessage(prev, assistantMessageId, accumulated, {
                date: new Date().toISOString(),
                statusSteps: undefined,
                isShimmer: false,
              })
            );
          },
          onToolCall: (toolCall) => {
            const toolText = extractToolCallText(toolCall);
            if (toolText) {
              setStreamingAiId(assistantMessageId);
              setMessages((prev) =>
                upsertAiChatMessage(prev, assistantMessageId, toolText, {
                  date: new Date().toISOString(),
                  isShimmer: false,
                })
              );
            }
          },
          onInteractionId: (id) => {
            setInteractionId(id);
          },
        });

        let finalContent = "";
        if (!response.success && response.error) {
          finalContent = response.error;
          setMessages((prev) =>
            upsertAiChatMessage(
              prev,
              assistantMessageId,
              response.error!,
              {
                date: new Date().toISOString(),
                isShimmer: false,
              }
            )
          );
        } else if (response.data) {
          finalContent = extractAiResponseText(response.data);
          if (finalContent) {
            setMessages((prev) =>
              upsertAiChatMessage(prev, assistantMessageId, finalContent, {
                date: new Date().toISOString(),
                isShimmer: false,
              })
            );
          }
        }

        // AI response generation completed: flush loading state synchronously
        // to the DOM BEFORE triggering background database persistence.
        // This ensures the button immediately switches to disabled state (since input is empty).
        flushSync(() => {
          setIsSending(false);
          setStreamingAiId(null);
        });
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        // Save conversation to Supabase in the background without blocking the UI
        if (!controller.signal.aborted && finalContent) {
          const conversationMetadata = {
            ...(response.data?.toolCalls ? { toolCalls: response.data.toolCalls } : {}),
            ...(selectedText ? { selectedText, highlightId } : {}),
          };

          const fullQuestion = selectedText
            ? `> "${selectedText}"\n\n${prompt}`
            : prompt;

          void saveDraftChatAction({
            question: fullQuestion,
            answer: finalContent,
            chatId,
            title: title ?? null,
            lastInteractionId: response.data?.interactionId ?? interactionId ?? null,
            metadata: Object.keys(conversationMetadata).length > 0 ? conversationMetadata : null,
          })
            .then((saveRes) => {
              if (saveRes.success && saveRes.data?.chat_id && !chatId) {
                setChatId(saveRes.data.chat_id);
              }
            })
            .catch((saveErr) => {
              console.error("[useChatResponse] Failed to save conversation in background:", saveErr);
            });
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const errorText =
            err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi nanti";
          setMessages((prev) =>
            upsertAiChatMessage(
              prev,
              assistantMessageId,
              errorText,
              {
                date: new Date().toISOString(),
                isShimmer: false,
              }
            )
          );
        }
      } finally {
        setIsSending(false);
        setStreamingAiId(null);
        abortControllerRef.current = null;
      }
    },
    [interactionId, chatId, setMessages]
  );

  return {
    isSending,
    streamingAiId,
    interactionId,
    chatId,
    setChatId,
    handleStop,
    streamResponse,
  };
}
