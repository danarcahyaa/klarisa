import { useState, useCallback } from "react";
import { TextEditorToolbar } from "./text-editor-toolbar";
import { EditorContent, EditorContext } from "@tiptap/react";
import { AgentPanel } from "../agent/agent-panel";
import { useDraftEditor } from "@/hooks/useDraftEditor";
import { useClause } from "@/hooks/useClause";
import { useReviseClause } from "@/hooks/useReviseClause";
import { useSelectionTextDraft } from "@/hooks/useSelectionTextDraft";
import { SelectionTooltip } from "./selection-tooltip";
import type { ClauseReviewItem } from "@/types/clause.type";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface TextEditorCanvasProps {
  contractId?: string;
  initialContent?: string;
  initialReviews?: ClauseReviewItem[] | null;
  isLoading?: boolean;
  onContentChange?: (content: string) => void;
}

export function TextEditorCanvas({
  contractId,
  initialContent = "",
  initialReviews = null,
  isLoading = false,
  onContentChange,
}: TextEditorCanvasProps) {
  const [isMobileAgentOpen, setIsMobileAgentOpen] = useState(false);

  const { editor } = useDraftEditor({
    initialContent,
    onContentChange,
  });

  const {
    reviews,
    isReviewing,
    handleReviewClause,
    handleDeleteReview,
    getReviewById,
  } = useClause({
    contractId,
    initialReviews,
    editor,
  });

  const {
    isRevising: isRevisingClause,
    activeRevision,
    handleStartRevise,
    handleAcceptRevision,
    handleRejectRevision,
  } = useReviseClause({ editor });

  const {
    selectedTextForAsk,
    selectedHighlightId,
    isMultiLine,
    setSelectedTextRef,
    handleSelectTextForAsk,
    handleDismissSelectedText,
  } = useSelectionTextDraft({ editor });

  const handleAsk = useCallback(
    (text: string, highlightId?: string) => {
      handleSelectTextForAsk(text, highlightId);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setIsMobileAgentOpen(true);
      }
    },
    [handleSelectTextForAsk]
  );

  return (
    <section className="min-w-0 h-full w-full">
      <EditorContext.Provider value={{ editor }}>
        <div className="w-full h-full flex justify-start items-center overflow-hidden">
          {/* Editor Column: Fixed Toolbar + Scrollable Document Canvas */}
          <div className="h-full min-w-0 flex flex-col shrink-0 w-full max-w-[760px] xl:max-w-[820px] 2xl:max-w-[860px]">
            <TextEditorToolbar
              editor={editor}
              className="w-full shrink-0"
              isAgentOpen={isMobileAgentOpen}
              onToggleAgent={() => setIsMobileAgentOpen((prev) => !prev)}
            />

            {/* ONLY SCROLLABLE AREA: Document Canvas */}
            <div
              data-editor-canvas
              className="flex-1 min-h-0 overflow-y-auto border-r border-input cursor-text bg-white p-6 sm:p-8 lg:p-15 relative"
              onClick={() => editor?.chain().focus().run()}
            >
              {isLoading ? (
                <div className="mx-auto w-full max-w-none space-y-4 animate-pulse pt-2">
                  <Skeleton className="h-8 w-3/5 rounded bg-slate-100" />
                  <div className="space-y-2.5 pt-3">
                    <Skeleton className="h-4 w-full rounded bg-slate-2" />
                    <Skeleton className="h-4 w-11/12 rounded bg-slate-100" />
                    <Skeleton className="h-4 w-4/5 rounded bg-slate-100" />
                  </div>
                  <div className="space-y-2.5 pt-4">
                    <Skeleton className="h-5 w-2/5 rounded bg-slate-100" />
                    <Skeleton className="h-4 w-full rounded bg-slate-100" />
                    <Skeleton className="h-4 w-5/6 rounded bg-slate-100" />
                    <Skeleton className="h-4 w-3/4 rounded bg-slate-100" />
                  </div>
                </div>
              ) : (
                <>
                  <SelectionTooltip
                    editor={editor}
                    onAsk={handleAsk}
                    reviews={reviews}
                    isReviewing={isReviewing}
                    isRevisingClause={isRevisingClause}
                    onReviewClause={handleReviewClause}
                    onReviseClause={handleStartRevise}
                    onDeleteReview={handleDeleteReview}
                    getReviewById={getReviewById}
                  />
                  <EditorContent
                    editor={editor}
                    role="presentation"
                    className="h-full mx-auto w-full prose max-w-none text-sm leading-6 text-slate-800 [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
                  />
                </>
              )}
            </div>
          </div>

          {/* AI Agent Sidebar on the right (Desktop only) */}
          <div className="hidden lg:flex flex-1 h-full min-w-0 overflow-hidden">
            <AgentPanel
              selectedText={selectedTextForAsk}
              highlightId={selectedHighlightId}
              isMultiLine={isMultiLine}
              setSelectedTextRef={setSelectedTextRef}
              onDismissSelectedText={handleDismissSelectedText}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Mobile Agent Panel Sheet */}
        <Sheet open={isMobileAgentOpen} onOpenChange={setIsMobileAgentOpen}>
          <SheetContent
            side="bottom"
            className="w-full h-[88vh] rounded-t-2xl sm:rounded-t-3xl max-h-[94vh] p-0 flex flex-col gap-0 overflow-hidden bg-white dark:bg-slate-950"
          >
            
            <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col py-3 pl-3 pr-1">
              <AgentPanel
                selectedText={selectedTextForAsk}
                highlightId={selectedHighlightId}
                isMultiLine={isMultiLine}
                setSelectedTextRef={setSelectedTextRef}
                onDismissSelectedText={handleDismissSelectedText}
                className="w-full h-full"
              />
            </div>
          </SheetContent>
        </Sheet>
      </EditorContext.Provider>
    </section>
  );
}