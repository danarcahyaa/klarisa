"use client";

import React from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AgentEmptyStateProps {
  /** Callback fired when user clicks the search conversation button */
  onSearchClick?: () => void;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Dedicated empty state component for the draft editor AI Agent panel.
 * Displays Klarisa branding, contextual helper text, and a search button.
 */
export function AgentEmptyState({
  onSearchClick,
  className,
}: AgentEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center w-full max-w-sm px-2 mx-auto transition-all duration-500 ease-in-out",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Image
          src="/klarisa/logo-ai.svg"
          alt="Klarisa AI"
          width={28}
          height={28}
          priority
          className="size-7 object-contain"
        />
        <h3 className="font-semibold font-heading text-slate-800 text-xl sm:text-2xl dark:text-slate-100">
          Klarisa
        </h3>
      </div>

      <p className="text-slate-500 text-sm sm:text-xs leading-relaxed max-w-[340px] dark:text-slate-400">
        Klarisa dapat membantu Anda untuk menyusun draft Anda.
      </p>

      {/* Dedicated search conversation button */}
      <Button
        className="mt-3.5 h-8 px-3.5 text-xs font-medium gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        type="button"
        variant="outline"
        size="sm"
        onClick={onSearchClick}
      >
        <Search className="size-3.5 text-slate-400" />
        <span>Cari percakapan</span>
      </Button>
    </div>
  );
}
