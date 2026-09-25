"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import AIChatBox from "@/components/ai-chat-box";
import { ReusableAlert } from "@/components/ui/reusable-alert";
import { cn } from "@/lib/utils";
import { useInitialChat } from "@/hooks/useInitialChat";
import { useActionChat } from "@/hooks/useActionChat";
import { useInteractionChat } from "@/hooks/useInteractionChat";
import { useScroll } from "@/hooks/useScroll";
import {
  CHAT_EVENTS,
  dispatchChatTitleChange,
  type ChatSelectEventDetail,
  type ChatUpdatedEventDetail,
} from "@/lib/chat-events";
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
  // Incrementing key to force EmptyStateHeader remount (replaying char animation) on each reset
  const [emptyStateKey, setEmptyStateKey] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSearchChatId = searchParams?.get("chat_id") || searchParams?.get("id") || undefined;

  /**
   * Ref to track when the user manually triggered a reset (e.g. clicking "Draft kontrak" from
   * a chat detail view). While this is true, we ignore the stale searchChatId coming from
   * useSearchParams so that handleLoadChatDetail is not re-triggered before Next.js finishes
   * updating the URL, which would cause the skeleton to flash.
   */
  const wasResetRef = useRef<boolean>(false);

  // Derive the effective chatId to pass to useActionChat.
  // Block it when reset is in-progress so stale searchChatId doesn't re-trigger a load.
  const searchChatId = wasResetRef.current ? undefined : rawSearchChatId;

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
    initialChatId: searchChatId,
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

  const handleChatReset = useCallback(() => {
    // Mark that reset was user-initiated so stale searchChatId (from useSearchParams)
    // does not re-trigger a chat load before Next.js finishes updating the URL.
    wasResetRef.current = true;
    reset();
    dispatchChatTitleChange(null);
    router.push("/dashboard/create");
    // Bump key so EmptyStateHeader remounts and replays the character-by-character animation
    setEmptyStateKey((k) => k + 1);
  }, [reset, router]);

  // Listen for chat select, reset, and title update events dispatched by external components
  // to load chat detail, start a fresh session, or keep local title synchronized.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleChatSelect = (event: Event) => {
      const { chatId: selectedChatId } = (event as CustomEvent<ChatSelectEventDetail>).detail;
      if (selectedChatId) {
        void handleLoadChatDetail(selectedChatId);
      }
    };
    const handleChatUpdated = (event: Event) => {
      const { chatId: updatedChatId, title: updatedTitle } = (event as CustomEvent<ChatUpdatedEventDetail>).detail;
      if (updatedChatId && updatedChatId === chatId && updatedTitle) {
        setTitle(updatedTitle);
      }
    };

    window.addEventListener(CHAT_EVENTS.SELECT, handleChatSelect);
    window.addEventListener(CHAT_EVENTS.RESET, handleChatReset);
    window.addEventListener(CHAT_EVENTS.UPDATED, handleChatUpdated);
    return () => {
      window.removeEventListener(CHAT_EVENTS.SELECT, handleChatSelect);
      window.removeEventListener(CHAT_EVENTS.RESET, handleChatReset);
      window.removeEventListener(CHAT_EVENTS.UPDATED, handleChatUpdated);
    };
  }, [handleLoadChatDetail, handleChatReset, chatId, setTitle]);

  // Reset active session ONLY when URL is cleared after an intentional navigation
  // (wasResetRef.current=true). Guards against spurious resets when a new chat is
  // created in create mode (rawSearchChatId stays undefined but chatId becomes non-null).
  useEffect(() => {
    if (!rawSearchChatId && wasResetRef.current) {
      wasResetRef.current = false;
    }
  }, [rawSearchChatId]);

  useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);

  // Synchronize active chat title with DashboardShell (e.g. for mobile top header bar)
  useEffect(() => {
    if (hasMessages && title) {
      dispatchChatTitleChange(title, chatId ?? undefined);
    } else if (!hasMessages) {
      dispatchChatTitleChange(null);
    }
  }, [hasMessages, title, chatId]);

  useEffect(() => {
    return () => {
      dispatchChatTitleChange(null);
    };
  }, []);

  return (
    <div className={cn("flex flex-col w-full h-full min-h-0 max-w-full overflow-hidden", className)}>
      {/* Sticky header shown on desktop when chat is active or loading chat (hidden on mobile to avoid duplicate header) */}
      {(hasMessages || (Boolean(searchChatId) && isLoadingChat)) && (
        <ChatHeader
          className="hidden lg:block shrink-0"
          title={title}
          chatId={chatId}
          onRename={setTitle}
          onDelete={handleChatReset}
          onNewChat={handleChatReset}
          onSelectChat={handleLoadChatDetail}
          isLoading={isLoadingChat}
          isActionDisabled={isLoading}
        />
      )}

      {/* Full width scrollable area so scrollbar sits at the far right edge on desktop and mobile */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto relative flex flex-col">
        {/* Main chat container constrained to 860px */}
        <main
          className={cn(
            "mx-auto w-[860px] max-w-full min-w-0 px-4 sm:px-7 flex-1 flex flex-col",
            hasMessages || (Boolean(searchChatId) && isLoadingChat)
              ? "pt-4 pb-0"
              : "py-10 lg:py-16 justify-center"
          )}
        >
        {/* Header — shown in empty state, collapses when chat starts (no reverse transition) */}
        {(!searchChatId || !isLoadingChat) && (
          <div
            className={cn(
              hasMessages && "transition-all duration-500 ease-in-out",
              hasMessages
                ? "max-h-0 opacity-0 pointer-events-none overflow-hidden"
                : "pb-2"
            )}
          >
            <EmptyStateHeader key={emptyStateKey} />
          </div>
        )}

        {/* Skeleton shown ONLY while loading an existing chat detail from URL */}
        {Boolean(searchChatId) && isLoadingChat && <ConversationSkeleton />}

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
            "relative mx-auto w-full",
            hasMessages || (Boolean(searchChatId) && isLoadingChat)
              ? "mt-auto sticky bottom-0 z-30 pb-4 pt-2 bg-transparent"
              : "mt-5"
          )}
        >
          {/* Progressive gradient blur background that smoothly fades in from top to bottom */}
          {(hasMessages || (Boolean(searchChatId) && isLoadingChat)) && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-14 -left-4 -right-4 sm:-left-7 sm:-right-7 bottom-0 -z-10 bg-gradient-to-t from-[#f7f8fb] from-45% via-[#f7f8fb]/95 via-70% to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_55%,transparent_100%)]"
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
              hasMassage
            />

            {/* Template options only visible on initial empty state (hidden once chat starts or when loading chat) */}
            {!hasMessages && (!searchChatId || !isLoadingChat) && (
              <TemplateOptions
                hasText={hasText}
                onSelect={handleSelectTemplate}
              />
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

export default ChatAI;
