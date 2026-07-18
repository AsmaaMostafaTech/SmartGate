"use client";

import { useEffect, useState } from "react";

/**
 * RotatingWords — cycles through a list of phrases with a typewriter-like
 * fade/slide transition. Used in the hero subtitle to highlight features.
 * Respects prefers-reduced-motion (shows the first word statically).
 */
export function RotatingWords({
  words,
  interval = 2600,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || words.length <= 1) return;

    let i = 0;
    const cycle = setInterval(() => {
      // fade out current
      setVisible(false);
      setTimeout(() => {
        i = (i + 1) % words.length;
        setIndex(i);
        setVisible(true);
      }, 320);
    }, interval);
    return () => clearInterval(cycle);
  }, [words, interval]);

  return (
    <span
      className={`inline-block transition-all duration-300 ${className ?? ""} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      }`}
      style={{ minWidth: "6em" }}
    >
      {words[index]}
    </span>
  );
}
