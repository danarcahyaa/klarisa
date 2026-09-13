import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const HeadingIcon = memo(({ className, ...props }: SvgProps) => {
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
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fontFamily="var(--font-dm), var(--font-sans), sans-serif"
        fill="currentColor"
      >
        H
      </text>
    </svg>
  )
})

HeadingIcon.displayName = "HeadingIcon"
