"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  LogOut,
  Search,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  UserRound,
  Phone,
  User,
  Wifi,
  WifiOff,
  BellRing,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";
import { useRealtimeNotifications } from "@/lib/smart-gate/use-realtime";
import {
  type Student,
  type NotificationEntry,
  type RealtimeNotification,
  formatArabicDateTime,
} from "@/lib/smart-gate/types";

async function fetchStudents(search: string): Promise<Student[]> {
  const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
  if (!res.ok) throw new Error("فشل الاتصال");
  return (await res.json()).students as Student[];
}
async function fetchNotifications(studentId: string): Promise<NotificationEntry[]> {
  const res = await fetch(`/api/notifications?studentId=${studentId}&limit=50`);
  if (!res.ok) throw new Error("فشل الاتصال");
  return (await res.json()).notifications as NotificationEntry[];
}

export function ParentView() {
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
  const queryClient = useQueryClient();

  const { refetch } = useQuery({
    queryKey: ["parent-lookup", query],
    queryFn: () => fetchStudents(query),
    enabled: false,
  });

  const { data: history } = useQuery({
    queryKey: ["parent-notifications", student?.id],
    queryFn: () => fetchNotifications(student!.id),
    enabled: !!student,
    refetchInterval: 8000,
  });

  // Real-time websocket feed
  const { connected, notifications: live, clear } = useRealtimeNotifications({
    role: "parent",
    studentId: student?.id,
    enabled: !!student,
    onNotification: (n: RealtimeNotification) => {
      toast({
        title: n.type === "ENTRY" ? "إشعار دخول" : "إشعار خروج",
        description: n.message,
      });
      queryClient.invalidateQueries({ queryKey: ["parent-notifications"] });
    },
  });

  const handleLogin = useCallback(async () => {
    const term = query.trim();
    if (!term) {
      toast({ title: "أدخل اسم أو رقم الطالب", variant: "destructive" });
      return;
    }
    setSearching(true);
    try {
      const result = await refetch();
      const list = result.data ?? [];
      const found = list.find(
        (s) =>
          s.studentNumber === term ||
          s.studentNumber.includes(term) ||
          s.name.includes(term)
      );
      if (!found) {
        toast({
          title: "غير موجود",
          description: "لم يتم العثور على طالب بهذا الاسم أو الرقم",
          variant: "destructive",
        });
        setStudent(null);
        return;
      }
      clear();
      setStudent(found);
      toast({ title: `أهلاً ${found.parentName ?? "ولي الأمر"}` });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }, [query, refetch, clear]);

  const handleLogout = () => {
    setStudent(null);
    setQuery("");
    clear();
  };

  // ---------- Login screen ----------
  if (!student) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Bell className="h-10 w-10" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">بوابة ولي الأمر</h2>
          <p className="mt-1 text-muted-foreground">
            سجّل الدخول باسم أو رقم الطالب لتستقبل إشعارات الدخول والخروج لحظياً
          </p>
        </div>
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="parent-student-number">اسم أو رقم الطالب</Label>
                <Input
                  id="parent-student-number"
                  placeholder="مثال: 1001 أو أحمد"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button onClick={handleLogin} disabled={searching} size="lg">
                {searching ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="ml-2 h-4 w-4" />
                )}
                دخول
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          جرّب بالرقم (1001 - 1008) أو باسم الطالب
        </p>
      </div>
    );
  }

  const unread = history?.filter((n) => !n.read).length ?? 0;

  // ---------- Logged in screen ----------
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{student.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {student.grade} · رقم: {student.studentNumber}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="ml-2 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>

        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">ولي الأمر</p>
              <p className="truncate font-semibold">
                {student.parentName ?? "غير مسجّل"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">رقم الموبايل</p>
              <p className="truncate font-semibold" dir="ltr">
                {student.parentPhone ?? "غير مسجّل"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConnectionStatus connected={connected} />

      {/* Live notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="h-5 w-5 text-primary" />
              الإشعارات اللحظية
            </CardTitle>
            {live.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                مسح اللحظية
              </Button>
            )}
          </div>
          <CardDescription>
            الإشعارات الجديدة تستقبل هنا فور مسح الكود عند البوابة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {live.length > 0 ? (
            <ScrollArea className="h-64 pr-1">
              <div className="flex flex-col gap-2">
                {live.map((n, i) => (
                  <LiveNotificationRow key={`${n.id}-${i}`} n={n} isNew={i === 0} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <BellRing className="h-8 w-8 opacity-40" />
              <p className="text-sm">في انتظار الإشعارات...</p>
              <p className="text-xs">
                مسّح كود الطالب من شاشة الأمن لترى الإشعار يصل هنا فوراً
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              سجل الإشعارات
            </CardTitle>
            {unread > 0 && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                {unread} غير مقروء
              </Badge>
            )}
          </div>
          <CardDescription>كل الإشعارات المرسلة سابقاً لولي الأمر</CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <ScrollArea className="h-80 pr-1">
              <div className="flex flex-col gap-2">
                {history.map((n) => (
                  <HistoryNotificationRow key={n.id} n={n} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-40" />
              <p className="text-sm">لا توجد إشعارات سابقة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
        connected
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
          : "border-amber-500/30 bg-amber-500/5 text-amber-600"
      }`}
    >
      {connected ? (
        <>
          <Wifi className="h-4 w-4" />
          متصل بالبوابة اللحظية — جاهز لاستقبال الإشعارات
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 animate-softpulse" />
          جارٍ الاتصال بالخدمة اللحظية...
        </>
      )}
    </div>
  );
}

function LiveNotificationRow({
  n,
  isNew,
}: {
  n: RealtimeNotification;
  isNew: boolean;
}) {
  const isEntry = n.type === "ENTRY";
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
        isNew ? "border-primary/40 bg-primary/5 shadow-sm" : "bg-card"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          isEntry
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-amber-500/10 text-amber-600"
        }`}
      >
        {isEntry ? (
          <ArrowDownToLine className="h-5 w-5" />
        ) : (
          <ArrowUpFromLine className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">
            {isEntry ? "تم تسجيل الدخول" : "تم تسجيل الخروج"}
          </p>
          {isNew && (
            <Badge className="bg-primary text-primary-foreground">
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-softpulse rounded-full bg-white" />
              جديد
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatArabicDateTime(n.createdAt)}
        </p>
      </div>
    </div>
  );
}

function HistoryNotificationRow({ n }: { n: NotificationEntry }) {
  const isEntry = n.type === "ENTRY";
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 ${
        n.read ? "bg-card" : "border-primary/30 bg-primary/5"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isEntry
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-amber-500/10 text-amber-600"
        }`}
      >
        {isEntry ? (
          <ArrowDownToLine className="h-4 w-4" />
        ) : (
          <ArrowUpFromLine className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{n.message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatArabicDateTime(n.createdAt)}
        </p>
      </div>
      {!n.read && (
        <Badge variant="outline" className="border-primary/30 text-primary">
          جديد
        </Badge>
      )}
    </div>
  );
}
