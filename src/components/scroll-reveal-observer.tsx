"use client";

import { useEffect } from "react";

const revealSelector = "[data-scroll-reveal]";

export function ScrollRevealObserver() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      items.forEach((item) => item.classList.add("is-revealed"));
      return;
    }

    document.documentElement.classList.add("scroll-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -30px", threshold: 0.05 },
    );

    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("scroll-reveal-ready");
    };
  }, []);

  return null;
}
