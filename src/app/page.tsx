"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ScanLine,
  GraduationCap,
  DoorOpen,
  BellRing,
  Sparkles,
  ArrowLeft,
  QrCode,
  Zap,
  ShieldCheck as ShieldIcon,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { Providers } from "@/components/providers";
import { SessionProvider } from "@/components/session-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { StudentView } from "@/components/smart-gate/student-view";
import { SecurityView } from "@/components/smart-gate/security-view";
import { AdminView } from "@/components/smart-gate/admin-view";
import { ParentView } from "@/components/smart-gate/parent-view";
import { TeacherView } from "@/components/smart-gate/teacher-view";
import { AuthGate } from "@/components/smart-gate/auth-gate";
import { AnimatedLogoOrb } from "@/components/smart-gate/animated-orb";
import { LiveStatsStrip } from "@/components/smart-gate/live-stats-strip";
import { RotatingWords } from "@/components/smart-gate/rotating-words";
import { LivePreviewMockup } from "@/components/smart-gate/live-preview-mockup";
import { TechMarquee } from "@/components/smart-gate/tech-marquee";
import { MagneticButton } from "@/components/smart-gate/magnetic-button";
import { useTilt } from "@/lib/smart-gate/use-tilt";
import { useMouseGlow } from "@/lib/smart-gate/use-mouse-glow";
import { useScrollProgress } from "@/lib/smart-gate/use-scroll-progress";
import { useParallax } from "@/lib/smart-gate/use-parallax";
import type { Role } from "@/lib/smart-gate/types";
import { Play } from "lucide-react";

const ROLES: {
  id: Role;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  glow: string;
}[] = [
  {
    id: "student",
    label: "الطالب",
    desc: "عرض كود QR الديناميكي",
    icon: <GraduationCap className="h-5 w-5" />,
    accent: "from-cyan-400 to-sky-500",
    glow: "glow-cyan",
  },
  {
    id: "teacher",
    label: "المعلم",
    desc: "إعلانات ومهام",
    icon: <BookOpen className="h-5 w-5" />,
    accent: "from-cyan-400 to-blue-500",
    glow: "glow-soft",
  },
  {
    id: "security",
    label: "الأمن",
    desc: "مسح الأكواد وتسجيل الحركة",
    icon: <ScanLine className="h-5 w-5" />,
    accent: "from-cyan-400 to-cyan-500",
    glow: "glow-teal",
  },
  {
    id: "admin",
    label: "الإدارة",
    desc: "الإدارة والتقارير والإحصائيات",
    icon: <ShieldCheck className="h-5 w-5" />,
    accent: "from-amber-400 to-orange-500",
    glow: "glow-soft",
  },
  {
    id: "parent",
    label: "ولي الأمر",
    desc: "إشعارات لحظية للدخول والخروج",
    icon: <BellRing className="h-5 w-5" />,
    accent: "from-cyan-400 to-sky-500",
    glow: "glow-soft",
  },
];

const FEATURES = [
  { icon: <QrCode className="h-4 w-4" />, text: "QR ديناميكي يتجدّد كل 30 ثانية" },
  { icon: <Zap className="h-4 w-4" />, text: "إشعارات لحظية فورية" },
  { icon: <ShieldIcon className="h-4 w-4" />, text: "تحقق بصري بالصور" },
  { icon: <BarChart3 className="h-4 w-4" />, text: "تقارير PDF / Excel" },
];

