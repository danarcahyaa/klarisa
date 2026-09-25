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
    const [isMultiLine, setIsMultiLine] = useState(false);

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

      // Temporarily set height to auto first so shrinking text calculates scrollHeight correctly
      textarea.style.height = "auto";

      const scrollHeight = textarea.scrollHeight;
      const baseHeight = isSmall ? 52 : (hasMassage ? 60 : 26);
      const targetHeight = Math.max(scrollHeight, baseHeight);

      textarea.style.height = `${targetHeight}px`;

      // Multiline is triggered only when content requires more than base line
      const multilineThreshold = isSmall ? 52 : (hasMassage ? 60 : 34);
      const isContentMultiLine = targetHeight > multilineThreshold || currentValue.includes("\n");
      setIsMultiLine(isContentMultiLine);
    }, [isSmall, hasMassage, currentValue]);

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
          setIsMultiLine(false);
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
        setIsMultiLine(false);
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
          "group relative flex w-full gap-2 border bg-white transition-[border-color,box-shadow] duration-150 items-end",
          isSmall
            ? "min-h-[76px] sm:min-h-[82px] rounded-xl border-slate-200 p-2.5 sm:p-3"
            : hasMassage
            ? "min-h-[84px] sm:min-h-[92px] rounded-2xl border-slate-300 p-3 sm:p-3.5"
            : "min-h-[52px] sm:min-h-[56px] rounded-xl border-slate-300 px-3.5 py-2.5",
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
            "w-full resize-none border-0 bg-transparent text-slate-800 placeholder:text-slate-400",
            "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
            "overflow-y-auto no-scrollbar",
            isSmall
              ? "min-h-[52px] sm:min-h-[58px] py-1 px-1 text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm leading-relaxed"
              : hasMassage
              ? "min-h-[60px] sm:min-h-[68px] py-1 px-1.5 text-sm placeholder:text-sm leading-relaxed"
              : "min-h-[26px] py-1 px-1 text-sm placeholder:text-sm leading-6",
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
            "inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150 self-end",
            isSmall ? "size-8 mb-0.5" : hasMassage ? "size-9 mb-0.5" : "size-8 mb-0.5",
            isSubmitDisabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "cursor-pointer bg-klarisa-primary text-white shadow-xs active:scale-95 hover:bg-klarisa-primary/90",
            buttonClassName
          )}
        >
          {isLoading ? (
            <Pause className={cn(isSmall ? "size-3.5" : "size-4", "fill-current")} />
          ) : (
            <ArrowRight className={cn(isSmall ? "size-3.5 sm:size-4" : "size-4")} />
          )}
        </button>
      </div>
    );
  }
);

AIChatBox.displayName = "AIChatBox";
export default AIChatBox;
