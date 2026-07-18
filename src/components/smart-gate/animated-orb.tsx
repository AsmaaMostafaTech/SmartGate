"use client";

import { DoorOpen } from "lucide-react";

/**
 * Animated logo orb — a rotating conic-gradient sphere with a glassy core
 * and the Smart Gate door icon. Eye-catching centerpiece for the hero.
 */
export function AnimatedLogoOrb() {
  return (
    <div className="relative mx-auto mb-8 h-28 w-28 sm:h-32 sm:w-32">
      {/* outer rotating gradient ring */}
      <div
        className="absolute inset-0 rounded-full opacity-90 blur-[2px]"
        style={{
          background:
            "conic-gradient(from 0deg, oklch(0.796 0.146 222), oklch(0.86 0.15 210), oklch(0.672 0.172 246), oklch(0.796 0.146 222))",
          animation: "spin 8s linear infinite",
        }}
      />
      {/* glow halo */}
      <div className="absolute inset-0 rounded-full bg-gradient-neon opacity-50 blur-2xl animate-softpulse" />
      {/* glassy inner core */}
      <div className="glass-strong absolute inset-[10px] flex items-center justify-center rounded-full">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-neon text-primary-foreground shadow-inner sm:h-20 sm:w-20">
          <DoorOpen className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>
      </div>
      {/* orbiting dot */}
      <div
        className="absolute inset-0"
        style={{ animation: "spin 6s linear infinite" }}
      >
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_3px_oklch(0.78_0.17_195/0.7)]" />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
