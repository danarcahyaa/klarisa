import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const HeadingSixIcon = memo(({ className, ...props }: SvgProps) => {
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
        y="17"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fontFamily="var(--font-dm), var(--font-sans), sans-serif"
        fill="currentColor"
      >
        H
      </text>
      <text
        x="18"
        y="18"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="var(--font-dm), var(--font-sans), sans-serif"
        fill="currentColor"
      >
        6
      </text>
    </svg>
  )
})

HeadingSixIcon.displayName = "HeadingSixIcon"
