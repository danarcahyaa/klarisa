"use client";

import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { AIChatBoxRef } from "@/components/ai-chat-box";
import { streamDraftFromApiAction } from "@/app/actions/stream-draft-chat.action";
import {
  generateContractDraftAction,
  saveDraftChatAction,
} from "@/app/actions/draft.action";
import {
  extractAiResponseText,
  processExtractClauseAndMatchRegulations,
  upsertAiChatMessage,
} from "@/lib/gemini/chat-ai.utils";
import { formatLimitationErrorMessage, isLimitationError, truncateWords } from "@/lib/utils";
import type {
  ChatMessageItem,
  ChatStatusStep,
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
  handleStopInitialChat,
  onGenerated,
}: UseInteractionChatOptions): UseInteractionChatReturn {
  const chatBoxRef = useRef<AIChatBoxRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stops the ongoing AI response generation, whether in initial chat or ongoing interaction.
   */
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    handleStopInitialChat?.();
    setIsLoading(false);
    setStreamingAiId(null);
  }, [handleStopInitialChat, setIsLoading, setStreamingAiId]);

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

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const aiMessageId = crypto.randomUUID();
    const currentTitle = firstChatTitle || truncateWords(trimmed, 7);

    try {
      setPrompt("");

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
        signal: controller.signal,
        onChunk: (_textDelta, fullText) => {
          setStreamingAiId(aiMessageId);
          setMessages((prev) =>
            upsertAiChatMessage(prev, aiMessageId, fullText, {
              isShimmer: false,
              date: "",
            })
          );
        },
        onInteractionId: (newId: string) => {
          setInteractionId(newId);
        },
      });

      if (!res.success || !res.data) {
        if (controller.signal.aborted) {
          return;
        }
        throw new Error(res.error ?? "Gagal memproses respons AI.");
      }

      if (res.data.interactionId) {
        setInteractionId(res.data.interactionId);
      }

      let aiText = extractAiResponseText(res.data);
      let aiMetadata: Record<string, unknown> | null = null;

      let settledSteps: ChatStatusStep[] | undefined;

      // If extract_contract_clauses was invoked, first match regulations, then generate draft
      if (!controller.signal.aborted) {
        const matchResult = await processExtractClauseAndMatchRegulations(
          res.data.toolCalls,
          (status) => {
            setStreamingAiId(aiMessageId);
            setMessages((prev) =>
              upsertAiChatMessage(prev, aiMessageId, status.message ?? "", {
                isShimmer: status.isShimmer,
                statusSteps: status.statusSteps,
                date: "",
              })
            );
          },
          controller.signal
        );

        if (matchResult && !controller.signal.aborted) {
          settledSteps = matchResult.statusSteps;

          // Display shimmer for contract drafting underneath settled regulations
          setStreamingAiId(aiMessageId);
          setMessages((prev) =>
            upsertAiChatMessage(prev, aiMessageId, "", {
              isShimmer: true,
              statusSteps: [
                ...matchResult.statusSteps,
                { text: "Menyusun draf kontrak...", isShimmer: true },
              ],
              date: "",
            })
          );

          const contractResult = await generateContractDraftAction({
            userPrompt: trimmed,
            contractType: matchResult.contractType,
            matchedArticles: matchResult.matchedArticles,
          });

          if (!controller.signal.aborted) {
            if (contractResult.success && contractResult.data) {
              const { contractId, title } = contractResult.data;
              aiText = `Draf **${title}** telah berhasil disusun dan diselaraskan dengan regulasi hukum yang relevan. Anda dapat membuka, meninjau, dan menyunting draf lengkap pada editor melalui tautan di bawah ini.`;
              aiMetadata = {
                draft_id: contractId,
                draft_title: title,
              };
            } else {
              aiText =
                "Regulasi yang relevan telah ditemukan, namun terjadi kendala saat menyusun draf kontrak secara otomatis. Silakan coba kirimkan kembali instruksi Anda.";
            }
          }
        }
      }

      if (aiText) {
        setMessages((prev) =>
          upsertAiChatMessage(prev, aiMessageId, aiText, {
            isShimmer: false,
            statusSteps: settledSteps,
            date: new Date().toISOString(),
            metadata: aiMetadata,
          })
        );
      } 
      if (controller.signal.aborted) {
        setMessages((prev) =>
          upsertAiChatMessage(prev, aiMessageId, "Respons dihentikan.", {
            isShimmer: false,
            date: new Date().toISOString(),
          })
        );
      }

      onGenerated?.(res.data);

      // AI response generation completed: flush loading state synchronously
      // to the DOM BEFORE the Server Action is queued. Without flushSync,
      // Next.js Server Action dispatch can batch/defer this update until the
      // action resolves, causing the button to appear stuck in Pause state.
      console.log("[useInteractionChat] All generation finished. Synchronously setting isLoading=false, streamingAiId=null");
      flushSync(() => {
        setIsLoading(false);
        setStreamingAiId(null);
      });
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      const conversationMetadata = {
        ...(res.data.toolCalls ? { toolCalls: res.data.toolCalls } : {}),
        ...(aiMetadata ? aiMetadata : {}),
        ...(settledSteps ? { statusSteps: settledSteps } : {}),
      };

      // Save follow-up message to database in background without blocking UI
      void saveDraftChatAction({
        question: trimmed,
        answer: aiText || "Respons dihentikan.",
        chatId,
        title: currentTitle,
        lastInteractionId: res.data.interactionId ?? null,
        metadata: Object.keys(conversationMetadata).length > 0 ? conversationMetadata : null,
      }).then((saveRes) => {
        if (saveRes.success && saveRes.data?.chat_id && !chatId) {
          const newChatId = saveRes.data.chat_id;
          setChatId(newChatId);

          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("chat_id", newChatId);
            window.history.replaceState(null, "", url.toString());
          }
        }
      }).catch((saveErr) => {
        console.error("[useInteractionChat] Failed to save chat in background:", saveErr);
      });
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const rawErrorMsg =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga saat memproses pesan.";
      console.error("[useInteractionChat] Error during chat processing:", rawErrorMsg);
      const isLimit = isLimitationError(rawErrorMsg);
      const errorMsg = isLimit
        ? formatLimitationErrorMessage(rawErrorMsg)
        : rawErrorMsg;
      setError(errorMsg);
      setMessages((prev) => upsertAiChatMessage(prev, aiMessageId, errorMsg));

      // Persist follow-up conversation with limitation error to the database in background
      if (isLimit) {
        void saveDraftChatAction({
          question: trimmed,
          answer: errorMsg,
          chatId,
          title: currentTitle,
          lastInteractionId: null,
          metadata: { error: errorMsg, error_type: "limitation" },
        }).catch((saveErr) => {
          console.error("[useInteractionChat] Failed to save limitation error chat in background:", saveErr);
        });
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      console.log("[useInteractionChat] finally block executed -> setting isLoading=false");
      flushSync(() => {
        setIsLoading(false);
        setStreamingAiId(null);
      });
    }
  };

  return {
    chatBoxRef,
    messagesEndRef,
    handleSend,
    handleStop,
    handleSelectTemplate,
  };
}
