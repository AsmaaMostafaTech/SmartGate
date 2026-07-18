"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  Search,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  GraduationCap,
  RefreshCw,
  Timer,
  Megaphone,
  ClipboardList,
  CalendarClock,
  BookMarked,
  Inbox,
  Send,
  Sparkles,
  Bot,
  QrCode as QrIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { QrCodeDisplay } from "./qr-display";
import { toast } from "@/hooks/use-toast";
import {
  type Student,
  type LogEntry,
  type Announcement,
  type ChatMessage,
  formatArabicDateTime,
  formatArabicDate,
} from "@/lib/smart-gate/types";

async function fetchStudents(search: string): Promise<Student[]> {
  const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
  if (!res.ok) throw new Error("فشل الاتصال");
  const data = await res.json();
  return data.students as Student[];
}

async function fetchStudentLogs(id: string): Promise<LogEntry[]> {
  const res = await fetch(`/api/logs?studentId=${id}&limit=30`);
  if (!res.ok) throw new Error("فشل الاتصال");
  const data = await res.json();
  return data.logs as LogEntry[];
}

async function fetchAnnouncements(grade: string): Promise<Announcement[]> {
  const res = await fetch(`/api/announcements?grade=${encodeURIComponent(grade)}`);
  if (!res.ok) throw new Error("فشل الاتصال");
  const data = await res.json();
  return (data.announcements ?? []) as Announcement[];
}

