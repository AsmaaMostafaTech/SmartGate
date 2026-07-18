"use client";

import { useEffect, useRef } from "react";

/**
 * useParallax — applies a vertical translate to a ref'd element based on the
 * page scroll offset, scaled by `speed` (negative = moves slower/up, positive
 * = faster/down). Creates depth when layered. Respects reduced-motion.
 */
export function useParallax<T extends HTMLElement>(speed = 0.15) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return ref;
}
