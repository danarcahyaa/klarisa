"use client";

import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface ReviewPrepareStepProps {
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Optional custom preparation message */
  message?: string;
}

/**
 * Step 1 component for clause review popover:
 * Displays a centered loading spinner while the review process is being initialized.
 */
export function ReviewPrepareStep({
  className,
  message = "Review sedang disiapkan",
}: ReviewPrepareStepProps) {
  return (
    <div
      className={cn(
        "min-h-[175px] flex flex-col items-center justify-center py-6 px-4 text-center animate-in fade-in zoom-in-95 duration-200",
        className
      )}
    >
      <Spinner size="lg" className="mb-3" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-200">
        {message}
      </p>
    </div>
  );
}
