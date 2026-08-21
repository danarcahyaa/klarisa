"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChevronButtonProps extends Omit<ButtonProps, "onToggle"> {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const ChevronButton = React.forwardRef<HTMLButtonElement, ChevronButtonProps>(
  (
    {
      children = "Toggle Menu",
      isOpen: externalIsOpen,
      onOpenChange,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const [internalIsOpen, setInternalIsOpen] = React.useState(false)
    const isControlled = externalIsOpen !== undefined
    const open = isControlled ? externalIsOpen : internalIsOpen

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const nextState = !open
      if (!isControlled) {
        setInternalIsOpen(nextState)
      }
      onOpenChange?.(nextState)
      onClick?.(e)
    }

    const radixState = props["data-state" as keyof typeof props]
    const isRadixOpen = radixState === "open"
    const isChevronRotated = Boolean(open || isRadixOpen)

    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn("group/chevron-btn gap-2 select-none", className)}
        onClick={handleClick}
        aria-expanded={isChevronRotated}
        data-state={isChevronRotated ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out group-data-[state=open]/chevron-btn:rotate-180 group-data-[state=open]/button:rotate-180",
            isChevronRotated && "rotate-180"
          )}
        />
      </Button>
    )
  }
)
ChevronButton.displayName = "ChevronButton"

export { ChevronButton }
