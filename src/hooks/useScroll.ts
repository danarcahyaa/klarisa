"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Helper to find the nearest scrollable parent element or window.
 */
export function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
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

export interface UseScrollOptions {
  hasMessages: boolean;
  messagesLength?: number;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export interface UseScrollReturn {
  bottomAnchorRef: React.RefObject<HTMLDivElement | null>;
  showScrollBottom: boolean;
  handleScrollToBottom: () => void;
  checkScroll: () => void;
}

/**
 * Custom hook dedicated to managing scroll interactions:
 * - Detects distance to the bottom of the chat container.
 * - Manages visibility of the 'Scroll to bottom' floating button (`showScrollBottom`).
 * - Smoothly scrolls to `messagesEndRef`.
 */
export function useScroll({
  hasMessages,
  messagesLength = 0,
  messagesEndRef,
}: UseScrollOptions): UseScrollReturn {
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    if (!hasMessages || typeof window === "undefined") {
      setShowScrollBottom(false);
      return;
    }

    const scrollTarget = bottomAnchorRef.current
      ? getScrollParent(bottomAnchorRef.current)
      : window;

    if (scrollTarget instanceof HTMLElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollTarget;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollBottom(distanceFromBottom > 150);
    } else {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = docHeight - scrollY - windowHeight;
      setShowScrollBottom(distanceFromBottom > 150);
    }
  }, [hasMessages]);

  useEffect(() => {
    if (!hasMessages || typeof window === "undefined") return;

    const scrollTarget = bottomAnchorRef.current
      ? getScrollParent(bottomAnchorRef.current)
      : window;

    const element = scrollTarget instanceof HTMLElement ? scrollTarget : window;

    element.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    checkScroll();

    return () => {
      element.removeEventListener("scroll", checkScroll);
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [hasMessages, checkScroll, messagesLength]);

  const handleScrollToBottom = useCallback(() => {
    setShowScrollBottom(false);
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  return {
    bottomAnchorRef,
    showScrollBottom,
    handleScrollToBottom,
    checkScroll,
  };
}
