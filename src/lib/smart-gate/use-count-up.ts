"use client";

import { useEffect, useState } from "react";

/**
 * Animated count-up: animates a number from 0 to `target` over `duration` ms
 * using an ease-out curve. Re-runs whenever `target` changes (so when real
 * data arrives, it animates from 0 to the real value). Respects
 * prefers-reduced-motion.
 */
export function useCountUp(target: number, duration = 1200, startDelay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let startTime = 0;
    let timer: ReturnType<typeof setTimeout>;

    if (reduce) {
      // schedule the final value async to avoid synchronous setState in effect
      timer = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(timer);
    }

    timer = setTimeout(() => {
      const tick = (t: number) => {
        if (!startTime) startTime = t;
        const progress = Math.min((t - startTime) / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay]);

  return value;
}
