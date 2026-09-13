import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const SubscriptIcon = memo(({ className, ...props }: SvgProps) => {
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
        x="8"
        y="11"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-dm), system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="20"
        fill="currentColor"
      >
        x
      </text>
      <text
        x="18"
        y="17"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-dm), system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="10"
        fill="currentColor"
      >
        2
      </text>
    </svg>
  )
})

SubscriptIcon.displayName = "SubscriptIcon"
