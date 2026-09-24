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
        "flex flex-col overflow-hidden h-full max-h-full bg-white dark:bg-slate-950 relative",
        className
      )}
    >
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
      />

      {/* Scrollable Messages & Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 text-sm flex flex-col relative">
        <div
          className={cn(
            "flex-1 flex flex-col w-full transition-all duration-500 ease-in-out",
            hasMessages || isLoadingChat
              ? "justify-between"
              : "justify-center items-center px-4 py-8 sm:py-6"
          )}
        >
          {/* Dedicated Empty State with Search Conversation button */}
          {!isLoadingChat && (
            <div
              className={cn(
                "transition-all duration-500 ease-in-out w-full flex justify-center",
                hasMessages
                  ? "max-h-0 opacity-0 -translate-y-4 pointer-events-none mb-0 overflow-hidden"
                  : "max-h-[300px] opacity-100 translate-y-0 mb-6 sm:mb-8"
              )}
            >
              <AgentEmptyState onSearchClick={() => setIsSearchOpen(true)} />
            </div>
          )}

          {/* Skeleton loading when fetching chat */}
          {isLoadingChat && (
            <div className="flex-1 px-4 py-3">
              <ConversationSkeleton />
            </div>
          )}

          {/* Active conversation list */}
          {hasMessages && !isLoadingChat && (
            <div className="flex-1 px-4 pb-6 pt-1 space-y-6 flex flex-col">
              <ConversationList
                variant="small"
                messages={messages}
                isLoading={isSending}
                streamingAiId={streamingAiId}
                messagesEndRef={messagesEndRef}
              />
            </div>
          )}

          {/* Chatbox Wrapper: Sticky at bottom with smooth gradient blur when chat is active; Centered below intro when empty */}
          <div
            className={cn(
              "relative w-full transition-all duration-500 ease-in-out",
              hasMessages || isLoadingChat
                ? "mt-auto sticky bottom-0 z-30 px-3 pb-3 pt-2 bg-transparent"
                : "w-full max-w-md mx-auto"
            )}
          >
            {/* Smooth gradient background that smoothly fades from bottom to top (active chat only) */}
            {(hasMessages || isLoadingChat) && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-8 left-0 right-0 bottom-0 -z-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90"
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