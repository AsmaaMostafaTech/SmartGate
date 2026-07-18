"use client";

/**
 * TeamMarquee — an auto-scrolling horizontal strip of team members + roles.
 * Purely cosmetic; conveys the team behind the project. Pauses on hover.
 * Theme-aware: visible in both light and dark.
 */
const TEAM = [
  { name: "Asmaa", role: "Full Stack Web Developer" },
  { name: "Menna", role: "Telecommunication Engineer" },
  { name: "Roqaya", role: "Network & Information Security" },
];

export function TechMarquee() {
  // duplicate the list so the marquee loops seamlessly
  const items = [...TEAM, ...TEAM, ...TEAM, ...TEAM];
  return (
    <div className="relative w-full max-w-3xl overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-10 hover:[animation-play-state:paused]">
        {items.map((m, i) => (
          <span
            key={i}
            className="flex items-center gap-2.5 whitespace-nowrap text-sm font-bold text-foreground/85"
          >
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_8px_2px_oklch(0.796_0.146_222/0.6)]" />
            <span className="text-foreground">{m.name}</span>
            <span className="text-muted-foreground font-medium">· {m.role}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
