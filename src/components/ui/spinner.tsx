import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "default" | "lg"
}

const sizeClasses = {
  xs: "size-3",
  sm: "size-4",
  default: "size-5",
  lg: "size-6",
}

export function Spinner({ className, size = "sm", ...props }: SpinnerProps) {
  return (
    <div role="status" className={cn("inline-flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin text-klarisa-primary", sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
