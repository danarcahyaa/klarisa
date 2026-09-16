"use client";

import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
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
import { dispatchChatCreated } from "@/lib/chat-events";
import type { ChatRow } from "@/types/chat.type";
import type {
  ChatMessageItem,
  ChatStatusStep,
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
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stops the ongoing initial AI response generation.
   */
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingAiId(null);
  }, [setIsLoading, setStreamingAiId]);

  /**
   * Initial chat handler when starting a new draft chat thread.
   */
  const handleInitialChat = useCallback(
    async (text?: string): Promise<void> => {
      const promptToSend = (text ?? prompt).trim();
      if (!promptToSend || isLoading) return;

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const aiMessageId = crypto.randomUUID();
      const initialTitle = truncateWords(promptToSend, 7);

      try {
        // Clear input text
        setPrompt("");

        // Set derived title
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
          throw new Error(res.error ?? "Gagal memproses respons.");
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
              userPrompt: promptToSend,
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
            upsertAiChatMessage(prev, aiMessageId, "Respon dihentikan.", {
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

        // Save new chat thread to Supabase asynchronously in background without blocking UI
        void saveDraftChatAction({
          question: promptToSend,
          answer: aiText || "Respon dihentikan.",
          chatId: null, // Initial chat creation
          title: initialTitle,
          lastInteractionId: res.data.interactionId ?? null,
          metadata: Object.keys(conversationMetadata).length > 0 ? conversationMetadata : null,
        }).then((saveRes) => {
          if (saveRes.success && saveRes.data?.chat_id) {
            const newChatId = saveRes.data.chat_id;
            setChatId(newChatId);

            // Update URL query parameter to chat_id
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("chat_id", newChatId);
              window.history.replaceState(null, "", url.toString());
            }

            // Dispatch created chat event to update recent chats sidebar immediately after data insertion
            const createdChat: ChatRow = saveRes.data.chat ?? {
              id: newChatId,
              title: initialTitle,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_interaction_id: res?.data?.interactionId ?? null,
              user_id: "",
            };
            dispatchChatCreated(createdChat);
          }
        }).catch((saveErr) => {
          console.error("[useInitialChat] Failed to save chat in background:", saveErr);
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const rawErrorMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga saat memproses pesan.";
        const isLimit = isLimitationError(rawErrorMsg);
        const errorMsg = isLimit
          ? formatLimitationErrorMessage(rawErrorMsg)
          : rawErrorMsg;

        setError(errorMsg);

        // When limitation error occurs on new chat without AI output:
        // Keep view as new chat (empty messages) and show alert above prompt.
        // Do NOT save to database since there is no meaningful AI response to persist.
        if (isLimit) {
          setMessages([]);
          setPrompt(promptToSend);
        } else {
          setMessages((prev) => upsertAiChatMessage(prev, aiMessageId, errorMsg));
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
        setStreamingAiId(null);
      } 
    },
    [prompt, isLoading, onGenerated, setPrompt, setFirstChatTitle, setMessages, setIsLoading, setError, setStreamingAiId, setInteractionId, setChatId]
  );

  return {
    handleInitialChat,
    handleStop,
  };
}
