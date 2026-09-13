"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import type { ChatMessageItem } from "@/types/draft.type";
import { Spinner } from "@/components/ui/spinner";
import TextChat from "./text-chat";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface ConversationListProps {
  messages: ChatMessageItem[];
  isLoading: boolean;
  streamingAiId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  if (!node || typeof window === "undefined") return window;
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return current;
    }
    current = current.parentElement;
  }
  return window;
}

/**
 * Message history list component displaying user prompts, AI responses,
 * and lazy pagination triggered when scrolling to the top for earlier messages.
 */
export function ConversationList({
  messages,
  isLoading,
  streamingAiId,
  messagesEndRef,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ConversationListProps) {
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);

  /**
   * Save scroll snapshot and invoke load more handler for earlier messages.
   */
  const triggerLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;

    const scrollTarget = topSentinelRef.current
      ? getScrollParent(topSentinelRef.current)
      : window;

    if (scrollTarget instanceof HTMLElement) {
      prevScrollHeightRef.current = scrollTarget.scrollHeight;
      prevScrollTopRef.current = scrollTarget.scrollTop;
    } else if (typeof window !== "undefined") {
      prevScrollHeightRef.current = document.documentElement.scrollHeight;
      prevScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
    }

    isPrependingRef.current = true;
    onLoadMore();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Preserve scroll position when older messages are prepended to the top
  useIsomorphicLayoutEffect(() => {
    if (!isPrependingRef.current) return;
    isPrependingRef.current = false;

    const scrollTarget = topSentinelRef.current
      ? getScrollParent(topSentinelRef.current)
      : window;

    if (scrollTarget instanceof HTMLElement) {
      const newScrollHeight = scrollTarget.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      if (heightDiff > 0) {
        scrollTarget.scrollTop = prevScrollTopRef.current + heightDiff;
      }
    } else if (typeof window !== "undefined") {
      const newScrollHeight = document.documentElement.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      if (heightDiff > 0) {
        window.scrollTo({
          top: prevScrollTopRef.current + heightDiff,
          behavior: "instant" as ScrollBehavior,
        });
      }
    }
  }, [messages]);

  // Trigger lazy loading when scrolling up reaches the top sentinel
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          triggerLoadMore();
        }
      },
      {
        rootMargin: "200px 0px 0px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore, triggerLoadMore]);

  // Fallback scroll listener on container/window to detect when scrolled near the top
  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore || typeof window === "undefined") return;

    const scrollTarget = topSentinelRef.current
      ? getScrollParent(topSentinelRef.current)
      : window;
    const element = scrollTarget instanceof HTMLElement ? scrollTarget : window;

    const handleScroll = () => {
      if (!hasMore || isLoadingMore) return;

      if (scrollTarget instanceof HTMLElement) {
        if (scrollTarget.scrollTop <= 120) {
          triggerLoadMore();
        }
      } else {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (scrollY <= 120) {
          triggerLoadMore();
        }
      }
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, isLoadingMore, onLoadMore, triggerLoadMore]);

  // Memoize rendered message list for smooth scrolling performance
  const memoizedMessages = useMemo(() => {
    return messages.map((msg) => (
      <TextChat
        key={msg.id}
        role={msg.role}
        content={msg.content}
        date={msg.date}
        className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out fill-mode-backwards"
      />
    ));
  }, [messages]);

  return (
    <div className="flex-1 space-y-6 mb-6 pr-1 animate-in fade-in duration-500">
      {/* Invisible sentinel for scroll-to-top lazy pagination */}
      {hasMore && !isLoadingMore && (
        <div ref={topSentinelRef} className="h-6 w-full pointer-events-none" aria-hidden="true" />
      )}

      {/* Top loading indicator when fetching earlier conversation pages */}
      {isLoadingMore && (
        <div className="py-2.5 flex justify-center items-center w-full animate-in fade-in duration-300 text-xs text-slate-400">
          <Spinner size="sm" className="size-3.5 animate-spin text-klarisa-primary" />
        </div>
      )}

      {memoizedMessages}

      {/* Spinner while AI is connecting or thinking before first chunk */}
      {isLoading && !streamingAiId && (
        <TextChat role="ai" className="animate-in fade-in duration-200">
          <Spinner size="sm" className="size-4 animate-spin text-klarisa-primary" />
        </TextChat>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ConversationList;
