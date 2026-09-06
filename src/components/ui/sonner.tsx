"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Standard Shadcn UI Sonner Toaster component.
 * Uses default theme tokens (bg-background, text-foreground, border-border, bg-primary, bg-muted).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        style: {
          boxShadow: "none",
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border !shadow-none group-[.toaster]:!shadow-xs [box-shadow:xs!important] [--box-shadow:xs!important] text-xs font-sans",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs font-medium",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
