"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { dispatchChatReset } from "@/lib/chat-events";

export interface UseCreateDraftNavigationReturn {
  /** Boolean state indicating whether navigation to clean create draft is in progress */
  isNavigatingToCreate: boolean;
  /** Handler function to navigate cleanly from detail chat to create draft */
  handleNavigateToCreateDraft: () => void;
}

/**
 * Custom React hook for navigating from detail chat to the draft creation view (/dashboard/create).
 * Manages transition state with useState (true/false) and dispatches chat session reset synchronously
 * to guarantee that the create draft view is immediately displayed without showing any skeleton.
 */
export function useCreateDraftNavigation(): UseCreateDraftNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigatingToCreate, setIsNavigatingToCreate] = useState<boolean>(false);

  const handleNavigateToCreateDraft = useCallback(() => {
    setIsNavigatingToCreate(true);
    // Synchronously clear active chat session so no stale messages or skeleton appear
    dispatchChatReset();
    router.push("/dashboard/create");
  }, [router]);

  // Turn off navigation state once clean /dashboard/create route is active
  useEffect(() => {
    const hasChatId = Boolean(searchParams?.get("chat_id") || searchParams?.get("id"));
    if (pathname === "/dashboard/create" && !hasChatId) {
      setIsNavigatingToCreate(false);
    }
  }, [pathname, searchParams]);

  return {
    isNavigatingToCreate,
    handleNavigateToCreateDraft,
  };
}
