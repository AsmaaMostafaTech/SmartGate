"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Theme toggle — switches between light and dark.
 *
 * Hydration-safe: the aria-label/title/icon all wait for `mounted` so the
 * server-rendered HTML is identical (empty placeholder) until the client
 * resolves the real theme. This avoids the next-themes hydration mismatch
 * where the server assumes the default theme but the client may have a
 * persisted preference.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Only trust the real theme after mount; before that render a neutral
  // placeholder so server and client HTML match exactly.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="تبديل المظهر"
      title="تبديل المظهر"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative h-9 w-9 rounded-full border border-white/10 bg-white/5 text-foreground transition hover:bg-white/10 ${className ?? ""}`}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-cyan-600" />
        )
      ) : (
        // Stable placeholder until mounted — keeps SSR/CSR HTML identical.
        <div className="h-4 w-4" />
      )}
    </Button>
  );
}
