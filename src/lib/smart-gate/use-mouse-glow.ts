"use client";

import { useEffect, useRef } from "react";

/**
 * Mouse-tracking glow: a radial light that follows the pointer over a
 * container. Returns a ref to attach; the glow is drawn as a CSS variable
 * (--mx / --my in %) so the container can render a radial-gradient using it.
 * Disabled on touch / reduced-motion (no movement to track).
 *
 * Usage:
 *   const ref = useMouseGlow<HTMLDivElement>();
 *   <div ref={ref} className="hero-glow">...</div>
 *   .hero-glow::before { background: radial-gradient(circle at var(--mx,50%) var(--my,50%), cyan/20, transparent 40%); }
 */
export function useMouseGlow<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return ref;
}
