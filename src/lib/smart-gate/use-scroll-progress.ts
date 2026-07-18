"use client";

import { useEffect } from "react";

/**
 * Tracks the page scroll progress as a 0–100 percentage and writes it to the
 * `--scroll-progress` CSS variable on :root. Pair with the `.scroll-progress`
 * class to render a thin gradient progress bar at the top of the page.
 */
export function useScrollProgress() {
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        `${Math.min(Math.max(pct, 0), 100)}%`
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}
