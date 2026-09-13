import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const Code2Icon = memo(({ className, ...props }: SvgProps) => {
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
        fontWeight="700"
        fontSize="12"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        &lt;/&gt;
      </text>
    </svg>
  )
})

Code2Icon.displayName = "Code2Icon"