export default function Home() {
  // null = welcome/hero landing; a role id = show that role's dashboard
  const [role, setRole] = useState<Role | null>(null);
  useScrollProgress();

  return (
    <SessionProvider>
      <Providers>
        <div className="relative flex min-h-screen flex-col">
          {/* Scroll progress bar */}
          <div className="scroll-progress" />
          {/* Ambient aurora blobs */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="animate-aurora absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-gradient-neon opacity-30 blur-[100px]" />
            <div
              className="animate-aurora absolute top-1/3 left-[-15%] h-80 w-80 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-500 opacity-20 blur-[90px]"
              style={{ animationDelay: "3s" }}
            />
          </div>

          {role === null ? (
            <WelcomeScreen onSelect={setRole} />
          ) : (
            <>
              <Header role={role} setRole={setRole} onHome={() => setRole(null)} />
              <main className="flex-1 px-4 pb-10">
                {role === "student" && <StudentView />}
                {role === "teacher" && (
                  <AuthGate role="teacher">
                    <TeacherView />
                  </AuthGate>
                )}
                {role === "security" && (
                  <AuthGate role="security">
                    <SecurityView />
                  </AuthGate>
                )}
                {role === "admin" && (
                  <AuthGate role="admin">
                    <AdminView />
                  </AuthGate>
                )}
                {role === "parent" && <ParentView />}
              </main>
              <Footer />
            </>
          )}
        </div>
      </Providers>
    </SessionProvider>
  );
}

/* ============================================================
   WELCOME / HERO LANDING — modern, eye-catching.
   Glass header + animated gradient hero + floating orbs + grid
   backdrop + bento role cards with sheen/ring-glow/fade-up.
   ============================================================ */
/* A single role card with 3D tilt-on-hover (needs to be its own component
   so the tilt hook can be used per-card, not in a loop). */
function RoleCard({
  role: r,
  index: i,
  onSelect,
}: {
  role: (typeof ROLES)[number];
  index: number;
  onSelect: (r: Role) => void;
}) {
  const { ref, onMove, onLeave } = useTilt(10);
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => onSelect(r.id)}
      className={cn(
        "sheen-on-hover ring-glow group relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md transition-[transform,border,box-shadow] duration-200 hover:border-white/20 animate-fade-up",
        "shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30",
        "[transform-style:preserve-3d]"
      )}
      style={{ animationDelay: `${0.15 + i * 0.08}s` }}
    >
      {/* gradient wash on hover */}
      <span
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-20",
          r.accent
        )}
      />
      {/* icon orb with glow — lifts forward in 3D */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
          r.accent,
          r.glow,
          "[transform:translateZ(40px)]"
        )}
      >
        {r.icon}
      </div>
      {/* label */}
      <div className="[transform:translateZ(24px)]">
        <h3 className="text-lg font-bold">{r.label}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
      </div>
      {/* enter hint */}
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-2 [transform:translateZ(20px)]">
        الدخول
        <ArrowLeft className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function WelcomeScreen({ onSelect }: { onSelect: (r: Role) => void }) {
  const heroRef = useMouseGlow<HTMLDivElement>();
  // parallax layers — background orbs move at different speeds on scroll
  const orb1Ref = useParallax<HTMLDivElement>(0.12);
  const orb2Ref = useParallax<HTMLDivElement>(-0.08);

  return (
    <>
      {/* Minimal glass top bar */}
      <header className="glass-strong sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Smart Gate logo"
                className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Smart <span className="text-gradient-animated">Gate</span>
              </h1>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                البوابة الذكية لإدارة دخول الطلاب
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BadgeLive />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero region with mouse-tracking glow */}
      <div ref={heroRef} className="mouse-glow relative flex-1 overflow-hidden">
        {/* subtle grid backdrop + extra floating orbs */}
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div ref={orb1Ref} className="animate-float pointer-events-none absolute top-24 left-[8%] h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />
        <div ref={orb2Ref} className="animate-float pointer-events-none absolute top-40 right-[6%] h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" style={{ animationDelay: "2.5s" }} />

        <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-10 sm:py-14">
          {/* Animated logo orb — centerpiece */}
          <div className="animate-fade-up">
            <AnimatedLogoOrb />
          </div>

          {/* Two-column hero: text + live preview (stacks on mobile) */}
          <div className="grid w-full items-center gap-8 lg:grid-cols-2">
            {/* Left: heading + rotating words + CTA */}
            <div className="text-center lg:text-right">
              <div className="ring-glow mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md animate-fade-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                نظام إدارة بوابات ذكي · Real-time
              </div>
              <h2 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1] animate-fade-up" style={{ animationDelay: "0.05s" }}>
                نظام رقمي متكامل لإدارة
                <br />
                <span className="text-gradient-animated">دخول وخروج الطلاب</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg animate-fade-up" style={{ animationDelay: "0.1s" }}>
                بدل الكشوف الورقية والانتظار الطويل —
                <RotatingWords
                  className="font-semibold text-foreground"
                  words={["مسح QR فوري", "تحقق بصري بالصور", "إشعارات لحظية", "تقارير PDF"]}
                />
              </p>

              {/* CTA button */}
              <div className="mt-7 flex justify-center gap-3 lg:justify-start animate-fade-up" style={{ animationDelay: "0.15s" }}>
                <MagneticButton
                  onClick={() => onSelect("security")}
                  className="sheen-on-hover group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-neon px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg glow-cyan hover:scale-105"
                >
                  <Play className="h-4 w-4" />
                  جرّب الديمو الآن
                </MagneticButton>
                <MagneticButton
                  onClick={() => onSelect("student")}
                  strength={0.25}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur-md hover:bg-white/10"
                >
                  عرض كود الطالب
                </MagneticButton>
              </div>
            </div>

            {/* Right: live preview mockup */}
            <div className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <LivePreviewMockup />
            </div>
          </div>

          {/* Live stats strip — full width below */}
          <div className="mt-12 w-full max-w-2xl animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <LiveStatsStrip />
          </div>

          {/* Feature pills */}
          <div className="mt-10 mb-12 flex flex-wrap items-center justify-center gap-2.5 sm:mb-14 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition hover:border-cyan-400/30 hover:text-foreground"
              >
                <span className="text-cyan-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

        {/* Role selection cards — bento style with sheen + ring-glow + 3D tilt */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ROLES.map((r, i) => (
            <RoleCard key={r.id} role={r} index={i} onSelect={onSelect} />
          ))}
        </div>

        {/* trust line */}
        <p className="mt-12 text-center text-xs text-muted-foreground sm:mt-16">
          فريق العمل
        </p>
        <div className="mt-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <TechMarquee />
        </div>
        </main>
      </div>
    </>
  );
}

