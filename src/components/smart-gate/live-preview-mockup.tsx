"use client";

import { useEffect, useState } from "react";
import { ScanLine, ArrowDownToLine, BellRing, Check } from "lucide-react";

/**
 * LivePreviewMockup — a small animated mockup showing what the system does:
 * a QR scan → a live notification arrives. Purely cosmetic (no real data),
 * used to convey the product in one glance on the hero.
 */
export function LivePreviewMockup() {
  const [phase, setPhase] = useState<"scan" | "entry" | "notif">("scan");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const seq: ("scan" | "entry" | "notif")[] = ["scan", "entry", "notif"];
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % seq.length;
      setPhase(seq[i]);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-strong ring-glow relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl p-5 shadow-2xl">
      {/* top: scanner + status */}
      <div className="flex items-center gap-3">
        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-500 ${
            phase === "scan"
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {phase === "scan" ? (
            <ScanLine className="h-6 w-6 animate-pulse" />
          ) : (
            <Check className="h-6 w-6" />
          )}
          {/* scan ring */}
          {phase === "scan" && (
            <span className="absolute inset-0 rounded-xl ring-2 ring-cyan-400/40 animate-ping" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {phase === "scan" ? "جارٍ مسح الكود..." : "تم تسجيل الدخول"}
          </p>
          <p className="text-xs text-muted-foreground">
            {phase === "scan" ? "أحمد محمد علي · 1001" : "البوابة الرئيسية"}
          </p>
        </div>
        {phase === "entry" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <ArrowDownToLine className="h-3 w-3" /> دخول
          </span>
        )}
      </div>

      {/* notification slide-in */}
      <div
        className={`mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all duration-500 ${
          phase === "notif"
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 text-white">
          <BellRing className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">إشعار لولي الأمر</p>
          <p className="truncate text-[11px] text-muted-foreground">
            تم تسجيل دخول الطالب أحمد
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground">الآن</span>
      </div>

      {/* faux progress bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-gradient-neon transition-all duration-1000"
          style={{
            width: phase === "scan" ? "40%" : phase === "entry" ? "75%" : "100%",
          }}
        />
      </div>
    </div>
  );
}
