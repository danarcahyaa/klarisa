"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface FormInputProps extends React.ComponentProps<"input"> {
  /** Label text to display above the input */
  label?: React.ReactNode
  /** Helper text or badge next to the label */
  labelSubtext?: React.ReactNode
  /** Helper text displayed below the input */
  helperText?: React.ReactNode
  /** Error message displayed below the input in red */
  error?: string
  /** Icon element positioned INSIDE the left of the input */
  leftIcon?: React.ReactNode
  /** Icon element positioned INSIDE the right of the input (e.g. password eye) */
  rightIcon?: React.ReactNode
  /** Click handler specifically for the right icon */
  onRightIconClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
  /** ClassName for the outer container wrapper */
  containerClassName?: string
  /** ClassName for the input element itself */
  inputClassName?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      labelSubtext,
      helperText,
      error,
      leftIcon,
      rightIcon,
      onRightIconClick,
      containerClassName,
      inputClassName,
      className,
      required,
      disabled,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    const handleRightIconClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      if (disabled) return
      if (onRightIconClick) {
        e.stopPropagation()
        onRightIconClick(e)
      }
    }

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {/* Label & Label Subtext */}
        {label && (
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <label htmlFor={inputId} className="cursor-pointer flex items-center gap-1">
              <span>{label}</span>
              {required && <span className="text-destructive font-bold">*</span>}
            </label>
            {labelSubtext && <span className="text-sm font-normal text-muted-foreground">{labelSubtext}</span>}
          </div>
        )}

        {/* Input Wrapper with Absolute Icons */}
        <div className="relative flex items-center w-full">
          {/* Left Icon Inside Input (Neutral border/muted color) */}
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10 flex items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Core Shadcn Input Component */}
          <Input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            style={{
              paddingLeft: leftIcon ? "2.5rem" : undefined,
              paddingRight: rightIcon ? "2.5rem" : undefined,
              ...props.style,
            }}
            className={cn(
              leftIcon ? "!pl-10" : "px-3",
              rightIcon ? "!pr-10" : "px-3",
              error && "border-destructive focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive/50",
              inputClassName,
              className
            )}
            {...props}
          />

          {/* Right Icon Inside Input (Neutral border/muted color) */}
          {rightIcon && (
            <div
              onClick={handleRightIconClick}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 flex items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0 transition-colors",
                onRightIconClick && !disabled
                  ? "cursor-pointer hover:text-foreground p-0.5 rounded hover:bg-muted/60"
                  : "pointer-events-none"
              )}
              role={onRightIconClick && !disabled ? "button" : undefined}
              tabIndex={onRightIconClick && !disabled ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRightIconClick && !disabled && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  e.stopPropagation()
                  onRightIconClick(e as unknown as React.MouseEvent<HTMLSpanElement>)
                }
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message or Helper Text */}
        {error ? (
          <p className="text-xs font-medium text-destructive">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

FormInput.displayName = "FormInput"