/* ============================================================
   Header (shown only when a role is selected)
   ============================================================ */
function Header({
  role,
  setRole,
  onHome,
}: {
  role: Role;
  setRole: (r: Role) => void;
  onHome: () => void;
}) {
  return (
    <header className="glass-strong sticky top-0 z-40 border-b border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Clickable logo → returns to welcome screen */}
          <button
            onClick={onHome}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="relative h-11 w-11 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Smart Gate logo"
                className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
              </span>
            </div>
            <div className="text-start">
              <h1 className="text-lg font-bold leading-tight">
                Smart <span className="text-gradient-neon">Gate</span>
              </h1>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                البوابة الذكية لإدارة دخول الطلاب
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <BadgeLive />
            <ThemeToggle />
          </div>
        </div>

        {/* Role selector — premium pill tiles */}
        <div
          role="tablist"
          className="grid grid-cols-2 gap-1.5 rounded-2xl bg-foreground/5 p-1.5 ring-1 ring-border/40 sm:grid-cols-5"
        >
          {ROLES.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={active}
                onClick={() => setRole(r.id)}
                className={cn(
                  "group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                  active
                    ? "text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {active && (
                  <span
                    className={cn(
                      "absolute inset-0 -z-10 bg-gradient-to-r opacity-90 transition-opacity",
                      r.accent
                    )}
                  />
                )}
                {!active && (
                  <span className="absolute inset-0 -z-10 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
                {r.icon}
                <span className="flex flex-col items-start leading-tight sm:flex-row sm:items-center sm:gap-2">
                  <span>{r.label}</span>
                  <span className="hidden text-[11px] font-normal opacity-70 sm:inline">
                    · {r.desc.split(" ").slice(0, 2).join(" ")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function BadgeLive() {
  return (
    <div className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs sm:flex">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
      </span>
      <span className="font-medium text-cyan-300">النظام يعمل</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="glass mt-auto border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-start">
        <p>
          <span className="font-semibold text-foreground">Smart Gate</span> —
          نظام ذكي لإدارة دخول وخروج الطلاب باستخدام QR Code
        </p>
        <p>Next.js · Supabase · Realtime · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
