"use client";

import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextEditorToolbar } from "@/components/draf/text-editor/text-editor-toolbar";
import { AgentPanel } from "@/components/draf/agent/agent-panel";

/**
 * DraftEditorSkeleton component.
 * Renders the real workspace UI shell (Header, Toolbar, and Agent Panel)
 * and only skeletonizes dynamic data elements (title, timestamp, and document text lines).
 */
export function DraftEditorSkeleton() {
  return (
    <div className="flex flex-col h-full max-h-full min-h-0 flex-1 overflow-hidden bg-white">
      {/* Real Header: Only title and updated timestamp are skeletons */}
      <header className="shrink-0 sticky top-0 z-30 mx-auto flex h-[68px] min-h-[68px] w-full items-center gap-2 sm:gap-3 bg-white border-b border-input px-2 sm:px-3">
        <div className="flex gap-1.5 sm:gap-2 w-full items-center">
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Kembali"
            aria-label="Kembali"
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex justify-between items-center w-full min-w-0">
            <div className="flex flex-col gap-1 justify-center min-w-0 flex-1 mr-2">
              <Skeleton className="h-4 w-36 sm:w-52 rounded bg-slate-200" />
              <Skeleton className="h-3 w-20 sm:w-28 rounded bg-slate-200" />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 text-slate-400">
              <Button variant="ghost" size="icon" disabled className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace: Real Toolbar + Skeletonized Canvas Text + Real Agent Sidebar */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <div className="w-full h-full flex justify-start items-center overflow-hidden">
          {/* Editor Column: Real Toolbar + Canvas with Text Skeleton only */}
          <div className="h-full min-w-0 flex flex-col shrink-0 w-full max-w-[760px] xl:max-w-[820px] 2xl:max-w-[860px]">
            {/* Real Text Editor Toolbar (Buttons are real, not skeleton) */}
            <TextEditorToolbar editor={null} className="w-full shrink-0" />

            {/* Document Canvas: Only document content has text line skeletons */}
            <div
              data-editor-canvas
              className="flex-1 min-h-0 overflow-y-auto border-r border-input bg-white p-6 sm:p-8 lg:p-15 relative"
            >
              <div className="mx-auto w-full max-w-none space-y-4 pt-2">
                <Skeleton className="h-8 w-3/5 rounded-md" />
                <div className="space-y-3 pt-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="h-4 w-9/12 rounded" />
                </div>
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-2/5 rounded-md" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Sidebar on the right (Real Component, not skeleton) */}
          <div className="hidden lg:flex flex-1 h-full min-w-0 overflow-hidden">
            <AgentPanel
              selectedText=""
              highlightId={undefined}
              isMultiLine={false}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
