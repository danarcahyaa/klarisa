"use client";

import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

import { CommentTooltip } from "./comment-tooltip";
import { EditorCanvas } from "./editor-canvas";
import { EditorDialogs } from "./editor-dialogs";
import { EditorHeader } from "./editor-header";
import { EditorSidebar } from "./editor-sidebar";
import { useDraft } from "@/hooks/useDraft";
import type { ContractDetail } from "@/types/contract.type";
import {
  DEFAULT_DOCUMENT,
  CommentMark,
  ensureCommentHighlightsInHtml,
} from "@/lib/draft-editor";

interface DraftEditorProps {
  initialDraft: ContractDetail;
}

/**
 * Main Draft Editor page component orchestrating header, toolbar, canvas, floating comment tooltip, and sidebar.
 */
export function DraftEditor({ initialDraft }: DraftEditorProps) {
  const {
    data: remoteDraft,
    error: draftError,
    isSaving,
    isCommenting,
    isSharing,
    isDeleting,
    isLoadingVersion,
    isRestoringVersion,
    isManagingAccess,
    saveDraft: saveRemoteDraft,
    deleteDraft,
    getDraftVersion,
    restoreDraftVersion,
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    dismissError,
    updateComment,
    deleteComment,
    setCommentResolved,
    addComment,
  } = useDraft(initialDraft);

  const [title, setTitle] = useState(initialDraft.title);
  const [activeTab, setActiveTab] = useState<"conversation" | "discussion">(
    "discussion",
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<null | Awaited<
    ReturnType<typeof getDraftVersion>
  >>(null);
  const [versionToRestore, setVersionToRestore] = useState<null | Awaited<
    ReturnType<typeof getDraftVersion>
  >>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const canEdit = remoteDraft.permission === "owner";
  const canComment = canEdit || remoteDraft.permission === "commenter";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      CommentMark,
    ],
    content: ensureCommentHighlightsInHtml(
      initialDraft.content || DEFAULT_DOCUMENT,
      initialDraft.comments || [],
    ),
    editable: canEdit,
    onSelectionUpdate: ({ editor }) => {
      const selection = editor.state.selection;
      if (!selection.empty) {
        const text = editor.state.doc.textBetween(
          selection.from,
          selection.to,
          " ",
        );
        setSelectedText(text.trim());

        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTooltipPos({
              top: rect.top,
              left: Math.max(20, rect.left + rect.width / 2 - 60),
            });
          }
        }
      } else {
        setSelectedText("");
        setTooltipPos(null);
      }
    },
  });

  // Attach click listener on editor element to open comments when highlighted text is clicked
  useEffect(() => {
    if (!editor || !editor.options.element) return;
    const element = editor.options.element as HTMLElement;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        "[data-comment-id], [data-draft-comment-id]",
      );
      if (target) {
        const commentId =
          target.getAttribute("data-comment-id") ||
          target.getAttribute("data-draft-comment-id");
        if (commentId) {
          e.stopPropagation();
          setActiveTab("discussion");
          setReplyToId(commentId);
          setNotice("Memfokuskan sumber komentar.");
        }
      }
    };

    element.addEventListener("click", handleClick);
    return () => element.removeEventListener("click", handleClick);
  }, [editor]);

  // Synchronize remote comments into editor content using Cheerio enrichment
  useEffect(() => {
    if (!editor || !remoteDraft.comments || remoteDraft.comments.length === 0)
      return;
    const currentHtml = editor.getHTML();
    const enrichedHtml = ensureCommentHighlightsInHtml(
      currentHtml,
      remoteDraft.comments,
    );
    if (enrichedHtml !== currentHtml) {
      editor.commands.setContent(enrichedHtml, { emitUpdate: false });
    }
  }, [editor, remoteDraft.comments]);

  const persistTitle = async () => {
    if (!editor) return;
    await saveRemoteDraft({
      title,
      content: editor.getHTML(),
      createVersion: false,
    });
  };

  const handleSearchNext = () => {
    if (!editor) return;
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");
    if (!query) return;

    const text = editor.getText().toLocaleLowerCase("id-ID");
    let start = text.indexOf(query);
    const matches: number[] = [];

    while (start >= 0) {
      matches.push(start);
      start = text.indexOf(query, start + query.length);
    }

    if (matches.length === 0) {
      setSearchFeedback("Tidak ditemukan");
      return;
    }

    const currentIndex = Number(searchFeedback.split(" ")[0] || 0);
    const nextIndex = matches.length > 0 ? currentIndex % matches.length : 0;
    const rangeStart = matches[nextIndex];
    editor.commands.setTextSelection({
      from: rangeStart,
      to: rangeStart + query.length,
    });
    setSearchFeedback(`${nextIndex + 1} dari ${matches.length}`);
  };

  const handleInsertLink = () => {
    const url = window.prompt("Masukkan alamat tautan:", "https://");
    if (!url || !(url.startsWith("https://") || url.startsWith("http://")))
      return;
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleSaveVersion = async () => {
    await saveRemoteDraft({
      title,
      content: editor?.getHTML() ?? initialDraft.content,
      createVersion: true,
    });
  };

  const handleShare = async () => {
    const saved = await saveRemoteDraft({
      title,
      content: editor?.getHTML() ?? initialDraft.content,
      createVersion: false,
    });
    if (saved) setIsShareOpen(true);
  };

  const handleSubmitInvitation = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const invited = await inviteCollaborator({ email: inviteEmail });
    if (!invited) return;
    await navigator.clipboard.writeText(window.location.href);
    setInviteEmail("");
    setIsShareOpen(false);
    setNotice("Pihak terkait ditambahkan dan tautan draft disalin.");
  };

  const handleSelectVersion = async (versionId: string) => {
    const version = await getDraftVersion(versionId);
    if (version) setSelectedVersion(version);
  };

  const handleRestoreVersion = async () => {
    if (!versionToRestore) return;
    const restored = await restoreDraftVersion(versionToRestore.id);
    if (!restored || !editor) return;
    setTitle(restored.title);
    editor.commands.setContent(restored.content);
    setVersionToRestore(null);
    setIsVersionsOpen(false);
    setNotice(
      `Draft dipulihkan ke versi ${String(restored.version).padStart(2, "0")}.`,
    );
  };

  const handleDeleteDraft = async () => {
    const deleted = await deleteDraft();
    if (!deleted) return;
    setIsDeleteOpen(false);
    setNotice("Draft dihapus.");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (activeTab === "conversation") {
      setNotice("Percakapan AI belum diaktifkan.");
      return;
    }

    const payload = replyToId
      ? { body: message.trim(), parentId: replyToId }
      : {
          body: message.trim(),
          selectedText: selectedText || undefined,
        };

    const created = await addComment(payload);
    if (!created) return;

    if (editor && created.id && selectedText && !replyToId) {
      editor.chain().focus().setMark("commentMark", { commentId: created.id }).run();
      void saveRemoteDraft({
        title,
        content: editor.getHTML(),
        createVersion: false,
      });
    }

    setMessage("");
    setReplyToId(null);
    setSelectedText("");
    setTooltipPos(null);
  };

  return (
    <div className="min-h-[calc(100svh-57px)] bg-[#f7f8fb] px-4 pt-6 sm:px-7">
      <EditorHeader
        draft={remoteDraft}
        title={title}
        saveStatus={"saved"}
        isSaving={isSaving}
        canEdit={canEdit}
        onTitleChange={setTitle}
        onTitleBlur={() => void persistTitle()}
        onSaveVersion={() => void handleSaveVersion()}
        onViewVersions={() => setIsVersionsOpen(true)}
        onShare={() => void handleShare()}
        onActionsToggle={() => setIsActionsOpen((value) => !value)}
        isActionsOpen={isActionsOpen}
        onDelete={() => {
          setIsActionsOpen(false);
          setIsDeleteOpen(true);
        }}
        isSharing={isSharing}
      />

      {(notice || draftError) && (
        <div className="fixed top-20 right-4 z-50 flex max-w-xs items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs font-semibold shadow-lg">
          <span className="text-klarisa-secondary">•</span>
          <span>{notice || draftError}</span>
          <button
            type="button"
            onClick={() => {
              setNotice("");
              dismissError();
            }}
            className="ml-auto"
            aria-label="Tutup pemberitahuan"
          >
            ×
          </button>
        </div>
      )}

      {canComment && (
        <CommentTooltip
          position={tooltipPos}
          selectedText={selectedText}
          isCommenting={isCommenting}
          onClose={() => {
            setTooltipPos(null);
            setSelectedText("");
          }}
          onAddComment={async (commentBody) => {
            const created = await addComment({
              body: commentBody,
              selectedText: selectedText || undefined,
            });
            if (created) {
              if (editor && created.id && selectedText) {
                editor.chain().focus().setMark("commentMark", { commentId: created.id }).run();
                void saveRemoteDraft({
                  title,
                  content: editor.getHTML(),
                  createVersion: false,
                });
              }
              setTooltipPos(null);
              setSelectedText("");
              setActiveTab("discussion");
            }
          }}
        />
      )}

      <EditorDialogs
        isShareOpen={isShareOpen}
        onShareClose={() => setIsShareOpen(false)}
        draft={remoteDraft}
        inviteEmail={inviteEmail}
        onInviteEmailChange={setInviteEmail}
        onSubmitInvitation={handleSubmitInvitation}
        isSharing={isSharing}
        onChangeCollaboratorRole={(userId, role) =>
          void updateCollaboratorRole({ userId, role })
        }
        onRevokeAccess={(userId) => void removeCollaborator(userId)}
        isManagingAccess={isManagingAccess}
        isVersionsOpen={isVersionsOpen}
        onVersionsClose={() => setIsVersionsOpen(false)}
        versions={remoteDraft.versions}
        selectedVersion={selectedVersion}
        onSelectVersion={handleSelectVersion}
        isLoadingVersion={isLoadingVersion}
        onRestoreClick={setVersionToRestore}
        versionToRestore={versionToRestore}
        onRestoreCancel={() => setVersionToRestore(null)}
        onRestoreConfirm={() => void handleRestoreVersion()}
        isRestoringVersion={isRestoringVersion}
        isDeleteOpen={isDeleteOpen}
        onDeleteClose={() => setIsDeleteOpen(false)}
        onDeleteConfirm={() => void handleDeleteDraft()}
        isDeleting={isDeleting}
      />

      <div className="mx-auto grid min-h-[calc(100svh-125px)] w-full max-w-[1080px] bg-white xl:grid-cols-[minmax(0,1fr)_340px] xl:overflow-hidden xl:rounded-b-lg xl:border-x xl:border-b xl:border-slate-200">
        <EditorCanvas
          editor={editor}
          canEdit={canEdit}
          isSearchOpen={isSearchOpen}
          onSearchToggle={() => setIsSearchOpen((value) => !value)}
          onInsertLink={handleInsertLink}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchNext={handleSearchNext}
          searchFeedback={searchFeedback}
        />

        <EditorSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMessage("");
          }}
          aiMessages={[
            {
              role: "assistant",
              body: "Percakapan Klarisa AI akan tersedia setelah layanan Gemini dan sumber hukum terhubung.",
            },
          ]}
          comments={remoteDraft.comments}
          canEdit={canEdit}
          canComment={canComment}
          selectedDraftText={selectedText}
          replyToId={replyToId}
          message={message}
          onMessageChange={setMessage}
          onSendMessage={() => void handleSendMessage()}
          isCommenting={isCommenting}
          onFocusCommentSource={(commentId) => {
            setReplyToId(commentId);
            setNotice("Memfokuskan sumber komentar.");
          }}
          onReply={(commentId) => setReplyToId(commentId)}
          onUpdateComment={async (commentId, body) => {
            const updated = await updateComment(commentId, { body });
            return !!updated;
          }}
          onDeleteComment={async (commentId) => {
            const deleted = await deleteComment(commentId);
            return !!deleted;
          }}
          onSetResolved={async (commentId, resolved) => {
            const updated = await setCommentResolved(commentId, resolved);
            return !!updated;
          }}
          onClearSelectedText={() => {
            setSelectedText("");
            setTooltipPos(null);
          }}
          onPointerDown={() => undefined}
          onReplyCancel={() => setReplyToId(null)}
        />
      </div>
    </div>
  );
}
