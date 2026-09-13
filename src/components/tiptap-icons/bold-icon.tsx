import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const BoldIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <text
        x="50%"
        y="53%"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-dm), system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="20"
        fill="currentColor"
      >
        B
      </text>
    </svg>
  )
})

BoldIcon.displayName = "BoldIcon"
