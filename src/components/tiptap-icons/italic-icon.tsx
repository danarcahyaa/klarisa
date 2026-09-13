import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const ItalicIcon = memo(({ className, ...props }: SvgProps) => {
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
        fontStyle="italic"
        fontWeight="600"
        fontSize="20"
        fill="currentColor"
      >
        I
      </text>
    </svg>
  )
})

ItalicIcon.displayName = "ItalicIcon"