export function StudentView() {
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);

  const { refetch } = useQuery({
    queryKey: ["student-lookup", query],
    queryFn: () => fetchStudents(query),
    enabled: false,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["student-logs", student?.id],
    queryFn: () => fetchStudentLogs(student!.id),
    enabled: !!student,
    refetchInterval: 5000,
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
      setStudent(found);
      toast({
        title: `أهلاً ${found.name}`,
        description: "تم تسجيل الدخول بنجاح",
      });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }, [query, refetch]);

  const handleLogout = () => {
    setStudent(null);
    setQuery("");
  };

  // ---------- Login screen ----------
  if (!student) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <GraduationCap className="h-10 w-10" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">بوابة الطالب</h2>
          <p className="mt-1 text-muted-foreground">
            سجّل الدخول باسم أو رقم الطالب لعرض كود QR الخاص بك
          </p>
        </div>
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="student-number">اسم أو رقم الطالب</Label>
                <Input
                  id="student-number"
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

  // ---------- Logged in screen ----------
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-6">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <UserRound className="h-6 w-6" />
                </div>
              )}
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
      </Card>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3">
          <TabsTrigger value="qr">
            <QrIcon className="ml-2 h-4 w-4" />
            كود QR
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="ml-2 h-4 w-4" />
            الإعلانات والمهام
          </TabsTrigger>
          <TabsTrigger value="chatbot">
            <Bot className="ml-2 h-4 w-4" />
            المساعد الذكي
          </TabsTrigger>
        </TabsList>

        {/* ---------- Tab 1: QR ---------- */}
        <TabsContent value="qr" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-[auto_1fr] md:items-center">
              <DynamicQrPanel qrToken={student.qrToken} active={student.active} />

              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-muted/50 p-4">
                  <h4 className="mb-1 text-sm font-semibold">تعليمات الاستخدام</h4>
                  <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
                    <li>اعرض كود QR أعلاه على شاشة هاتفك.</li>
                    <li>وجّه الكود نحو الكاميرا عند البوابة.</li>
                    <li>سيتم تسجيل الدخول أو الخروج تلقائياً.</li>
                    <li>تابع سجل حركتك بالأسفل.</li>
                  </ol>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">إجمالي الحركات</p>
                    <p className="text-2xl font-bold text-primary">
                      {logs?.length ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">آخر حركة</p>
                    <p className="text-sm font-semibold">
                      {logs && logs[0]
                        ? logs[0].type === "ENTRY"
                          ? "دخول"
                          : "خروج"
                        : "لا يوجد"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                سجل الحضور والانصراف
              </CardTitle>
              <CardDescription>آخر 30 حركة مسجّلة لحسابك</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جارٍ التحميل...
                </div>
              ) : logs && logs.length > 0 ? (
                <ScrollArea className="h-72 pr-1">
                  <div className="flex flex-col gap-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                              log.type === "ENTRY"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {log.type === "ENTRY" ? (
                              <ArrowDownToLine className="h-4 w-4" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {log.type === "ENTRY" ? "دخول" : "خروج"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatArabicDateTime(log.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            log.type === "ENTRY"
                              ? "border-emerald-500/30 text-emerald-600"
                              : "border-amber-500/30 text-amber-600"
                          }
                        >
                          {log.type === "ENTRY" ? "ENTRY" : "EXIT"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                  <History className="h-8 w-8 opacity-40" />
                  <p>لا توجد حركات مسجّلة بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Tab 2: Announcements & Assignments ---------- */}
        <TabsContent value="announcements" className="mt-4">
          <StudentAnnouncementsPanel grade={student.grade} />
        </TabsContent>

        {/* ---------- Tab 3: Chatbot ---------- */}
        <TabsContent value="chatbot" className="mt-4">
          <StudentChatbotPanel grade={student.grade} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Student announcements panel ----------
function StudentAnnouncementsPanel({ grade }: { grade: string }) {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["student-announcements", grade],
    queryFn: () => fetchAnnouncements(grade),
    refetchInterval: 20000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
          جارٍ التحميل...
        </CardContent>
      </Card>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 opacity-40" />
          <p>لا توجد إعلانات أو مهام لصفك بعد</p>
          <p className="text-xs">عُد لاحقاً أو تواصل مع معلمك</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((a) => {
        const isAssignment = a.type === "assignment";
        return (
          <Card key={a.id} className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    isAssignment
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-600"
                  }
                >
                  {isAssignment ? (
                    <>
                      <ClipboardList className="ml-1 h-3 w-3" /> مهمة
                    </>
                  ) : (
                    <>
                      <Megaphone className="ml-1 h-3 w-3" /> إعلان
                    </>
                  )}
                </Badge>
                {a.subject && (
                  <Badge variant="secondary" className="gap-1">
                    <BookMarked className="h-3 w-3" />
                    {a.subject}
                  </Badge>
                )}
                {a.grade ? (
                  <Badge variant="secondary">{a.grade}</Badge>
                ) : (
                  <Badge variant="secondary">كل الصفوف</Badge>
                )}
              </div>
              <h4 className="mt-2 font-bold leading-tight">{a.title}</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {a.content}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>بواسطة {a.authorName}</span>
                <span>·</span>
                <span>{formatArabicDateTime(a.createdAt)}</span>
                {isAssignment && a.dueDate && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <CalendarClock className="h-3 w-3" />
                    التسليم: {formatArabicDate(a.dueDate)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------- Student chatbot panel ----------
const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "مرحباً! أنا المساعد الذكي. اسألني أي سؤال عن المادة الدراسية.",
};

function StudentChatbotPanel({ grade }: { grade: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom on new message / loading change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          grade,
          // send the last few turns as history (skip the welcome message)
          history: nextMessages.slice(1, -1),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "fail");
      const answer: string =
        data.answer ??
        data.response ??
        "عذراً، لم أتمكن من توليد إجابة الآن.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "تعذّر الاتصال بالمساعد الذكي. تأكد من اتصالك بالإنترنت ثم حاول مجدداً.",
        },
      ]);
      toast({
        title: "تعذّر الاتصال",
        description: e instanceof Error ? e.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass flex h-[560px] flex-col border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-neon text-primary-foreground glow-cyan">
            <Sparkles className="h-5 w-5" />
          </div>
          المساعد الذكي
        </CardTitle>
        <CardDescription>
          اسأل أي سؤال عن المنهج الدراسي وسنحاول مساعدتك
        </CardDescription>
      </CardHeader>

      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-2"
      >
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span className="flex items-center gap-1">
              جارٍ التفكير
              <span className="inline-flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
              </span>
            </span>
          </div>
        )}
      </div>

      {/* input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            rows={1}
            className="min-h-[44px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 bg-gradient-neon text-primary-foreground glow-cyan hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`flex max-w-[85%] items-start gap-2 rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-white/5 text-foreground ring-1 ring-white/10"
        }`}
      >
        {!isUser && (
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        )}
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
    </div>
  );
}

// ---------- Dynamic QR panel ----------
// Polls /api/qr/[qrToken] every few seconds for a fresh `<token>:<code>` payload
// and renders a countdown ring that visualises the 30-second refresh window.
function DynamicQrPanel({
  qrToken,
  active,
}: {
  qrToken: string;
  active: boolean;
}) {
  const [payload, setPayload] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQr = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr/${qrToken}`);
      if (!res.ok) return;
      const data = await res.json();
      setPayload(data.payload);
      setExpiresIn(Number(data.expiresInSeconds) || 30);
      setLoading(false);
    } catch {
      /* keep last payload */
    }
  }, [qrToken]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await fetchQr();
    };
    void run();
    // refresh the QR a touch before each 30s window expires
    const refresh = setInterval(() => {
      if (active) void fetchQr();
    }, 28000);
    return () => {
      active = false;
      clearInterval(refresh);
    };
  }, [fetchQr]);

  // 1Hz countdown for the ring
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setExpiresIn((s) => (s <= 1 ? 30 : s - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // SVG countdown ring (radius 90 → circumference ~565)
  const R = 90;
  const CIRC = 2 * Math.PI * R;
  const pct = expiresIn / 30;
  const dash = CIRC * pct;
  const urgent = expiresIn <= 5;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* countdown ring */}
        <svg width="232" height="232" viewBox="0 0 232 232" className="absolute inset-0 -rotate-90">
          <circle cx="116" cy="116" r={R} fill="none" stroke="oklch(0.94 0.03 162)" strokeWidth="3" />
          <circle
            cx="116"
            cy="116"
            r={R}
            fill="none"
            stroke={urgent ? "oklch(0.577 0.245 27.325)" : "var(--primary)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: "stroke-dasharray 1s linear" }}
          />
        </svg>
        {/* QR */}
        <div className="relative m-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-border">
          {loading ? (
            <div className="flex h-[200px] w-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <QrCodeDisplay value={payload} size={200} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Timer className={`h-4 w-4 ${urgent ? "animate-softpulse text-destructive" : "text-primary"}`} />
        الكود يتجدّد خلال{" "}
        <span className={`tabular-nums font-bold ${urgent ? "text-destructive" : "text-foreground"}`}>
          {expiresIn}ث
        </span>
      </div>

      <button
        onClick={fetchQr}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        تحديث فوري
      </button>

      <Badge
        variant={active ? "default" : "destructive"}
        className={active ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}
      >
        {active ? (
          <>
            <ShieldCheck className="ml-1 h-3.5 w-3.5" />
            الحساب نشط
          </>
        ) : (
          <>
            <ShieldAlert className="ml-1 h-3.5 w-3.5" />
            الحساب موقوف
          </>
        )}
      </Badge>
      {!active && (
        <p className="text-center text-xs text-destructive">
          حسابك موقوف، يرجى مراجعة الإدارة
        </p>
      )}

      <div className="mt-1 max-w-[230px] rounded-lg bg-primary/5 p-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        🔒 كود ديناميكي يتجدّد كل 30 ثانية — صورة الكود تصبح غير صالحة خلال لحظات
      </div>
    </div>
  );
}
