"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ArrowDownToLine, ArrowUpFromLine, BellRing } from "lucide-react";
import { useCountUp } from "@/lib/smart-gate/use-count-up";

interface PublicStats {
  totalStudents: number;
  todayEntries: number;
  todayExits: number;
  todayNotifications: number;
}

async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch("/api/public-stats");
  if (!res.ok) throw new Error("fail");
  return (await res.json()) as PublicStats;
}

function StatItem({
  value,
  label,
  icon,
  delay,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  delay: number;
}) {
  const animated = useCountUp(value, 1200, delay);
  return (
    <div className="flex flex-col items-center gap-1 px-4 text-center">
      <div className="flex items-center gap-1.5 text-cyan-400">
        {icon}
      </div>
      <span className="text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">
        {animated}
      </span>
      <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
        {label}
      </span>
    </div>
  );
}

/**
 * Live stats strip — fetches aggregate counts and animates them counting up.
 * Shown on the welcome hero to convey "the system is live".
 */
export function LiveStatsStrip() {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: fetchPublicStats,
    staleTime: 30_000,
  });

  const stats = data ?? {
    totalStudents: 0,
    todayEntries: 0,
    todayExits: 0,
    todayNotifications: 0,
  };

  return (
    <div className="glass ring-glow flex flex-wrap items-center justify-center gap-1 rounded-2xl border-white/10 px-2 py-4 sm:gap-0">
      <StatItem
        value={stats.totalStudents}
        label="طالب نشط"
        icon={<Users className="h-4 w-4" />}
        delay={200}
      />
      <Divider />
      <StatItem
        value={stats.todayEntries}
        label="دخول اليوم"
        icon={<ArrowDownToLine className="h-4 w-4" />}
        delay={350}
      />
      <Divider />
      <StatItem
        value={stats.todayExits}
        label="خروج اليوم"
        icon={<ArrowUpFromLine className="h-4 w-4" />}
        delay={500}
      />
      <Divider />
      <StatItem
        value={stats.todayNotifications}
        label="إشعار مُرسل"
        icon={<BellRing className="h-4 w-4" />}
        delay={650}
      />
    </div>
  );
}

function Divider() {
  return (
    <span className="hidden h-10 w-px bg-border/60 sm:inline-block" />
  );
}
