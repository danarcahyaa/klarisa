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
        "flex flex-col items-center text-center w-full max-w-sm transition-all duration-500 ease-in-out",
        className
      )}
    >
      <div className="flex items-start justify-center gap-2 mb-1.5">
        <Image
          src="/klarisa/logo-ai.svg"
          alt="Klarisa AI"
          width={24}
          height={24}
          priority
        />
        <h3 className="font-semibold font-heading text-slate-800 text-xl dark:text-slate-100">
          Klarisa
        </h3>
      </div>

      <p className="text-slate-500 text-xs leading-relaxed max-w-xs dark:text-slate-400">
        Tanyakan saran penulisan klausul atau lengkapi draf kontrak Anda.
      </p>

      {/* Dedicated search conversation button */}
      <Button
      className="mt-1.5"
        type="button"
        variant={"outline"}
        size="xs"
        onClick={onSearchClick}

      >
        <Search className="size-2.5" />
        <span className="text-slate-500">Cari percakapan</span>
      </Button>
    </div>
  );
}
