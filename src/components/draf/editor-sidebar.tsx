"use client";

import { X, Send } from "lucide-react";
import type { DraftComment } from "@/types/contract.type";
import type { AiMessage, SidebarTab } from "@/types/draft-editor.type";
import { Button, SubmitButton } from "@/components/ui/button";
import { ConversationTab } from "./sidebar/conversation-tab";
import { DiscussionTab } from "./sidebar/discussion-tab";

export interface EditorSidebarProps {
  // Tab state
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;

  // AI conversation
  aiMessages: AiMessage[];

  // Discussion
  comments: DraftComment[];
  canEdit: boolean;
  canComment: boolean;
  selectedDraftText: string;
  replyToId: string | null;

  // Message input
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isCommenting: boolean;

  // Discussion callbacks
  onFocusCommentSource: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onUpdateComment: (commentId: string, body: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onSetResolved: (commentId: string, resolved: boolean) => Promise<boolean>;

  // Text selection
  onClearSelectedText: () => void;
  onPointerDown: () => void;
  onReplyCancel: () => void;
}

/**
 * Sidebar component with conversation and discussion tabs.
 * Handles AI chat and collaborative comments with text selection support.
 */
export function EditorSidebar({
  activeTab,
  onTabChange,
  aiMessages,
  comments,
  canEdit,
  canComment,
  selectedDraftText,
  replyToId,
  message,
  onMessageChange,
  onSendMessage,
  isCommenting,
  onFocusCommentSource,
  onReply,
  onUpdateComment,
  onDeleteComment,
  onSetResolved,
  onClearSelectedText,
  onPointerDown,
  onReplyCancel,
}: EditorSidebarProps) {
  const replyTarget = replyToId
    ? comments.find((c) => c.id === replyToId)
    : null;

  return (
    <aside className="flex min-h-[440px] flex-col bg-white p-4 xl:sticky xl:top-[57px] xl:h-[calc(100svh-125px)] xl:overflow-hidden">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-slate-200 pb-2.5">
        <Button
          variant={activeTab === "conversation" ? "secondary" : "ghost"}
          size="xs"
          type="button"
          onClick={() => {
            onTabChange("conversation");
            onMessageChange("");
          }}
        >
          Percakapan
        </Button>
        <Button
          variant={activeTab === "discussion" ? "secondary" : "ghost"}
          size="xs"
          type="button"
          onClick={() => {
            onTabChange("discussion");
            onMessageChange("");
          }}
        >
          Diskusi
        </Button>
      </div>

      {/* Tab content */}
      {activeTab === "conversation" ? (
        <ConversationTab aiMessages={aiMessages} />
      ) : (
        <DiscussionTab
          comments={comments}
          canEdit={canEdit}
          selectedDraftText={selectedDraftText}
          onClearSelectedText={onClearSelectedText}
          onFocusCommentSource={onFocusCommentSource}
          onReply={onReply}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onSetResolved={onSetResolved}
        />
      )}

      {/* Message composer */}
      <div className="mt-auto shrink-0 rounded-lg bg-slate-100 p-3">
        {activeTab === "discussion" && replyTarget && (
          <div className="mb-2 flex items-center justify-between rounded bg-white px-3 py-2 text-[10px] text-slate-500">
            <span>
              Membalas{" "}
              {replyTarget.isOwn ? "komentar Anda" : replyTarget.authorName}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={onReplyCancel}
              aria-label="Batal membalas"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
        <textarea
          value={message}
          disabled={activeTab === "conversation" || !canComment}
          onPointerDown={activeTab === "discussion" ? onPointerDown : undefined}
          onChange={(event) => onMessageChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSendMessage();
            }
          }}
          placeholder={
            activeTab === "conversation"
              ? "Percakapan AI belum diaktifkan..."
              : !canComment
                ? "Anda hanya dapat melihat diskusi ini"
                : replyToId
                  ? "Tulis balasan..."
                  : selectedDraftText
                    ? "Tulis komentar untuk teks yang dipilih..."
                    : "Pilih teks kontrak untuk mulai berkomentar"
          }
          className="min-h-20 w-full resize-none bg-transparent text-xs outline-none disabled:cursor-not-allowed"
        />
        <SubmitButton
          variant="default"
          size="icon-sm"
          type="button"
          disabled={
            activeTab === "conversation" ||
            isCommenting ||
            !canComment ||
            (!replyToId && !selectedDraftText)
          }
          onClick={() => void onSendMessage()}
          aria-label={
            activeTab === "conversation"
              ? "Kirim pertanyaan ke Klarisa AI"
              : "Kirim komentar diskusi"
          }
          className="ml-auto"
        >
          <Send className="size-4" />
        </SubmitButton>
      </div>
    </aside>
  );
}
