"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * MagneticButton — a button that subtly "pulls" toward the cursor when the
 * pointer is near it (Apple-style magnetic effect). Respects reduced-motion.
 * Renders as a normal button; pass any children/className/onClick.
 */
export function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={cn("transition-transform duration-200 ease-out", className)}
    >
      {children}
    </button>
  );
}
