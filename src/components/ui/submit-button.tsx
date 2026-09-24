"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SubmitButtonProps extends ButtonProps {
  /** Indicates whether the button is in a loading/submitting state */
  isLoading?: boolean
  /** Text to display while loading. If omitted, original children will be rendered */
  loadingText?: React.ReactNode
  /** Icon element to render on the left side of the button text */
  leftIcon?: React.ReactNode
  /** Icon element to render on the right side of the button text (e.g. password toggle eye) */
  rightIcon?: React.ReactNode
  /** Click handler specifically for the right icon (e.g. toggle password visibility) */
  onRightIconClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
  /** Custom class for the right icon wrapper */
  rightIconClassName?: string
}

export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  (
    {
      children,
      className,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      rightIconClassName,
      disabled,
      type = "submit",
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading
    const isIconOnly = typeof size === "string" && size.startsWith("icon")

    const handleRightIconClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isDisabled) return
      if (onRightIconClick) {
        e.stopPropagation()
        onRightIconClick(e)
      }
    }

    const spinnerSize =
      size === "icon-xs"
        ? "size-3"
        : size === "icon-sm"
        ? "size-3.5"
        : "size-4"

    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        disabled={isDisabled}
        className={cn("relative inline-flex items-center justify-center gap-2", className)}
        {...props}
      >
        {isIconOnly ? (
          isLoading ? (
            <Loader2 className={cn(spinnerSize, "animate-spin shrink-0")} aria-hidden="true" />
          ) : (
            children
          )
        ) : (
          <>
            {/* Left Icon or Spinner */}
            {isLoading ? (
              <Loader2 className="size-4 animate-spin shrink-0" aria-hidden="true" />
            ) : (
              leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
            )}

            {/* Content / Text */}
            <span className="truncate">
              {isLoading && loadingText ? loadingText : children}
            </span>

            {/* Right Icon (e.g., Password Eye, Arrow) */}
            {!isLoading && rightIcon && (
              <span
                onClick={handleRightIconClick}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center transition-opacity",
                  onRightIconClick ? "cursor-pointer hover:opacity-80 p-0.5 -mr-1" : "pointer-events-none",
                  rightIconClassName
                )}
                role={onRightIconClick ? "button" : undefined}
                tabIndex={onRightIconClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRightIconClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    e.stopPropagation()
                    onRightIconClick(e as unknown as React.MouseEvent<HTMLSpanElement>)
                  }
                }}
              >
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Button>
    )
  }
)

SubmitButton.displayName = "SubmitButton"
