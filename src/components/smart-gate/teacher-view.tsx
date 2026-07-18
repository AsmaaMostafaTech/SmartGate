"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  Plus,
  Trash2,
  Loader2,
  Megaphone,
  ClipboardList,
  CalendarClock,
  BookMarked,
  Inbox,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  type Announcement,
  GRADES,
  formatArabicDateTime,
  formatArabicDate,
} from "@/lib/smart-gate/types";

const ALL_GRADES_VALUE = "__all__";

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements");
  if (!res.ok) throw new Error("fail");
  const data = await res.json();
  return (data.announcements ?? []) as Announcement[];
}

export function TeacherView() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const teacherName = session?.user?.name ?? "المعلم";
  const teacherSubject =
    (session?.user as { subject?: string } | undefined)?.subject ?? "";

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    refetchInterval: 15000,
  });

  // only show this teacher's announcements
  const mine = (announcements ?? []).filter((a) => a.authorName === teacherName);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"announcement" | "assignment">("announcement");
  const [grade, setGrade] = useState<string>(ALL_GRADES_VALUE);
  const [dueDate, setDueDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["announcements"] });

  const reset = () => {
    setTitle("");
    setContent("");
    setType("announcement");
    setGrade(ALL_GRADES_VALUE);
    setDueDate("");
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "يرجى إكمال العنوان والمحتوى",
        variant: "destructive",
      });
      return;
    }
    if (type === "assignment" && !dueDate) {
      toast({
        title: "تاريخ التسليم مطلوب للمهام",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          type,
          subject: teacherSubject || null,
          grade: grade === ALL_GRADES_VALUE ? null : grade,
          dueDate: type === "assignment" ? dueDate : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "fail");
      toast({
        title: type === "assignment" ? "تم نشر المهمة" : "تم نشر الإعلان",
        description: title.trim(),
      });
      reset();
      invalidate();
    } catch (e) {
      toast({
        title: "فشل النشر",
        description: e instanceof Error ? e.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("fail");
      toast({ title: "تم الحذف" });
      invalidate();
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
      {/* Header */}
      <Card className="overflow-hidden border-cyan-400/20">
        <div className="bg-gradient-to-l from-cyan-500/10 via-cyan-500/5 to-transparent p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-neon text-primary-foreground glow-cyan">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{teacherName}</h3>
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <BookMarked className="h-3.5 w-3.5" />
                  المادة:{" "}
                  <span className="font-medium text-foreground">
                    {teacherSubject || "غير محددة"}
                  </span>
                </p>
              </div>
            </div>
            <Badge className="bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15">
              <Megaphone className="ml-1 h-3.5 w-3.5" />
              {mine.length} منشور
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Create form */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-primary" />
              إنشاء إعلان / مهمة
            </CardTitle>
            <CardDescription>
              سيظهر المنشور للطلاب من الصف المختار (أو لكل الصفوف)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-title">العنوان</Label>
              <Input
                id="t-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: اختبار الفصل الأول"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-content">المحتوى</Label>
              <Textarea
                id="t-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب تفاصيل الإعلان أو المهمة هنا..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-type">النوع</Label>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    setType(v as "announcement" | "assignment")
                  }
                >
                  <SelectTrigger id="t-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">إعلان</SelectItem>
                    <SelectItem value="assignment">مهمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-grade">الصف</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="t-grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_GRADES_VALUE}>كل الصفوف</SelectItem>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type === "assignment" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-due" className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" /> تاريخ التسليم
                </Label>
                <Input
                  id="t-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

            <Button onClick={submit} disabled={saving} size="lg" className="bg-gradient-neon text-primary-foreground glow-cyan hover:opacity-90">
              {saving ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="ml-2 h-4 w-4" />
              )}
              نشر
            </Button>
          </CardContent>
        </Card>

        {/* List of my announcements */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              منشوراتي
            </CardTitle>
            <CardDescription>
              الإعلانات والمهام التي نشرتها أنت
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جارٍ التحميل...
              </div>
            ) : mine.length > 0 ? (
              <ScrollArea className="h-[520px]">
                <div className="flex flex-col gap-3 p-4 pt-0">
                  {mine.map((a) => (
                    <AnnouncementCard key={a.id} a={a} onDelete={() => remove(a.id)} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-40" />
                <p>لم تنشر أي إعلانات بعد</p>
                <p className="text-xs">استخدم النموذج لإنشاء أول منشور</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------- Announcement card ----------
function AnnouncementCard({
  a,
  onDelete,
}: {
  a: Announcement;
  onDelete: () => void;
}) {
  const isAssignment = a.type === "assignment";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
            <span>{formatArabicDateTime(a.createdAt)}</span>
            {isAssignment && a.dueDate && (
              <span className="flex items-center gap-1 text-amber-600">
                <CalendarClock className="h-3 w-3" />
                التسليم: {formatArabicDate(a.dueDate)}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
