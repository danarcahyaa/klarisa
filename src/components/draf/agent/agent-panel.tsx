"use client";

import { useCallback, useState } from "react";
import { useDraftEditorAgent } from "@/hooks/useDraftEditorAgent";
import { AgentHeader } from "./agent-header";
import { AgentEmptyState } from "./agent-empty-state";
import { SearchChatDialog } from "../chat-ai/search-chat-dialog";
import { SelectedTextBox } from "./selected-text-box";
import { ConversationList } from "../chat-ai/conversation-list";
import { ConversationSkeleton } from "../chat-ai/conversation-skeleton";
import { cn } from "@/lib/utils";
import AIChatBox from "@/components/ai-chat-box";

export interface AgentProps {
  /** Callback triggered when user closes the Agent sidebar */
  onClose?: () => void;
  /** Additional container styling */
  className?: string;
  /** Text selection passed from editor tooltip for question context */
  selectedText?: string | null;
  /** Unique ID of the highlight mark corresponding to the active selection */
  highlightId?: string | null;
  /** Whether the active selection spans multiple lines */
  isMultiLine?: boolean;
  /** Initial chat session ID if continuing a thread */
  initialChatId?: string | null;
  /** Callback ref for measuring element height in selection box */
  setSelectedTextRef?: (node: HTMLDivElement | null) => void;
  /** Callback to dismiss the selected text and clear highlight from editor */
  onDismissSelectedText?: () => void;
  /** Backwards compatibility alias */
  onClearSelectedText?: () => void;
  /** Whether the panel is rendered in mobile/sheet mode */
  isMobile?: boolean;
}

export function AgentPanel({
  onClose,
  className,
  selectedText,
  highlightId,
  isMultiLine,
  initialChatId,
  setSelectedTextRef,
  onDismissSelectedText: externalDismiss,
  onClearSelectedText,
  isMobile = false,
}: AgentProps) {
  const dismissHandler = externalDismiss || onClearSelectedText;

  const {
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
  } = useDraftEditorAgent({
    selectedText,
    highlightId,
    initialChatId,
  });

  const handleSendMessage = useCallback(
    async (promptText?: string) => {
      const sendPromise = handleSend(promptText);
      if (selectedText) {
        dismissHandler?.();
      }
      await sendPromise;
    },
    [handleSend, selectedText, dismissHandler]
  );

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hasMessages = messages.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden h-full max-h-full relative",
        className
      )}
    >
      {/* Mobile sheet drag handle indicator */}
      {isMobile && (
        <div className="flex items-center justify-center pt-2.5 pb-1 shrink-0 select-none">
          <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {/* Fixed top header when in chat mode */}
      <AgentHeader
        title={chatTitle}
        chatId={chatId}
        onRename={setChatTitle}
        onNewChat={handleNewChat}
        onDelete={handleNewChat}
        onSelectChat={handleSelectChat}
        onOpenSearch={() => setIsSearchOpen(true)}
        onClose={onClose}
        isLoading={isLoadingChat}
        isActionDisabled={isSending || isLoadingChat}
        isEmpty={!hasMessages}
        isMobile={isMobile}
      />

      {/* Scrollable Messages & Content Area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto min-h-0 text-sm flex flex-col relative",
          isMobile ? "px-6" : "px-4 sm:px-6"
        )}
      >
        <div
          className={cn(
            "flex-1 flex flex-col w-full",
            hasMessages || isLoadingChat
              ? "pt-3 pb-0"
              : "py-6 sm:py-8 justify-center"
          )}
        >
          {/* Header — shown in empty state only */}
          {!isLoadingChat && !hasMessages && (
            <div className="w-full flex justify-center pb-2">
              <AgentEmptyState onSearchClick={() => setIsSearchOpen(true)} />
            </div>
          )}

          {/* Skeleton loading when fetching chat */}
          {isLoadingChat && (
            <div className="flex-1 py-3">
              <ConversationSkeleton />
            </div>
          )}

          {/* Active conversation list */}
          {hasMessages && !isLoadingChat && (
            <ConversationList
              variant="small"
              messages={messages}
              isLoading={isSending}
              streamingAiId={streamingAiId}
              messagesEndRef={messagesEndRef}
            />
          )}

          {/* Chatbox Wrapper: Sticky at bottom with smooth gradient blur when chat is active; Consistent full width across empty and active states */}
          <div
            className={cn(
              "relative w-full",
              hasMessages || isLoadingChat
                ? cn(
                    "mt-auto sticky bottom-0 z-30 pt-2 bg-transparent",
                    isMobile ? "pb-4 sm:pb-3" : "pb-3"
                  )
                : cn("mt-4 w-full", isMobile && "pb-4")
            )}
          >
            {/* Smooth gradient background that smoothly fades from bottom to top (active chat only) */}
            {(hasMessages || isLoadingChat) && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -top-8 bottom-0 -z-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90",
                  isMobile ? "-left-6 -right-6" : "-left-4 -right-4 sm:-left-6 sm:-right-6"
                )}
              />
            )}

            <SelectedTextBox
              selectedText={selectedText}
              isMultiLine={isMultiLine}
              setSelectedTextRef={setSelectedTextRef}
              onDismiss={dismissHandler}
            />

            <AIChatBox
              variant="small"
              isLoading={isSending}
              disabled={isLoadingChat}
              hasMassage={hasMessages || isLoadingChat}
              onSend={handleSendMessage}
              onStop={handleStop}
              value={input}
              onChange={(e) => setInput(e)}
              placeholder={selectedText ? "Tanyakan tentang ini..." : "Tanyakan sesuatu..."}
            />
          </div>
        </div>
      </div>

      <SearchChatDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        currentChatId={chatId}
        onSelectChat={(selectedId) => {
          setIsSearchOpen(false);
          handleSelectChat?.(selectedId);
        }}
      />
    </div>
  );
}