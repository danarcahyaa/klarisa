"use client";

import { Check } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface RedirectingMarkerProps {
  /** Execution status for page redirection */
  status?: "processing" | "completed";
  /** Custom wrapper styling */
  className?: string;
}

/**
 * RedirectingMarker component displays feedback indicator when the review
 * process finishes and the UI is navigating to the analysis result page.
 */
export function RedirectingMarker({
  status = "processing",
  className,
}: RedirectingMarkerProps) {
  const isProcessing = status === "processing";

  return (
    <Marker role="status" className={cn("items-start", className)}>
      <MarkerIcon className="mt-1">
        {isProcessing ? (
          <Spinner />
        ) : (
          <Check className="size-4 text-klarisa-primary" />
        )}
      </MarkerIcon>
      <MarkerContent className="w-full">
        <div className="flex items-center text-lg text-slate-900">
          <span className={isProcessing ? "shimmer" : ""}>
            Halaman akan dialihkan
          </span>
        </div>
      </MarkerContent>
    </Marker>
  );
}
