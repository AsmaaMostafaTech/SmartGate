"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ShieldCheck,
  ScanLine,
  Lock,
  Mail,
  Loader2,
  LogOut,
  KeyRound,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface AuthGateProps {
  role: "admin" | "security" | "teacher";
  children: React.ReactNode;
}

/**
 * Guards the Admin, Security and Teacher dashboards behind real NextAuth
 * credentials.
 * - admin:    email + password  (ADMIN_EMAIL / ADMIN_PASSWORD)
 * - teacher:  email + password  (TEACHERS_JSON or built-in demo teachers)
 * - security: PIN                (SECURITY_PIN)
 * Shows a branded Arabic login card until authenticated.
 */
export function AuthGate({ role, children }: AuthGateProps) {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Already authenticated with the right role → render children
  if (status === "authenticated") {
    const sessionRole = (session?.user as { role?: string } | undefined)?.role;
    if (sessionRole === role) {
      const subject = (session?.user as { subject?: string } | undefined)?.subject;
      return (
        <>
          <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-end gap-2">
            {role === "teacher" && subject && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                {subject}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ redirect: false })}
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج ({session.user?.name})
            </Button>
          </div>
          {children}
        </>
      );
    }
    // authenticated as a different role — sign out and show this gate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn(role, {
      redirect: false,
      ...(role === "admin" || role === "teacher"
        ? { email, password }
        : { pin }),
    });
    setLoading(false);
    if (!res || res.error) {
      setError(
        role === "admin" || role === "teacher"
          ? "بيانات الدخول غير صحيحة"
          : "رمز الأمن غير صحيح"
      );
    }
  };

  const icon =
    role === "admin" ? (
      <ShieldCheck className="h-10 w-10" />
    ) : role === "teacher" ? (
      <GraduationCap className="h-10 w-10" />
    ) : (
      <ScanLine className="h-10 w-10" />
    );

  const isEmailRole = role === "admin" || role === "teacher";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8">
      <div className="relative">
        <div className="absolute inset-0 -z-10 animate-softpulse rounded-3xl bg-gradient-neon opacity-40 blur-2xl" />
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-neon text-primary-foreground glow-cyan">
          {icon}
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {role === "admin"
            ? "دخول الإدارة"
            : role === "teacher"
              ? "دخول المعلم"
              : "دخول الأمن"}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {role === "admin"
            ? "هذه الشاشة محمية. سجّل الدخول للمتابعة"
            : role === "teacher"
              ? "سجّل الدخول لإدارة الإعلانات والمهام"
              : "أدخل رمز الأمن لفتح شاشة المسح"}
        </p>
      </div>
      <Card className="glass w-full border-white/10 glow-soft">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isEmailRole ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> البريد الإلكتروني
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === "admin"
                        ? "admin@smartgate.school"
                        : "teacher1@smartgate.school"
                    }
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-pass" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> كلمة المرور
                  </Label>
                  <Input
                    id="auth-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="auth-pin" className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> رمز الأمن
                </Label>
                <Input
                  id="auth-pin"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  autoComplete="off"
                  required
                  className="text-center text-2xl tracking-[0.5em]"
                />
              </div>
            )}
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="bg-gradient-neon text-primary-foreground glow-cyan hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="ml-2 h-4 w-4" />
              )}
              دخول
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-lg bg-muted/60 px-4 py-2 text-center text-xs text-muted-foreground">
        {role === "admin" ? (
          <>
            تجربة: <code className="font-mono">admin@smartgate.school</code> /{" "}
            <code className="font-mono">Admin@2026</code>
          </>
        ) : role === "teacher" ? (
          <>
            تجربة: <code className="font-mono">teacher1@smartgate.school</code> /{" "}
            <code className="font-mono">Teacher@1</code>
          </>
        ) : (
          <>
            تجربة: رمز الأمن <code className="font-mono">1919</code>
          </>
        )}
      </div>
    </div>
  );
}
