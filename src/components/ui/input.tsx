import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-xs transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-xs placeholder:text-muted-foreground focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/20 focus-visible:border-klarisa-secondary focus-visible:ring-2 focus-visible:ring-klarisa-secondary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-4 aria-invalid:focus-visible:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
export { FormInput, type FormInputProps } from "./form-input"
