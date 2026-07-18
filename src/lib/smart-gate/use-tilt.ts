"use client";

import { useCallback, useRef } from "react";

/**
 * 3D tilt-on-hover hook. Returns a ref to attach to an element + a handler
 * that rotates the element based on the pointer position (parallax tilt).
 * Resets on leave. Respects prefers-reduced-motion (no tilt).
 *
 * Usage:
 *   const { ref, onMove, onLeave } = useTilt();
 *   <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transformStyle: "preserve-3d" }}>
 */
export function useTilt(max = 12) {
  const ref = useRef<HTMLElement | null>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      // center around 0.5, invert Y so moving up tilts up
      const tiltX = (0.5 - py) * max * 2; // rotateX
      const tiltY = (px - 0.5) * max * 2; // rotateY (positive = look right)
      el.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(1.04)`;
    },
    [max]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);

  return { ref, onMove, onLeave };
}
