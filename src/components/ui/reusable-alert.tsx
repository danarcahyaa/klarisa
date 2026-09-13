"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type AlertVariant = "default" | "destructive" | "error" | "success" | "warning" | "info";

export interface ReusableAlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Alert visual variant style (includes "error" and "warning") */
  variant?: AlertVariant;
  /** Main title of the alert banner */
  title?: React.ReactNode;
  /** Detailed description body text or content */
  description?: React.ReactNode;
  /** Custom icon or boolean flag to enable/disable default variant icon */
  icon?: React.ReactNode | boolean;
  /** Action node rendered on the right side of the alert (e.g. button) */
  action?: React.ReactNode;
  /** Callback fired when dismiss button is clicked */
  onDismiss?: () => void;
  /** Show dismiss close button */
  dismissible?: boolean;
}

const DEFAULT_ICONS: Record<AlertVariant, React.ReactNode> = {
  default: <Info className="size-4" />,
  info: <Info className="size-4 text-blue-600 dark:text-blue-400" />,
  warning: <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />,
  destructive: <AlertCircle className="size-4 text-red-600 dark:text-red-400" />,
  error: <AlertCircle className="size-4 text-red-600 dark:text-red-400" />,
  success: <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
};

/**
 * Reusable alert banner component supporting error, warning, info, success, and default variants.
 */
export const ReusableAlert = React.forwardRef<HTMLDivElement, ReusableAlertProps>(
  (
    {
      variant = "default",
      title,
      description,
      children,
      icon = true,
      action,
      onDismiss,
      dismissible = false,
      className,
      ...props
    },
    ref
  ) => {
    const alertVariant =
      variant === "info" ? "default" : variant === "error" ? "destructive" : variant;

    let iconElement: React.ReactNode = null;
    if (typeof icon === "boolean") {
      if (icon) {
        iconElement = DEFAULT_ICONS[variant] ?? DEFAULT_ICONS.default;
      }
    } else {
      iconElement = icon;
    }

    const content = description ?? children;

    return (
      <Alert
        ref={ref}
        variant={alertVariant}
        className={cn(
          "relative flex items-start gap-3 p-3",
          variant === "info" &&
            "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300",
          className
        )}
        {...props}
      >
        {iconElement && <div className="shrink-0 mt-0.5">{iconElement}</div>}

        <div className="flex-1 min-w-0">
          {title && <AlertTitle className="font-medium text-sm">{title}</AlertTitle>}
          {content && (
            <AlertDescription className="text-xs leading-relaxed opacity-80">
              {content}
            </AlertDescription>
          )}
        </div>

        {action && <div className="shrink-0 ml-2">{action}</div>}

        {(dismissible || onDismiss) && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            className="shrink-0 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </Alert>
    );
  }
);

ReusableAlert.displayName = "ReusableAlert";
