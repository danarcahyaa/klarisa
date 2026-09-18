"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ArrowRight, Pause } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AIChatBoxProps {
  /** Size/layout variant of the chatbox: 'default' for standard size, 'small' or 'sm' for compact sidebars */
  variant?: "default" | "small" | "sm";
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
  /** Callback fired when user stops the active AI generation */
  onStop?: () => void;
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
  /** Accessible label for the stop button */
  stopAriaLabel?: string;
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
 * - Single-line initial height that auto-expands with content.
 * - Caps at maximum height with `overflow-y-auto`.
 * - Inner right-aligned send button with ArrowRight icon.
 * - Supports 'default' and 'small' ('sm') size variants.
 * - Disabled when textarea has only whitespace.
 * - Enter sends message, Shift+Enter inserts newline.
 * - Clean focus outline handling with smooth container border transitions.
 */
export const AIChatBox = forwardRef<AIChatBoxRef, AIChatBoxProps>(
  (
    {
      variant = "default",
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
      stopAriaLabel = "Hentikan respons",
      onStop,
      id,
      name,
      hasMassage = false,
    },
    ref
  ) => {
    const isSmall = variant === "small" || variant === "sm";
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isMultiLine, setIsMultiLine] = useState(hasMassage);

    const currentValue = isControlled ? controlledValue : internalValue;
    const isSubmitDisabled = isLoading ? (disabled || !onStop) : (disabled || !currentValue.trim());

    useEffect(() => {
      console.log(
        `[AIChatBox] State -> isLoading: ${isLoading}, isSubmitDisabled: ${isSubmitDisabled}, currentValue: "${currentValue}", disabled: ${disabled}`
      );
    }, [isLoading, isSubmitDisabled, currentValue, disabled]);

    // Adjust height dynamically based on scrollHeight
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto first so shrinking text calculates scrollHeight correctly
      textarea.style.height = "auto";

      const scrollHeight = textarea.scrollHeight;
      // Set to scrollHeight; CSS max-h-* handles the visual clamp and scrollbar
      if (isSmall) {
        textarea.style.height = `${Math.max(scrollHeight, 48)}px`;
      } else {
        textarea.style.height = `${scrollHeight}px`;
      }

      const threshold = isSmall ? 52 : 40;
      setIsMultiLine(hasMassage || scrollHeight > threshold);
    }, [hasMassage, isSmall]);

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
          setIsMultiLine(hasMassage);
        },
      }),
      [isControlled, onChange, hasMassage]
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
        setIsMultiLine(hasMassage);
      }
    };

    const handleButtonClick = () => {
      console.log(`[AIChatBox] Button clicked. isLoading: ${isLoading}, isSubmitDisabled: ${isSubmitDisabled}`);
      if (isLoading) {
        onStop?.();
        return;
      }
      handleSend();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ignore keydown during IME composition (for non-Latin keyboards)
      if (e.nativeEvent.isComposing) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading) {
          handleSend();
        }
      }
    };

    return (
      <div
        className={cn(
          "group relative flex w-full gap-2 border bg-white transition-all duration-200 ease-in-out",
          isSmall
            ? "min-h-[76px] rounded-lg border-slate-200 p-2.5 items-center"
            : (isMultiLine ? "min-h-[52px] rounded-lg border-slate-300 p-1.5 items-end" : "min-h-[52px] rounded-xl border-slate-300 p-1.5 items-center"),
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
            isSmall
              ? "self-stretch flex-1 min-h-[48px] pt-1 px-2 text-xs placeholder:text-xs leading-5"
              : (isMultiLine ? "min-h-[100px] py-2" : "min-h-[26px] py-1 leading-6"),
            !isSmall && "px-2.5 text-sm placeholder:text-sm",
            "w-full resize-none border-0 bg-transparent text-slate-800 placeholder:text-slate-400",
            "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
            "overflow-y-auto no-scrollbar",
            "transition-[min-height,height] duration-200 ease-in-out",
            maxHeightClass,
            disabled && "cursor-not-allowed",
            textareaClassName
          )}
        />

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isSubmitDisabled}
          aria-label={isLoading ? stopAriaLabel : sendAriaLabel}
          title={isLoading ? stopAriaLabel : sendAriaLabel}
          className={cn(
            "inline-flex shrink-0 items-center justify-center transition-all duration-150",
            isSmall
              ? (isMultiLine ? "mb-0.5 self-end size-7 rounded-md" : "self-center size-8 rounded-xl")
              : (isMultiLine ? "mb-0.5 self-end size-9 rounded-md" : "self-center size-9 rounded-lg"),
            isSubmitDisabled
              ? "cursor-not-allowed bg-slate-50 text-slate-400"
              : "cursor-pointer bg-klarisa-primary text-white shadow-xs active:scale-95",
            buttonClassName
          )}
        >
          {isLoading ? (
            <Pause className={cn(isSmall ? "size-3.5" : "size-4", "fill-current")} />
          ) : (
            <ArrowRight className={isSmall ? "size-3" : "size-4"} />
          )}
        </button>
      </div>
    );
  }
);

AIChatBox.displayName = "AIChatBox";
export default AIChatBox;
