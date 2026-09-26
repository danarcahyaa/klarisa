"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Item configuration for popover menu actions.
 */
export interface PopoverActionItem {
  /** Text or label displayed for the item */
  text: React.ReactNode;
  /** Optional icon rendered on the left side of text */
  icon?: React.ReactNode;
  /** Callback fired when the item is clicked */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Visual variant: default or destructive (red) */
  variant?: "default" | "destructive";
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether clicking this item should automatically close the popover. Defaults to true. */
  closeOnClick?: boolean;
  /** Optional trailing element (e.g. badge, chevron, shortcut) */
  trailing?: React.ReactNode;
  /** Optional custom CSS classes for the item button */
  className?: string;
}

export interface ActionPopoverProps {
  /** Trigger element that toggles the popover */
  trigger: React.ReactNode;
  /** List of action items to render */
  items: PopoverActionItem[];
  /**
   * Optional footer section. Can be an array of PopoverActionItem,
   * a single PopoverActionItem, or a custom ReactNode.
   * Rendered below the primary items with a visual separator.
   */
  footer?: PopoverActionItem | PopoverActionItem[] | React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Initial open state for uncontrolled usage */
  defaultOpen?: boolean;
  /** Callback fired when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Popover alignment relative to trigger */
  align?: "start" | "center" | "end";
  /** Popover preferred side relative to trigger */
  side?: "top" | "right" | "bottom" | "left";
  /** Distance in pixels between popover and trigger */
  sideOffset?: number;
  /** Whether the popover behaves modally. When true, prevents interaction with outside elements. */
  modal?: boolean;
  /** Custom CSS classes for PopoverContent */
  className?: string;
  /** Custom CSS classes for the items list wrapper */
  itemsClassName?: string;
  /** Custom CSS classes for the footer wrapper */
  footerClassName?: string;
}

/**
 * Type guard to verify if a given value matches PopoverActionItem structure.
 */
function isPopoverActionItem(value: unknown): value is PopoverActionItem {
  return (
    typeof value === "object" &&
    value !== null &&
    !React.isValidElement(value) &&
    "text" in value
  );
}

/**
 * Reusable popover component that accepts structured action items (with optional icons)
 * and an optional footer section separated by a divider.
 */
export function ActionPopover({
  trigger,
  items,
  footer,
  open,
  defaultOpen = false,
  onOpenChange,
  align = "start",
  side,
  sideOffset = 6,
  modal,
  className,
  itemsClassName,
  footerClassName,
}: ActionPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const renderItem = (item: PopoverActionItem, key: React.Key) => {
    const isDestructive = item.variant === "destructive";

    return (
      <button
        key={key}
        type="button"
        disabled={item.disabled}
        onClick={(e) => {
          item.onClick?.(e);
          if (item.closeOnClick !== false) {
            handleOpenChange(false);
          }
        }}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors outline-none",
          isDestructive
            ? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          item.disabled && "pointer-events-none opacity-50 cursor-not-allowed",
          item.className
        )}
      >
        {item.icon && (
          <span
            className={cn(
              "shrink-0 inline-flex items-center justify-center [&_svg]:size-3.5",
              isDestructive
                ? "text-red-500"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {item.icon}
          </span>
        )}
        <span className="flex-1 truncate">{item.text}</span>
        {item.trailing && (
          <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
            {item.trailing}
          </span>
        )}
      </button>
    );
  };

  const renderFooter = () => {
    if (!footer) return null;

    if (Array.isArray(footer)) {
      if (footer.length === 0) return null;
      return (
        <>
          <div
            role="separator"
            className="my-1 -mx-1 border-t border-slate-100 dark:border-slate-800"
          />
          <div className={cn("flex flex-col gap-0.5", footerClassName)}>
            {footer.map((item, idx) => renderItem(item, `footer-${idx}`))}
          </div>
        </>
      );
    }

    if (isPopoverActionItem(footer)) {
      return (
        <>
          <div
            role="separator"
            className="my-1 -mx-1 border-t border-slate-100 dark:border-slate-800"
          />
          <div className={cn("flex flex-col gap-0.5", footerClassName)}>
            {renderItem(footer, "footer-0")}
          </div>
        </>
      );
    }

    return (
      <>
        <div
          role="separator"
          className="my-1 -mx-1 border-t border-slate-100 dark:border-slate-800"
        />
        <div
          className={cn(
            "px-1 py-1 text-slate-500 dark:text-slate-400",
            footerClassName
          )}
        >
          {footer}
        </div>
      </>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={modal}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-20 w-44 px-1 py-1.5 rounded-lg border border-slate-200 bg-white shadow-md text-xs font-medium dark:border-slate-800 dark:bg-slate-900",
          className
        )}
      >
        {/* Primary Action Items List */}
        <div className={cn("flex flex-col cursor-pointer gap-0.5", itemsClassName)}>
          {items.map((item, index) => renderItem(item, index))}
        </div>

        {/* Footer Section with Separator */}
        {renderFooter()}
      </PopoverContent>
    </Popover>
  );
}

// Aliases for convenience
export { ActionPopover as ReusablePopover };
export type { ActionPopoverProps as ReusablePopoverProps };
export type { PopoverActionItem as PopoverItem };
