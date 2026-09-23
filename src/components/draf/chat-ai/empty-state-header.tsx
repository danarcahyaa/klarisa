import Image from "next/image";
import { cn } from "@/lib/utils";

interface EmptyStateHeaderProps {
  title?: string;
  className?: string;
}

/**
 * Header component for the AI contract drafting empty state.
 */
export function EmptyStateHeader({
  title = "Rancang draft kontrak dalam hitungan detik.",
  className,
}: EmptyStateHeaderProps) {
  return (
    <header className={cn("text-center pb-2", className)}>
      <div className="flex items-start justify-center">
        <Image
          src="/klarisa/logo-ai.svg"
          alt="Logo Klarisa"
          width={48}
          height={48}
          className="size-14 shrink-0 object-contain mt-3.5 -mr-3 sm:-mr-5"
        />
        <h1 className="mt-4 font-heading text-[clamp(2.4rem,4.5vw,3.6rem)] font-normal leading-[1.2] tracking-[-.05em] text-slate-900 pb-2">
          {title}
        </h1>
      </div>
    </header>
  );
}
