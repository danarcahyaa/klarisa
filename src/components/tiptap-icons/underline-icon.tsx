import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const UnderlineIcon = memo(({ className, ...props }: SvgProps) => {
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
        y="45%"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-dm), system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="16"
        fill="currentColor"
      >
        U
      </text>
      <line
        x1="5"
        y1="19.5"
        x2="19"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
})

UnderlineIcon.displayName = "UnderlineIcon"
