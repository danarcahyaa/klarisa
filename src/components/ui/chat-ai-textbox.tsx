"use client"

import * as React from "react"
import { SendHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/button"
import { Textarea } from "./textarea"

export interface ChatAiTextboxProps extends Omit<React.ComponentProps<"textarea">, "onSubmit"> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit?: (e?: React.FormEvent) => void
  isSending?: boolean
  maxHeight?: number
  containerClassName?: string
  submitButtonClassName?: string
  icon?: React.ReactNode
}

export const ChatAiTextbox = React.forwardRef<HTMLTextAreaElement, ChatAiTextboxProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      isSending = false,
      maxHeight = 140,
      containerClassName,
      submitButtonClassName,
      className,
      disabled,
      placeholder = "Tanyakan sesuatu...",
      icon,
      onKeyDown,
      rows = 1,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement | null>) || internalRef

    React.useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
      }
    }, [value, maxHeight, textareaRef])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !disabled && !isSending) {
          onSubmit?.()
        }
      }
    }

    return (
      <div
        className={cn(
          "relative flex min-h-12 items-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-11 transition-all focus-within:border-klarisa-secondary focus-within:ring-2 focus-within:ring-klarisa-secondary/20",
          containerClassName
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          rows={rows}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className={cn(
            "min-h-6 max-h-[140px] w-full resize-none overflow-y-auto border-0 bg-transparent px-0 py-0.5 text-xs leading-relaxed shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent placeholder:text-slate-400 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            className
          )}
          {...props}
        />
        <SubmitButton
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={() => onSubmit?.()}
          disabled={!value.trim() || disabled || isSending}
          aria-label="Kirim pertanyaan"
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 text-slate-400 hover:text-slate-700 disabled:opacity-40",
            value.trim().length > 40 && "top-auto bottom-2.5 translate-y-0",
            submitButtonClassName
          )}
        >
          {icon || <SendHorizontal className="size-3.5" />}
        </SubmitButton>
      </div>
    )
  }
)

ChatAiTextbox.displayName = "ChatAiTextbox"

export const AIChatBot = ChatAiTextbox

