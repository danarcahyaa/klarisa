import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ref, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-12 max-h-[140px] w-full resize-none overflow-y-auto rounded-md border border-slate-200 bg-white py-3.5 pl-3 pr-11 text-xs transition-all outline-none placeholder:text-slate-400 focus-visible:border-klarisa-secondary focus-visible:ring-2 focus-visible:ring-klarisa-secondary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:bg-input/30 dark:disabled:bg-input/80",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
