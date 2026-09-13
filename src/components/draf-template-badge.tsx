import React from "react";
import { cn } from "@/lib/utils";

export interface DraftTemplateBadgeProps {
  title?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function DraftTemplateBadge({
  title = "Jasa & Layanan Kreatif",
  icon,
  onClick,
  className,
  style,
}: DraftTemplateBadgeProps = {}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 cursor-pointer",
        className
      )}
    >
      {icon && (
        <span className="flex size-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="font-jakarta">{title}</span>
    </button>
  );
}
