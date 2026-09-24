"use client";

import { useEffect, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  suffix?: string;
  padLength?: number;
};

export function AnimatedNumber({
  value,
  suffix = "",
  padLength = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [spanNode, setSpanNode] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    if (!spanNode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(spanNode);

    return () => observer.disconnect();
  }, [spanNode, value]);

  useEffect(() => {
    if (!hasStarted) return;

    const duration = 750;
    let frameId = 0;
    let startTime: number | null = null;

    const updateValue = (time: number) => {
      if (startTime === null) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      setDisplayValue(Math.round(value * easedProgress));

      if (progress < 1) frameId = requestAnimationFrame(updateValue);
    };

    frameId = requestAnimationFrame(updateValue);

    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, value]);

  return (
    <span ref={setSpanNode} aria-label={`${value}${suffix}`}>
      {String(displayValue).padStart(padLength, "0")}
      {suffix}
    </span>
  );
}
