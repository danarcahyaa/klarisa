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

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    const duration = 650;
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
  }, [value]);

  return (
    <span aria-label={`${value}${suffix}`}>
      {String(displayValue).padStart(padLength, "0")}
      {suffix}
    </span>
  );
}
