"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import AIChatBox from "@/components/ai-chat-box";
import { ReusableAlert } from "@/components/ui/reusable-alert";
import { cn } from "@/lib/utils";
import { useInitialChat } from "@/hooks/useInitialChat";
import { useActionChat } from "@/hooks/useActionChat";
import { useInteractionChat } from "@/hooks/useInteractionChat";
import { useScroll } from "@/hooks/useScroll";
import { CHAT_EVENTS, type ChatSelectEventDetail } from "@/lib/chat-events";
import type { ChatMessageItem } from "@/types/draft.type";
import { EmptyStateHeader } from "./empty-state-header";
import { TemplateOptions } from "./template-options";
import { ConversationList } from "./conversation-list";
import { ConversationSkeleton } from "./conversation-skeleton";
import { ChatHeader } from "./chat-header";
import type { GeminiInteraction } from "@/types/llm.type";

/**
 * Props for the ChatAI root component.
 */
export interface ChatAIProps {
  onGenerated?: (data: GeminiInteraction) => void;
  className?: string;
}

/**
 * AI Contract Drafting Chat interface combining Header, ConversationList, AIChatBox, and TemplateOptions.
 */
export function ChatAI({ onGenerated, className }: ChatAIProps = {}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingAiId, setStreamingAiId] = useState<string | null>(null);

  // Initial chat creation hook (handles new thread generation and saving)
  const { handleInitialChat, handleStop: handleStopInitial } = useInitialChat({
    prompt,
    setPrompt,
    messages,
    setMessages,
    chatId,
    setChatId,
    firstChatTitle: title,
    setFirstChatTitle: setTitle,
    interactionId,
    setInteractionId,
    isLoading,
    setIsLoading,
    setError,
    setStreamingAiId,
    onGenerated,
  });

  // Chat action & lifecycle hook (retrieve detail, rename, delete, reset, lazy load conversations)
  const {
    isLoadingChat,
    hasMoreConversations,
    isLoadingMoreConversations,
    handleLoadChatDetail,
    handleLoadMoreConversations,
    reset,
  } = useActionChat({
    setPrompt,
    messages,
    setMessages,
    chatId,
    setChatId,
    setFirstChatTitle: setTitle,
    setInteractionId,
    setIsLoading,
    setError,
    setStreamingAiId,
  });

  // Ongoing interaction hook (send follow-up messages, auto-scroll, select templates)
  const {
    chatBoxRef,
    messagesEndRef,
    handleSend,
    handleStop,
    handleSelectTemplate,
  } = useInteractionChat({
    prompt,
    setPrompt,
    messages,
    setMessages,
    chatId,
    setChatId,
    firstChatTitle: title,
    setFirstChatTitle: setTitle,
    interactionId,
    setInteractionId,
    isLoading,
    setIsLoading,
    setError,
    streamingAiId,
    setStreamingAiId,
    handleInitialChat,
    handleStopInitialChat: handleStopInitial,
    onGenerated,
  });

  const hasText = prompt.trim().length > 0;
  const hasMessages = messages.length > 0;

  // Dedicated scroll hook for container measuring and scroll-to-bottom button
  const {
    bottomAnchorRef,
    showScrollBottom,
    handleScrollToBottom,
  } = useScroll({
    hasMessages,
    messagesLength: messages.length,
    messagesEndRef,
  });

  // Listen for chat select events dispatched by the sidebar
  // to load chat detail without a full page navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleChatSelect = (event: Event) => {
      const { chatId: selectedChatId } = (event as CustomEvent<ChatSelectEventDetail>).detail;
      if (selectedChatId) {
        void handleLoadChatDetail(selectedChatId);
      }
    };
    window.addEventListener(CHAT_EVENTS.SELECT, handleChatSelect);
    return () => {
      window.removeEventListener(CHAT_EVENTS.SELECT, handleChatSelect);
    };
  }, [handleLoadChatDetail]);

  useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);

  return (
    <div className={cn("flex flex-col w-full min-h-svh", className)}>
      {/* Sticky header shown when chat is active or loading chat */}
      {(hasMessages || isLoadingChat) && (
        <ChatHeader
          title={title}
          chatId={chatId}
          onRename={setTitle}
          onDelete={reset}
          onNewChat={reset}
          onSelectChat={handleLoadChatDetail}
          isLoading={isLoadingChat}
          isActionDisabled={isLoading}
        />
      )}

      {/* Main chat container constrained to 860px */}
      <main
        className={cn(
          "mx-auto w-[860px] max-w-full px-4 sm:px-7 flex-1 flex flex-col transition-all duration-500 ease-in-out",
          hasMessages || isLoadingChat
            ? "pt-4 pb-0 justify-between"
            : "py-10 lg:py-16 justify-center"
        )}
      >
        {/* Header with smooth exit animation - hidden completely while loading chat detail */}
        {!isLoadingChat && (
          <div
            className={cn(
              "transition-all duration-500 ease-in-out",
              hasMessages
                ? "max-h-0 opacity-0 -translate-y-6 pointer-events-none mb-0 pb-0 overflow-hidden"
                : "max-h-[400px] opacity-100 translate-y-0 pb-2"
            )}
          >
            <EmptyStateHeader />
          </div>
        )}

        {/* Skeleton shown while loading chat detail & conversations */}
        {isLoadingChat && <ConversationSkeleton />}

        {/* Chat messages list shown when chat has started and not pending load */}
        {hasMessages && !isLoadingChat && (
          <ConversationList
            messages={messages}
            isLoading={isLoading}
            streamingAiId={streamingAiId}
            messagesEndRef={messagesEndRef}
            hasMore={hasMoreConversations}
            isLoadingMore={isLoadingMoreConversations}
            onLoadMore={handleLoadMoreConversations}
          />
        )}

        {/* Chatbox + template options wrapper */}
        <div
          className={cn(
            "relative mx-auto w-full transition-all duration-500 ease-in-out",
            hasMessages || isLoadingChat
              ? "mt-auto sticky bottom-0 z-30 pb-4 pt-2 bg-transparent"
              : "mt-5"
          )}
        >
          {/* Progressive gradient blur background that smoothly fades in from top to bottom */}
          {(hasMessages || isLoadingChat) && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-14 -left-8 -right-8 sm:-left-12 sm:-right-12 bottom-0 -z-10 bg-gradient-to-t from-[#f7f8fb] from-45% via-[#f7f8fb]/95 via-70% to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_55%,transparent_100%)]"
            />
          )}

          {/* Scroll to bottom button shown when user scrolls up */}
          {hasMessages && (
            <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 z-40">
              <button
                type="button"
                onClick={handleScrollToBottom}
                aria-label="Kembali ke paling bawah"
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition-opacity duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300",
                  showScrollBottom
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                )}
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-3 w-full max-w-2xl mx-auto">
              <ReusableAlert
                variant="destructive"
                description={error}
                dismissible
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          <div ref={bottomAnchorRef} className="relative w-full max-w-2xl mx-auto">
            <AIChatBox
              ref={chatBoxRef}
              value={prompt}
              onChange={(val) => {
                if (error) setError(null);
                setPrompt(val);
              }}
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
              disabled={isLoadingChat}
              hasMassage={hasMessages || isLoadingChat}
            />

            {/* Template options only visible on initial empty state (hidden once chat starts or when loading chat) */}
            {!hasMessages && !isLoadingChat && (
              <TemplateOptions
                hasText={hasText}
                onSelect={handleSelectTemplate}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatAI;
