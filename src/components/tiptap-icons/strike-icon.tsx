import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const StrikeIcon = memo(({ className, ...props }: SvgProps) => {
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
        fontWeight="600"
        fontSize="20"
        fill="currentColor"
      >
        S
      </text>
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
})

StrikeIcon.displayName = "StrikeIcon"
