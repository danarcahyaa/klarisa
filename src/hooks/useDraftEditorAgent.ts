"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useChatResponse } from "@/hooks/useChatResponse";
import { truncateWords } from "@/lib/utils";
import { getChatDetailAction } from "@/app/actions/chat.action";
import {
  CHAT_EVENTS,
  type ChatDeletedEventDetail,
  type ChatUpdatedEventDetail,
} from "@/lib/chat-events";
import type {
  AgentChatMessage,
  UseDraftEditorAgentOptions,
  UseDraftEditorAgentReturn,
} from "@/types/agent-contract.type";

export type { UseDraftEditorAgentOptions, UseDraftEditorAgentReturn };

/**
 * Custom hook encapsulating Draft Editor Agent interactions:
 * - Exclusively handles sending and stopping chats.
 * - Manages message list state (`messages`, `input`) and session title.
 * - Supports starting a new conversation thread (`handleNewChat`).
 * - Supports loading selected chat thread (`handleSelectChat`).
 * - Listens for chat deletion events to reset to empty state if the active chat was deleted.
 * - Delegates AI response streaming lifecycle to `useChatResponse`.
 */
export function useDraftEditorAgent({
  selectedText,
  highlightId,
  initialChatId,
}: UseDraftEditorAgentOptions): UseDraftEditorAgentReturn {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("Draf Kontrak");
  const [isLoadingChat, setIsLoadingChat] = useState(() => Boolean(initialChatId));
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isSending,
    streamingAiId,
    chatId,
    setChatId,
    handleStop,
    streamResponse,
  } = useChatResponse({ setMessages, initialChatId });

  const chatIdRef = useRef<string | null>(chatId);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Auto-scroll to bottom of conversation on messages or status update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleNewChat = useCallback(() => {
    handleStop();
    setIsLoadingChat(false);
    setMessages([]);
    setInput("");
    setChatTitle("Draf Kontrak");
    setChatId(null);
  }, [handleStop, setChatId]);

  // Listen for chat deletion events (e.g. from sidebar recent chats).
  // If the currently loaded chat is deleted, reset the agent to a clean new chat (empty state).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChatDeleted = (event: Event) => {
      const { chatId: deletedChatId } = (
        event as CustomEvent<ChatDeletedEventDetail>
      ).detail;
      if (deletedChatId && deletedChatId === chatIdRef.current) {
        handleNewChat();
      }
    };

    const handleChatUpdated = (event: Event) => {
      const { chatId: updatedChatId, title } = (
        event as CustomEvent<ChatUpdatedEventDetail>
      ).detail;
      if (updatedChatId && updatedChatId === chatIdRef.current) {
        setChatTitle(title);
      }
    };

    window.addEventListener(CHAT_EVENTS.DELETED, handleChatDeleted);
    window.addEventListener(CHAT_EVENTS.UPDATED, handleChatUpdated);

    return () => {
      window.removeEventListener(CHAT_EVENTS.DELETED, handleChatDeleted);
      window.removeEventListener(CHAT_EVENTS.UPDATED, handleChatUpdated);
    };
  }, [handleNewChat]);

  const handleSelectChat = useCallback(
    async (selectedChatId: string) => {
      if (!selectedChatId) return;
      const previousMessages = messages;
      try {
        setIsLoadingChat(true);

        // Fetch detail and enforce a minimum 400ms duration so skeleton animation is clearly visible
        const [res] = await Promise.all([
          getChatDetailAction(selectedChatId),
          new Promise((resolve) => setTimeout(resolve, 400)),
        ]);

        if (!res.success || !res.data) {
          toast.error(res.error ?? "Gagal memuat detail percakapan.");
          setMessages(previousMessages);
          return;
        }

        const chatData = res.data;
        setChatId(chatData.id);
        if (chatData.title) {
          setChatTitle(chatData.title);
        }

        const rawConversations =
          chatData.chat_conversations ||
          (chatData as unknown as { conversations?: typeof chatData.chat_conversations }).conversations ||
          [];

        if (Array.isArray(rawConversations) && rawConversations.length > 0) {
          const loadedMessages: AgentChatMessage[] = [];
          for (const conv of rawConversations) {
            if (conv.question) {
              loadedMessages.push({
                id: `q-${conv.id}`,
                role: "user",
                content: conv.question,
                date: conv.created_at || new Date().toISOString(),
              });
            }
            if (conv.answer) {
              loadedMessages.push({
                id: `a-${conv.id}`,
                role: "ai",
                content: conv.answer,
                date: conv.created_at || new Date().toISOString(),
                metadata: (conv.metadata as Record<string, unknown>) ?? null,
              });
            }
          }
          setMessages(loadedMessages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("[useDraftEditorAgent] Failed to load chat detail:", err);
        toast.error("Terjadi kesalahan saat memuat percakapan.");
        setMessages(previousMessages);
      } finally {
        setIsLoadingChat(false);
      }
    },
    [messages, setChatId]
  );

  /**
   * Sends user prompt and optional active text selection to the LLM agent stream.
   */
  const handleSend = useCallback(
    async (promptText?: string) => {
      const rawInput = (promptText ?? input).trim();
      if (!rawInput || isSending) return;

      setInput("");

      // Derive title from first user query if still using default
      const derivedTitle =
        messages.length === 0 ? truncateWords(rawInput, 7) : chatTitle;
      if (messages.length === 0) {
        setChatTitle(derivedTitle);
      }

      const userDisplayContent = selectedText
        ? `> "${selectedText}"\n\n${rawInput}`
        : rawInput;

      const userMessageId = `user-${Date.now()}`;
      const userMsg: AgentChatMessage = {
        id: userMessageId,
        role: "user",
        content: userDisplayContent,
        date: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      await streamResponse({
        prompt: rawInput,
        selectedText,
        highlightId,
        title: derivedTitle,
      });
    },
    [input, isSending, messages.length, chatTitle, selectedText, highlightId, streamResponse]
  );

  return {
    messages,
    input,
    setInput,
    isSending,
    isLoadingChat,
    streamingAiId,
    chatId,
    chatTitle,
    setChatTitle,
    messagesEndRef,
    handleStop,
    handleSend,
    handleNewChat,
    handleSelectChat,
  };
}