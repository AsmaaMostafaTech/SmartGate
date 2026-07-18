"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldX,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Keyboard,
  Zap,
  Loader2,
  ScanLine,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { QrScanner } from "./qr-scanner";
import { toast } from "@/hooks/use-toast";
import {
  type Student,
  type ScanResult,
  formatArabicTime,
  formatArabicDateTime,
} from "@/lib/smart-gate/types";

async function fetchStudentsForDemo(): Promise<Student[]> {
  const res = await fetch(`/api/students`);
  if (!res.ok) throw new Error("فشل الاتصال");
  const data = await res.json();
  return data.students as Student[];
}

async function postScan(qrToken: string): Promise<ScanResult> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qrToken }),
  });
  if (!res.ok) throw new Error("فشل الاتصال");
  return (await res.json()) as ScanResult;
}

interface SessionScan {
  id: string;
  result: ScanResult;
  time: string;
}

export function SecurityView() {
  const queryClient = useQueryClient();
  const [manualToken, setManualToken] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastResult, setLastResult] = useState<SessionScan | null>(null);
  const [session, setSession] = useState<SessionScan[]>([]);

  const { data: demoStudents } = useQuery({
    queryKey: ["demo-students"],
    queryFn: fetchStudentsForDemo,
  });

  const handleScan = useCallback(
    async (qrToken: string) => {
      if (!qrToken || processing) return;
      setProcessing(true);
      setPaused(true);
      try {
        const result = await postScan(qrToken);
        const entry: SessionScan = {
          id: crypto.randomUUID(),
          result,
          time: new Date().toISOString(),
        };
        setLastResult(entry);
        setSession((prev) => [entry, ...prev].slice(0, 12));
        toast({
          title: result.allowed ? "تمت العملية" : "تم الرفض",
          description: result.message,
          variant: result.allowed ? "default" : "destructive",
        });
        // refresh logs/stats
        queryClient.invalidateQueries({ queryKey: ["student-logs"] });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      } catch {
        toast({ title: "حدث خطأ أثناء المعالجة", variant: "destructive" });
      } finally {
        setProcessing(false);
        // brief cooldown before re-arming the scanner
        setTimeout(() => setPaused(false), 1800);
      }
    },
    [processing, queryClient]
  );

  // Demo quick-scan: fetch the CURRENT dynamic payload (`token:code`) the same
  // way a real camera scan would read the live QR, then submit it. This proves
  // the dynamic QR verification path end-to-end.
  const handleDemoScan = useCallback(
    async (baseToken: string, studentName: string) => {
      if (processing) return;
      setProcessing(true);
      setPaused(true);
      try {
        const qrRes = await fetch(`/api/qr/${baseToken}`);
        if (!qrRes.ok) {
          toast({ title: "تعذر قراءة كود الطالب", variant: "destructive" });
          return;
        }
        const { payload } = await qrRes.json();
        const result = await postScan(payload);
        const entry: SessionScan = {
          id: crypto.randomUUID(),
          result,
          time: new Date().toISOString(),
        };
        setLastResult(entry);
        setSession((prev) => [entry, ...prev].slice(0, 12));
        toast({
          title: result.allowed ? "تمت العملية" : "تم الرفض",
          description: result.message,
          variant: result.allowed ? "default" : "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["student-logs"] });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      } catch {
        toast({ title: "حدث خطأ أثناء المعالجة", variant: "destructive" });
      } finally {
        setProcessing(false);
        setTimeout(() => setPaused(false), 1800);
      }
    },
    [processing, queryClient]
  );

  // Reset result after a while so the gate is "ready" again
  useEffect(() => {
    if (!lastResult) return;
    const t = setTimeout(() => setLastResult(null), 6000);
    return () => clearTimeout(t);
  }, [lastResult]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Left: scanner + inputs */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanLine className="h-5 w-5 text-primary" />
              ماسح البوابة
            </CardTitle>
            <CardDescription>
              وجّه الكاميرا نحو كود الطالب أو أدخل الكود يدوياً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onScan={handleScan} paused={paused || processing} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Keyboard className="h-4 w-4 text-primary" />
              إدخال يدوي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="ألصق كود QR هنا..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualToken.trim()) {
                    handleScan(manualToken.trim());
                    setManualToken("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (manualToken.trim()) {
                    handleScan(manualToken.trim());
                    setManualToken("");
                  }
                }}
                disabled={processing || !manualToken.trim()}
              >
                تحقق
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" />
              مسح سريع تجريبي
            </CardTitle>
            <CardDescription className="text-xs">
              لمحاكاة المسح بدون كاميرا، اضغط على اسم الطالب
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demoStudents && demoStudents.length > 0 ? (
              <ScrollArea className="h-48 pr-1">
                <div className="grid gap-2 sm:grid-cols-2">
                  {demoStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleDemoScan(s.qrToken, s.name)}
                      disabled={processing}
                      className="flex items-center justify-between rounded-lg border bg-card p-2.5 text-right transition hover:border-primary hover:bg-accent disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.studentNumber}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          s.active
                            ? "border-emerald-500/30 text-emerald-600"
                            : "border-destructive/30 text-destructive"
                        }
                      >
                        {s.active ? "نشط" : "موقوف"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                لا يوجد طلاب. أضف طلاباً من قسم الإدارة.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: result + session */}
      <div className="flex flex-col gap-4">
        <ScanResultCard result={lastResult} processing={processing} />

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              عمليات الجلسة الحالية
            </CardTitle>
            <CardDescription>آخر العمليات التي تمت في هذه الجلسة</CardDescription>
          </CardHeader>
          <CardContent>
            {session.length > 0 ? (
              <ScrollArea className="h-[420px] pr-1">
                <div className="flex flex-col gap-2">
                  {session.map((s) => (
                    <SessionRow key={s.id} entry={s} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <ScanLine className="h-8 w-8 opacity-40" />
                <p className="text-sm">لا توجد عمليات بعد</p>
                <p className="text-xs">ابدأ بمسح كود طالب</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScanResultCard({
  result,
  processing,
}: {
  result: SessionScan | null;
  processing: boolean;
}) {
  if (processing && !result) {
    return (
      <Card className="border-primary/30">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            جارٍ التحقق من الكود...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ScanLine className="h-8 w-8" />
          </div>
          <div>
            <p className="font-semibold">البوابة جاهزة</p>
            <p className="text-sm text-muted-foreground">
              في انتظار مسح كود الطالب
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { result: r } = result;
  const allowed = r.allowed;
  const isEntry = r.action === "ENTRY";

  return (
    <Card
      className={
        allowed
          ? isEntry
            ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10"
            : "border-amber-500/40 shadow-lg shadow-amber-500/10"
          : "border-destructive/40 shadow-lg shadow-destructive/10"
      }
    >
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="flex items-center gap-4">
          {/* Student photo — for visual identity verification by the security guard */}
          <div className="relative shrink-0">
            {r.student?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.student.photoUrl}
                alt={r.student.name}
                className={`h-20 w-20 rounded-2xl object-cover ring-4 ${
                  allowed
                    ? isEntry
                      ? "ring-emerald-500/40"
                      : "ring-amber-500/40"
                    : "ring-destructive/40"
                }`}
              />
            ) : (
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${
                  allowed
                    ? isEntry
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 text-white"
                    : "bg-destructive text-white"
                }`}
              >
                {allowed ? (
                  isEntry ? (
                    <ArrowDownToLine className="h-8 w-8" />
                  ) : (
                    <ArrowUpFromLine className="h-8 w-8" />
                  )
                ) : (
                  <ShieldX className="h-8 w-8" />
                )}
              </div>
            )}
            {/* status dot on the photo corner */}
            <div
              className={`absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background ${
                allowed
                  ? isEntry
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white"
                  : "bg-destructive text-white"
              }`}
            >
              {allowed ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="text-left">
            <Badge
              variant="outline"
              className={
                allowed
                  ? isEntry
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-600"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }
            >
              {allowed ? (
                <ShieldCheck className="ml-1 h-3.5 w-3.5" />
              ) : (
                <XCircle className="ml-1 h-3.5 w-3.5" />
              )}
              {allowed ? "مسموح" : "مرفوض"}
            </Badge>
          </div>
        </div>

        <div>
          <h3
            className={`text-2xl font-bold ${
              allowed
                ? isEntry
                  ? "text-emerald-600"
                  : "text-amber-600"
                : "text-destructive"
            }`}
          >
            {allowed
              ? isEntry
                ? "تم تسجيل الدخول"
                : "تم تسجيل الخروج"
              : r.reason === "موقوف"
                ? "الحساب موقوف"
                : "كود غير صالح"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
        </div>

        {r.student?.photoUrl && (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            تحقّق بصري: قارِن الصورة بالشخص الموجود أمامك
          </div>
        )}

        {r.student && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="الاسم" value={r.student.name} />
              <InfoRow label="رقم الطالب" value={r.student.studentNumber} />
              <InfoRow label="الصف" value={r.student.grade} />
              <InfoRow
                label="الوقت"
                value={formatArabicTime(result.time)}
              />
            </div>
          </>
        )}

        {r.allowed && r.channels && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
            <span className="font-medium text-muted-foreground">قنوات الإشعار:</span>
            <ChannelChip
              on={r.channels.inApp}
              label="التطبيق"
            />
            <ChannelChip
              on={r.channels.email}
              label="البريد"
              offHint="لم يُهيّأ المفتاح"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function SessionRow({ entry }: { entry: SessionScan }) {
  const r = entry.result;
  const allowed = r.allowed;
  const isEntry = r.action === "ENTRY";
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        {r.student?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.student.photoUrl}
            alt={r.student.name}
            className={`h-9 w-9 rounded-lg object-cover ring-2 ${
              allowed
                ? isEntry
                  ? "ring-emerald-500/40"
                  : "ring-amber-500/40"
                : "ring-destructive/40"
            }`}
          />
        ) : (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              allowed
                ? isEntry
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {allowed ? (
              isEntry ? (
                <ArrowDownToLine className="h-4 w-4" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4" />
              )
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {r.student ? r.student.name : "كود غير معروف"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatArabicDateTime(entry.time)}
          </p>
        </div>
      </div>
      <Badge
        variant="outline"
        className={
          allowed
            ? isEntry
              ? "border-emerald-500/30 text-emerald-600"
              : "border-amber-500/30 text-amber-600"
            : "border-destructive/30 text-destructive"
        }
      >
        {allowed ? (isEntry ? "دخول" : "خروج") : "مرفوض"}
      </Badge>
    </div>
  );
}

function ChannelChip({
  on,
  label,
  offHint,
}: {
  on: boolean;
  label: string;
  offHint?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
        on
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground line-through"
      }`}
      title={on ? undefined : offHint}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          on ? "bg-emerald-500" : "bg-muted-foreground"
        }`}
      />
      {label}
    </span>
  );
}
