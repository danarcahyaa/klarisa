"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, ChevronRight, Eye } from "lucide-react";

import {
  ContractDocument,
  DocumentHeader,
  FindingList,
  MobileFindingDetailDrawer,
  ReviewRiskSummaryBar,
} from "@/components/review-result";
import { Button } from "@/components/ui/button";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useDeleteReview } from "@/hooks/useDeleteReview";
import { useReviewResultWorkspace } from "@/hooks/useReviewResultWorkspace";
import { cn } from "@/lib/utils";
import type { DisplayFinding } from "@/types/contract-review.type";
import { Skeleton } from "./ui/skeleton";

interface ReviewResultWorkspaceProps {
  reviewId?: string;
}

export function ReviewResultWorkspace({ reviewId }: ReviewResultWorkspaceProps) {
  const isMobile = useIsBreakpoint("max", 1024);
  const { isDeleting: isDeletingReview, handleDeleteReview } = useDeleteReview();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedTooltip, setSelectedTooltip] = useState<{
    findingId: string;
    top: number;
    left: number;
  } | null>(null);
  const [drawerFinding, setDrawerFinding] = useState<DisplayFinding | null>(null);
  const [drawerFindingIndex, setDrawerFindingIndex] = useState<number>(1);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    fileName,
    createdAt,
    highlightedHtml,
    findings,
    activeFinding,
    isLoading,
    error,
    isContract,
    notContractReason,
    totalAnalyzed,
    reasoningError,
    selectFromList,
    handleBackToReview,
  } = useReviewResultWorkspace(reviewId);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Summary bar touches the top sticky position once scrolled past DocumentHeader height (~56px)
    setShowScrollTop(container.scrollTop >= 56);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onDeleteReview = useCallback(async () => {
    if (reviewId) {
      await handleDeleteReview(reviewId, "/dashboard/review");
    }
  }, [reviewId, handleDeleteReview]);

  // Dismiss mobile tooltip if viewport resizes to desktop
  useEffect(() => {
    if (!isMobile && selectedTooltip) {
      setSelectedTooltip(null);
    }
  }, [isMobile, selectedTooltip]);

  // Show selection tooltip on mobile and smooth scroll to the clicked risky clause
  const handleClauseClick = useCallback(
    (findingId: string, targetEl: HTMLElement) => {
      // Highlight the active finding
      selectFromList(findingId, false);

      const container = scrollContainerRef.current;
      if (!container) return;

      // Smooth scroll the clause to the center of view
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

      // Only display the floating selection tooltip on mobile viewports (< 1024px)
      if (!isMobile) {
        setSelectedTooltip(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const tooltipWidth = 125;
      const tooltipHeight = 36;

      // Calculate absolute position inside the scrollable container content
      const relativeTargetTop = targetRect.top - containerRect.top + container.scrollTop;
      const hasSpaceAbove = targetRect.top - containerRect.top >= tooltipHeight + 12;
      const top = hasSpaceAbove
        ? relativeTargetTop - tooltipHeight - 8
        : relativeTargetTop + targetRect.height + 8;

      const relativeTargetLeft = targetRect.left - containerRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      const left = Math.max(12, Math.min(container.clientWidth - tooltipWidth - 12, relativeTargetLeft));

      setSelectedTooltip({ findingId, top, left });
    },
    [isMobile, selectFromList]
  );

  // Close tooltip on tapping outside
  useEffect(() => {
    if (!selectedTooltip) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-clause-tooltip]") || target.closest("[data-finding-source]")) {
        return;
      }
      setSelectedTooltip(null);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedTooltip]);

  // Open detail drawer when user taps "Lihat detail" in tooltip
  const handleOpenDrawerFromTooltip = useCallback(() => {
    if (!selectedTooltip) return;
    const idx = findings.findIndex((f) => f.findingId === selectedTooltip.findingId);
    if (idx !== -1) {
      setDrawerFinding(findings[idx]);
      setDrawerFindingIndex(idx + 1);
      setIsMobileDrawerOpen(true);
    }
    setSelectedTooltip(null);
  }, [findings, selectedTooltip]);

  if (error) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-6 shadow-sm text-center">
          <AlertTriangle className="mx-auto size-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Detail Review</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button className="mt-5 cursor-pointer" onClick={handleBackToReview}>
            Kembali ke Review Kontrak
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex-1 min-h-0 bg-white overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[1fr_480px]">
        <div className="relative flex flex-col h-full max-h-full min-h-0 lg:border-r border-slate-200 bg-white overflow-hidden">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <DocumentHeader
              fileName={fileName}
              createdAt={createdAt}
              isLoading={isLoading}
              isDeleting={isDeletingReview}
              onDeleteReview={onDeleteReview}
            />

            {/* Mobile Risk Summary Bar: Becomes sticky at top-0 touching the hamburger header, layered above DocumentHeader */}
            <div className="sticky top-0 z-20 px-4 pt-3 pb-8 lg:hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 -bottom-8 progressive-blur-fade-white"
              />
              <div className="relative z-10">
                <ReviewRiskSummaryBar
                  isLoading={isLoading}
                  totalAnalyzed={totalAnalyzed || findings.length}
                  riskyCount={findings.length}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2 px-10 py-15">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <ContractDocument
                htmlContent={highlightedHtml}
                activeFinding={activeFinding}
                onSelectFinding={selectFromList}
                onClauseClick={handleClauseClick}
              />
            )}

            {/* Selection tooltip placed inside scroll container with z-10 so it passes behind sticky summary bar (z-20) and header (z-20). Only shown on mobile viewports */}
            {isMobile && selectedTooltip && (
              <div
                data-clause-tooltip
                style={{
                  position: "absolute",
                  top: `${selectedTooltip.top}px`,
                  left: `${selectedTooltip.left}px`,
                }}
                className="z-10 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={handleOpenDrawerFromTooltip}
                  className="flex items-center gap-1.5 rounded-full bg-slate-900/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-md ring-1 ring-white/20 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  <Eye className="size-3.5 text-white" />
                  <span>Lihat detail</span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* Floating scroll-to-top button in bottom right */}
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Kembali ke atas"
            title="Kembali ke atas"
            className={cn(
              "absolute bottom-6 right-6 z-30 flex size-10 items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-slate-700 hover:text-klarisa-secondary hover:border-slate-300 active:scale-95 transition-all duration-300 cursor-pointer",
              showScrollTop
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-3 pointer-events-none"
            )}
          >
            <ArrowUp className="size-4.5" />
          </button>
        </div>

        {/* Right column: Finding List (Hidden on mobile, visible on desktop) */}
        <div className="hidden lg:flex flex-col h-full max-h-full min-h-0 bg-slate-50 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FindingList
            isLoading={isLoading}
            isContract={isContract}
            notContractReason={notContractReason}
            totalAnalyzed={totalAnalyzed}
            reasoningError={reasoningError}
            findings={findings}
            activeFinding={activeFinding}
            onSelectFinding={selectFromList}
          />
        </div>
      </div>

      {/* Mobile Finding Detail Drawer with Nested Legal References Drawer */}
      <MobileFindingDetailDrawer
        finding={drawerFinding}
        findingIndex={drawerFindingIndex}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />
    </div>
  );
}
