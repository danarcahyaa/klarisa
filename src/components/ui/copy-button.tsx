"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

export interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "onCopy"> {
  valueToCopy: string
  copiedDuration?: number
  onCopy?: (copiedText: string) => void
  iconClassName?: string
  copiedIconClassName?: string
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      valueToCopy,
      copiedDuration = 2000,
      onCopy,
      className,
      iconClassName,
      copiedIconClassName,
      variant = "ghost",
      size = "icon-xs",
      type = "button",
      "aria-label": ariaLabel = "Salin teks",
      title = "Salin teks",
      ...props
    },
    ref
  ) => {
    const [isCopied, setIsCopied] = React.useState(false)

    const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (!valueToCopy) return

      try {
        await navigator.clipboard.writeText(valueToCopy)
        setIsCopied(true)
        onCopy?.(valueToCopy)

        setTimeout(() => {
          setIsCopied(false)
        }, copiedDuration)
      } catch (err) {
        console.error("Failed to copy text: ", err)
      }
    }

    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        onClick={handleCopy}
        title={isCopied ? "Berhasil disalin" : title}
        aria-label={isCopied ? "Berhasil disalin" : ariaLabel}
        className={cn(
          "grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer",
          isCopied && "text-emerald-600 hover:text-emerald-700",
          className
        )}
        {...props}
      >
        {isCopied ? (
          <Check className={cn("size-3 text-emerald-600 animate-in fade-in zoom-in-75 duration-150", copiedIconClassName)} />
        ) : (
          <Copy className={cn("size-3", iconClassName)} />
        )}
      </Button>
    )
  }
)

CopyButton.displayName = "CopyButton"
