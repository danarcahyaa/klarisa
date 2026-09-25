"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EmptyStateHeaderProps {
  title?: string;
  className?: string;
}

/**
 * Header component for the AI contract drafting empty state.
 * The h1 title is revealed character-by-character with a staggered fade+slide animation.
 * Words are grouped in inline-block wrappers so line-breaks only occur between words,
 * never mid-word.
 */
export function EmptyStateHeader({
  title = "Rancang draft kontrak dalam hitungan detik.",
  className,
}: EmptyStateHeaderProps) {
  // Split into words, preserving space as explicit tokens between them
  const words = title.split(" ");
  let charIndex = 0;

  return (
    <header className={cn("text-center pb-2", className)}>
      <style>{`
        @keyframes char-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .char-animate {
          display: inline-block;
          opacity: 0;
          animation: char-in 0.25s ease forwards;
          white-space: pre;
        }
      `}</style>

      <div className="flex items-start justify-center">
        <Image
          src="/klarisa/logo-ai.svg"
          alt="Logo Klarisa"
          width={48}
          height={48}
          className="size-14 shrink-0 object-contain sm:mt-5 mt-2.5"
        />
        <h1 className="mt-4 font-heading text-[clamp(2.4rem,4.5vw,3.6rem)] font-normal leading-[1.2] tracking-[-.05em] text-slate-900 pb-2">
          {words.map((word, wi) => {
            const isLast = wi === words.length - 1;
            return (
              <React.Fragment key={wi}>
                {/* Each word is an inline-block so line breaks only occur between words */}
                <span style={{ display: "inline-block", whiteSpace: "" }}>
                  {word.split("").map((char) => {
                    const delay = charIndex++ * 28;
                    return (
                      <span
                        key={delay}
                        className="char-animate"
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
                {/* Space between words, also animated */}
                {!isLast && (
                  <span
                    className="char-animate"
                    style={{ animationDelay: `${charIndex++ * 28}ms` }}
                  >
                    {" "}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </h1>
      </div>
    </header>
  );
}
