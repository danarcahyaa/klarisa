"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AIChatBoxProps {
  /** Whether the chat has active messages, increasing minimum height */
  hasMassage?: boolean;
  /** Controlled input value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Callback fired when textarea value changes */
  onChange?: (value: string) => void;
  /** Callback fired when user submits the message via Enter or send button */
  onSend?: (message: string) => void;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Whether the chatbox is disabled */
  disabled?: boolean;
  /** Whether a generation/submission is in progress */
  isLoading?: boolean;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Additional CSS classes for the textarea element */
  textareaClassName?: string;
  /** Additional CSS classes for the send button */
  buttonClassName?: string;
  /** Maximum height utility class for the textarea (default: max-h-48) */
  maxHeightClass?: string;
  /** Auto-focus the textarea on mount */
  autoFocus?: boolean;
  /** Accessible label for the send button */
  sendAriaLabel?: string;
  /** Optional ID for the textarea element */
  id?: string;
  /** Optional name for the textarea element */
  name?: string;
}

export interface AIChatBoxRef {
  /** Focus the underlying textarea */
  focus: () => void;
  /** Underlying HTMLTextAreaElement reference */
  textarea: HTMLTextAreaElement | null;
  /** Reset/clear the input value */
  clear: () => void;
}

/**
 * AIChatBox component:
 * - Single-line initial height (40px-44px) that auto-expands with content.
 * - Caps at maximum height (default `max-h-48`) with `overflow-y-auto`.
 * - Inner right-aligned send button with ArrowLeft icon.
 * - Disabled when textarea has only whitespace.
 * - Enter sends message, Shift+Enter inserts newline.
 * - Clean focus outline handling with smooth container border transitions.
 */
export const AIChatBox = forwardRef<AIChatBoxRef, AIChatBoxProps>(
  (
    {
      value: controlledValue,
      defaultValue = "",
      onChange,
      onSend,
      placeholder = "Ketik draft kontrak yang Anda inginkan...",
      disabled = false,
      isLoading = false,
      className,
      textareaClassName,
      buttonClassName,
      maxHeightClass = "max-h-75",
      autoFocus = false,
      sendAriaLabel = "Kirim pesan",
      id,
      name,
      hasMassage = false,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentValue = isControlled ? controlledValue : internalValue;
    const isSubmitDisabled = disabled || isLoading || !currentValue.trim();

    // Adjust height dynamically based on scrollHeight
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto first so shrinking text calculates scrollHeight correctly
      textarea.style.height = "auto";

      // Set to scrollHeight; CSS max-h-* handles the visual clamp and scrollbar
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

    // Adjust textarea height whenever the text content changes or hasMassage toggles
    useEffect(() => {
      adjustHeight();
    }, [currentValue, hasMassage, adjustHeight]);

    // Expose imperative methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        focus: () => textareaRef.current?.focus(),
        textarea: textareaRef.current,
        clear: () => {
          if (!isControlled) {
            setInternalValue("");
          }
          onChange?.("");
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        },
      }),
      [isControlled, onChange]
    );

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextVal = e.target.value;
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      onChange?.(nextVal);
    };

    const handleSend = () => {
      const trimmed = currentValue.trim();
      if (!trimmed || disabled || isLoading) return;

      onSend?.(trimmed);

      // Reset internal value if uncontrolled
      if (!isControlled) {
        setInternalValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ignore keydown during IME composition (for non-Latin keyboards)
      if (e.nativeEvent.isComposing) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div
        className={cn(
          "group relative flex w-full items-end gap-2 rounded-xl border border-slate-300 bg-white p-1.5 shadow-2xs transition-all duration-300 ease-in-out",
          disabled && "bg-slate-50/70 opacity-70",
          className
        )}
      >
        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          rows={1}
          value={currentValue}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            hasMassage ? "min-h-[100px]" : "min-h-[40px]",
            "w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 placeholder:text-slate-400",
            "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
            "overflow-y-auto no-scrollbar",
            "transition-[min-height,height] duration-300 ease-in-out",
            maxHeightClass,
            disabled && "cursor-not-allowed",
            textareaClassName
          )}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={isSubmitDisabled}
          aria-label={sendAriaLabel}
          className={cn(
            "mb-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
            isSubmitDisabled
              ? "cursor-not-allowed bg-slate-50 text-slate-400"
              : "bg-klarisa-primary text-white shadow-xs hover:bg-slate-800 active:scale-95",
            buttonClassName
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </button>
      </div>
    );
  }
);

AIChatBox.displayName = "AIChatBox";
export default AIChatBox;
