"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ConversationSkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder simulating a chat conversation thread
 * while chat details and message history are being fetched.
 */
export function ConversationSkeleton({ className }: ConversationSkeletonProps) {
  return (
    <div
      className={cn(
        "flex-1 space-y-7 mb-6 pr-1 w-full",
        className
      )}
    >
      {/* 1. User Prompt Bubble Skeleton (aligned right) */}
      <div className="flex w-full justify-end">
        <div className="flex flex-col items-end max-w-[85%]">
          <div className="rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 shadow-xs">
            <Skeleton className="h-4 w-48 sm:w-64" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* 2. AI Response Skeleton (aligned left) */}
      <div className="flex w-full justify-start">
        <div className="flex flex-col w-full items-start space-y-2.5">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-1/2 rounded mb-2" />
          <div className="mt-1.5 flex items-center gap-1.5">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* 3. Follow-up User Prompt Bubble Skeleton (aligned right) */}
      <div className="flex w-full justify-end">
        <div className="flex flex-col items-end max-w-[85%]">
          <div className="rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 shadow-xs space-y-1.5">
            <Skeleton className="h-4 w-40 sm:w-52" />
            <Skeleton className="h-4 w-28 sm:w-36" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* 4. Follow-up AI Response Skeleton (aligned left) */}
      <div className="flex w-full justify-start">
        <div className="flex flex-col w-full items-start space-y-2.5">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <div className="mt-1.5 flex items-center gap-1.5">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationSkeleton;
