"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Activity,
  Plus,
  Search,
  Trash2,
  Power,
  Database,
  Loader2,
  ClipboardList,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  CalendarClock,
  Filter,
  Upload,
  ImageIcon,
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText,
  BellRing,
  Bell,
  CheckCheck,
  Phone,
  User,
  Wifi,
  WifiOff,
  Megaphone,
  BookMarked,
  Library,
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import {
  type Student,
  type LogEntry,
  type Stats,
  type LogType,
  type NotificationEntry,
  type RealtimeNotification,
  type Announcement,
  type Material,
  GRADES,
  formatArabicDateTime,
  formatArabicDate,
} from "@/lib/smart-gate/types";
import { useRealtimeNotifications } from "@/lib/smart-gate/use-realtime";
import {
  exportAttendancePDF,
  exportAttendanceExcel,
  type ReportData,
} from "@/lib/smart-gate/exports";

// ---------- fetchers ----------
async function fetchStudents(search: string): Promise<Student[]> {
  const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
  if (!res.ok) throw new Error("fail");
  return (await res.json()).students as Student[];
}
async function fetchStats(): Promise<Stats> {
  const res = await fetch(`/api/stats`);
  if (!res.ok) throw new Error("fail");
  return (await res.json()) as Stats;
}
async function fetchLogs(
  date: string | null,
  type: "ALL" | LogType
): Promise<LogEntry[]> {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (type !== "ALL") params.set("type", type);
  params.set("limit", "200");
  const res = await fetch(`/api/logs?${params.toString()}`);
  if (!res.ok) throw new Error("fail");
  return (await res.json()).logs as LogEntry[];
}
async function fetchNotifications(): Promise<NotificationEntry[]> {
  const res = await fetch(`/api/notifications?limit=100`);
  if (!res.ok) throw new Error("fail");
  return (await res.json()).notifications as NotificationEntry[];
}
async function fetchAttendanceReport(from: string, to: string): Promise<ReportData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`/api/reports/attendance?${params.toString()}`);
  if (!res.ok) throw new Error("fail");
  return (await res.json()) as ReportData;
}
async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`/api/announcements`);
  if (!res.ok) throw new Error("fail");
  const data = await res.json();
  return (data.announcements ?? []) as Announcement[];
}
async function fetchMaterials(): Promise<Material[]> {
  const res = await fetch(`/api/materials`);
  if (!res.ok) throw new Error("fail");
  const data = await res.json();
  return (data.materials ?? []) as Material[];
}

export function AdminView() {
  const [studentSearch, setStudentSearch] = useState("");
  const [logDate, setLogDate] = useState<string>("");
  const [logType, setLogType] = useState<"ALL" | LogType>("ALL");
  const [reportFrom, setReportFrom] = useState<string>("");
  const [reportTo, setReportTo] = useState<string>("");

  const queryClient = useQueryClient();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["students-admin", studentSearch],
    queryFn: () => fetchStudents(studentSearch),
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 8000,
  });
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["logs", logDate, logType],
    queryFn: () => fetchLogs(logDate || null, logType),
  });
  const { data: notifications, isLoading: notifLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 10000,
  });
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["attendance-report", reportFrom, reportTo],
    queryFn: () => fetchAttendanceReport(reportFrom, reportTo),
  });
  const { data: announcements, isLoading: annLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });
  const { data: materials, isLoading: matLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: fetchMaterials,
  });

  // Real-time admin feed — see new scans the instant they happen
  const { connected: rtConnected, notifications: rtNotifications } =
    useRealtimeNotifications({ role: "admin", enabled: true });

  // whenever a real-time notification arrives, refresh the persisted list
  useEffect(() => {
    if (rtNotifications.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    }
  }, [rtNotifications, queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["students-admin"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
    queryClient.invalidateQueries({ queryKey: ["demo-students"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const handleSeed = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم", description: data.message });
      invalidateAll();
    } catch (e) {
      toast({
        title: "خطأ",
        description: e instanceof Error ? e.message : "فشل",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 py-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-7">
          <TabsTrigger value="overview">
            <LayoutDashboard className="ml-2 h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="ml-2 h-4 w-4" />
            الطلاب
          </TabsTrigger>
          <TabsTrigger value="logs">
            <ClipboardList className="ml-2 h-4 w-4" />
            السجلات
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellRing className="ml-2 h-4 w-4" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileBarChart className="ml-2 h-4 w-4" />
            التقارير
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="ml-2 h-4 w-4" />
            الإعلانات
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Library className="ml-2 h-4 w-4" />
            المواد الدراسية
          </TabsTrigger>
        </TabsList>

        {/* ---------- Overview ---------- */}
        <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              title="إجمالي الطلاب"
              value={stats?.totalStudents}
              loading={statsLoading}
              icon={<Users className="h-5 w-5" />}
              tone="primary"
            />
            <StatCard
              title="حسابات نشطة"
              value={stats?.activeStudents}
              loading={statsLoading}
              icon={<UserCheck className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title="حسابات موقوفة"
              value={stats?.inactiveStudents}
              loading={statsLoading}
              icon={<UserX className="h-5 w-5" />}
              tone="destructive"
            />
            <StatCard
              title="حاضر داخل المدرسة الآن"
              value={stats?.presentNow}
              loading={statsLoading}
              icon={<Activity className="h-5 w-5" />}
              tone="emerald"
              pulse
            />
            <StatCard
              title="دخول اليوم"
              value={stats?.todayEntries}
              loading={statsLoading}
              icon={<ArrowDownToLine className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title="خروج اليوم"
              value={stats?.todayExits}
              loading={statsLoading}
              icon={<ArrowUpFromLine className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              title="إشعارات أولياء الأمور اليوم"
              value={stats?.todayNotifications}
              loading={statsLoading}
              icon={<BellRing className="h-5 w-5" />}
              tone="primary"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                نشاط البوابة خلال اليوم
              </CardTitle>
              <CardDescription>
                توزيع عمليات الدخول والخروج حسب الساعة (من 7 صباحاً حتى 6 مساءً)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-72 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats?.hours ?? []}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="oklch(0.9 0.01 162)"
                      />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 11 }}
                        stroke="oklch(0.5 0.02 165)"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        stroke="oklch(0.5 0.02 165)"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid oklch(0.9 0.01 162)",
                          fontSize: 13,
                        }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 13 }}
                        formatter={(v) =>
                          v === "entries" ? "دخول" : "خروج"
                        }
                      />
                      <Bar
                        dataKey="entries"
                        name="entries"
                        fill="oklch(0.596 0.145 162.48)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="exits"
                        name="exits"
                        fill="oklch(0.769 0.188 70.08)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {stats && stats.totalStudents === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Database className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold">لا يوجد طلاب بعد</p>
                  <p className="text-sm text-muted-foreground">
                    ابدأ بإضافة طلاب أو أضف بيانات تجريبية بضغطة واحدة
                  </p>
                </div>
                <Button onClick={handleSeed}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة بيانات تجريبية
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------- Students ---------- */}
        <TabsContent value="students" className="mt-4 flex flex-col gap-4">
          <StudentsToolbar
            search={studentSearch}
            onSearch={setStudentSearch}
            onSeed={handleSeed}
            onCreated={invalidateAll}
          />

          <Card>
            <CardContent className="p-0">
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جارٍ التحميل...
                </div>
              ) : students && students.length > 0 ? (
                <ScrollArea className="h-[460px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">الصورة</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead className="hidden md:table-cell">
                          الصف
                        </TableHead>
                        <TableHead>رقم الطالب</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          ولي الأمر
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          الحركات
                        </TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <StudentRow
                          key={s.id}
                          student={s}
                          onChanged={invalidateAll}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                  <Users className="h-8 w-8 opacity-40" />
                  <p>لا يوجد طلاب مطابقون</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Logs ---------- */}
        <TabsContent value="logs" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                فلترة السجلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> التاريخ
                  </Label>
                  <Input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" /> النوع
                  </Label>
                  <Select
                    value={logType}
                    onValueChange={(v) => setLogType(v as "ALL" | LogType)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">الكل</SelectItem>
                      <SelectItem value="ENTRY">دخول</SelectItem>
                      <SelectItem value="EXIT">خروج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(logDate || logType !== "ALL") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogDate("");
                      setLogType("ALL");
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                )}
                <div className="ms-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {logs?.length ?? 0} سجل
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جارٍ التحميل...
                </div>
              ) : logs && logs.length > 0 ? (
                <ScrollArea className="h-[460px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="hidden md:table-cell">
                          رقم الطالب
                        </TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الوقت والتاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">
                            {l.student?.name ?? "—"}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {l.student?.studentNumber ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                l.type === "ENTRY"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                              }
                            >
                              {l.type === "ENTRY" ? (
                                <>
                                  <ArrowDownToLine className="ml-1 h-3 w-3" />
                                  دخول
                                </>
                              ) : (
                                <>
                                  <ArrowUpFromLine className="ml-1 h-3 w-3" />
                                  خروج
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatArabicDateTime(l.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                  <ClipboardList className="h-8 w-8 opacity-40" />
                  <p>لا توجد سجلات مطابقة</p>
                  <p className="text-xs">
                    جرّب مسح بعض الأكواد من شاشة الأمن
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Notifications ---------- */}
        <TabsContent
          value="notifications"
          className="mt-4 flex flex-col gap-4"
        >
          <AdminNotificationsPanel
            notifications={notifications}
            loading={notifLoading}
            rtConnected={rtConnected}
            rtNotifications={rtNotifications}
            onChanged={() => {
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
            }}
          />
        </TabsContent>

        {/* ---------- Reports ---------- */}
        <TabsContent value="reports" className="mt-4 flex flex-col gap-4">
          <ReportsPanel
            data={reportData}
            loading={reportLoading}
            from={reportFrom}
            to={reportTo}
            onFrom={setReportFrom}
            onTo={setReportTo}
          />
        </TabsContent>

        {/* ---------- Announcements ---------- */}
        <TabsContent value="announcements" className="mt-4">
          <AdminAnnouncementsPanel
            announcements={announcements}
            loading={annLoading}
            onChanged={() => {
              queryClient.invalidateQueries({ queryKey: ["announcements"] });
            }}
          />
        </TabsContent>

        {/* ---------- Materials ---------- */}
        <TabsContent value="materials" className="mt-4">
          <AdminMaterialsPanel
            materials={materials}
            loading={matLoading}
            onChanged={() => {
              queryClient.invalidateQueries({ queryKey: ["materials"] });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Reports panel ----------
function ReportsPanel({
  data,
  loading,
  from,
  to,
  onFrom,
  onTo,
}: {
  data?: ReportData;
  loading: boolean;
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileBarChart className="h-5 w-5 text-primary" />
            تقرير الحضور والانصراف
          </CardTitle>
          <CardDescription>
            ملخص حركة كل طالب خلال فترة محددة — قابل للتصدير PDF / Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> من تاريخ
            </Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => onFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> إلى تاريخ
            </Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => onTo(e.target.value)}
              className="w-44"
            />
          </div>
          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { onFrom(""); onTo(""); }}>
              مسح الفلاتر
            </Button>
          )}
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!data || data.rows.length === 0}
              onClick={() => data && exportAttendancePDF(data)}
            >
              <FileText className="ml-2 h-4 w-4" />
              تصدير PDF
            </Button>
            <Button
              size="sm"
              disabled={!data || data.rows.length === 0}
              onClick={() => data && exportAttendanceExcel(data)}
            >
              <FileSpreadsheet className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && data.summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="عدد الطلاب"
            value={data.summary.totalStudents}
            icon={<Users className="h-5 w-5" />}
            tone="primary"
          />
          <StatCard
            title="إجمالي الدخول"
            value={data.summary.totalEntries}
            icon={<ArrowDownToLine className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            title="إجمالي الخروج"
            value={data.summary.totalExits}
            icon={<ArrowUpFromLine className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            title="إجمالي الحركات"
            value={data.summary.totalMovements}
            icon={<Activity className="h-5 w-5" />}
            tone="primary"
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جارٍ إنشاء التقرير...
            </div>
          ) : data && data.rows.length > 0 ? (
            <ScrollArea className="h-[460px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead className="hidden md:table-cell">الصف</TableHead>
                    <TableHead>رقم الطالب</TableHead>
                    <TableHead>الدخول</TableHead>
                    <TableHead>الخروج</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead className="hidden lg:table-cell">آخر دخول</TableHead>
                    <TableHead className="hidden lg:table-cell">آخر خروج</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((r, i) => (
                    <TableRow key={r.studentNumber}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{r.grade}</TableCell>
                      <TableCell className="text-muted-foreground">{r.studentNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                          {r.entries}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
                          {r.exits}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">{r.totalMovements}</TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {r.lastEntry ? formatArabicDateTime(r.lastEntry) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {r.lastExit ? formatArabicDateTime(r.lastExit) : "—"}
                      </TableCell>
                      <TableCell>
                        {r.active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15">نشط</Badge>
                        ) : (
                          <Badge variant="destructive">موقوف</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <FileBarChart className="h-8 w-8 opacity-40" />
              <p>لا توجد بيانات في هذه الفترة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ---------- Admin notifications panel ----------
function AdminNotificationsPanel({
  notifications,
  loading,
  rtConnected,
  rtNotifications,
  onChanged,
}: {
  notifications?: NotificationEntry[];
  loading: boolean;
  rtConnected: boolean;
  rtNotifications: RealtimeNotification[];
  onChanged: () => void;
}) {
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      onChanged();
      toast({ title: "تم تعليم الكل كمقروء" });
    } catch {
      toast({ title: "فشل التحديث", variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                rtConnected
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {rtConnected ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5 animate-softpulse" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {rtConnected
                  ? "متصل بالخدمة اللحظية"
                  : "جارٍ الاتصال بالخدمة اللحظية..."}
              </p>
              <p className="text-xs text-muted-foreground">
                الإشعارات الجديدة تظهر هنا فور مسح أي كود عند البوابة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                {unread} غير مقروء
              </Badge>
            )}
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="ml-2 h-4 w-4" />
                تعليم الكل كمقروء
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {rtNotifications.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4 text-primary" />
              وصل الآن ({rtNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 pr-1">
              <div className="flex flex-col gap-2">
                {rtNotifications.map((n, i) => (
                  <AdminNotifRow key={`rt-${n.id}-${i}`} n={n} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            سجل الإشعارات المُرسلة لأولياء الأمور
          </CardTitle>
          <CardDescription>
            كل إشعار تم إرساله لولي الأمر عند دخول أو خروج الطالب
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جارٍ التحميل...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <ScrollArea className="h-[460px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead className="hidden md:table-cell">
                      ولي الأمر
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      الموبايل
                    </TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الوقت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n) => (
                    <TableRow key={n.id} className={n.read ? "" : "bg-primary/5"}>
                      <TableCell className="font-medium">
                        {n.student?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {n.parentName ?? "—"}
                      </TableCell>
                      <TableCell
                        className="hidden text-muted-foreground md:table-cell"
                        dir="ltr"
                      >
                        {n.parentPhone ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            n.type === "ENTRY"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                          }
                        >
                          {n.type === "ENTRY" ? (
                            <>
                              <ArrowDownToLine className="ml-1 h-3 w-3" />
                              دخول
                            </>
                          ) : (
                            <>
                              <ArrowUpFromLine className="ml-1 h-3 w-3" />
                              خروج
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatArabicDateTime(n.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p>لا توجد إشعارات بعد</p>
              <p className="text-xs">
                امسح كود طالب من شاشة الأمن ليصل إشعار لولي أمره
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AdminNotifRow({ n }: { n: RealtimeNotification }) {
  const isEntry = n.type === "ENTRY";
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
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
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{n.studentName}</p>
          <span className="text-xs text-muted-foreground">
            {formatArabicDateTime(n.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {n.message}
        </p>
      </div>
    </div>
  );
}

// ---------- Stat card ----------
function StatCard({
  title,
  value,
  loading,
  icon,
  tone,
  pulse,
}: {
  title: string;
  value?: number;
  loading?: boolean;
  icon: React.ReactNode;
  tone: "primary" | "emerald" | "amber" | "destructive";
  pulse?: boolean;
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass} ${pulse ? "animate-softpulse" : ""}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          {loading ? (
            <Loader2 className="mt-1 h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-bold tabular-nums">{value ?? 0}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Students toolbar + add dialog ----------
function StudentsToolbar({
  search,
  onSearch,
  onSeed,
  onCreated,
}: {
  search: string;
  onSearch: (v: string) => void;
  onSeed: () => void;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو الرقم أو الصف..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onSeed}>
          <Database className="ml-2 h-4 w-4" />
          بيانات تجريبية
        </Button>
        <AddStudentDialog
          open={open}
          onOpenChange={setOpen}
          onCreated={() => {
            onCreated();
          }}
        />
      </CardContent>
    </Card>
  );
}

function AddStudentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [studentNumber, setStudentNumber] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotoUrl(data.url);
      toast({ title: "تم رفع الصورة" });
    } catch (err) {
      toast({
        title: "فشل رفع الصورة",
        description: err instanceof Error ? err.message : "خطأ",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!name.trim() || !grade || !studentNumber.trim()) {
      toast({ title: "يرجى إكمال جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          studentNumber: studentNumber.trim(),
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          parentEmail: parentEmail.trim(),
          photoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تمت الإضافة", description: `أُضيف ${data.student.name}` });
      setName("");
      setStudentNumber("");
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setPhotoUrl("");
      setGrade(GRADES[0]);
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast({
        title: "خطأ",
        description: e instanceof Error ? e.message : "فشل",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="ml-2 h-4 w-4" />
          إضافة طالب
        </Button>
      </DialogTrigger>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة طالب جديد</DialogTitle>
          <DialogDescription>
            سيتم إنشاء QR Code فريد تلقائياً عند الإضافة، وستصدر إشعارات لولي الأمر عند كل دخول/خروج.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-name">الاسم الكامل</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد محمد علي"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-grade">الصف الدراسي</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="add-grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-num">رقم الطالب</Label>
              <Input
                id="add-num"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="مثال: 1009"
                inputMode="numeric"
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ImageIcon className="h-4 w-4" />
            صورة الطالب (للتحقق البصري عند البوابة)
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="معاينة" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="photo-input">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploading}
                >
                  <span>
                    <Upload className="ml-2 h-4 w-4" />
                    {uploading ? "جارٍ الرفع..." : "رفع صورة"}
                  </span>
                </Button>
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhotoUrl("")}
                >
                  إزالة
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                اختياري — PNG/JPG، حتى 4MB
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <User className="h-4 w-4" />
            بيانات ولي الأمر (للإشعارات)
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-parent-name">اسم ولي الأمر</Label>
              <Input
                id="add-parent-name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="مثال: محمد علي"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-parent-phone">رقم موبايل ولي الأمر</Label>
              <Input
                id="add-parent-phone"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="مثال: 01012345679"
                inputMode="tel"
                dir="ltr"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-parent-email">بريد ولي الأمر (للإشعارات)</Label>
            <Input
              id="add-parent-email"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="مثال: parent@email.com"
              dir="ltr"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="ml-2 h-4 w-4" />
            )}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Student row ----------
function StudentRow({
  student,
  onChanged,
}: {
  student: Student;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const toggleActive = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !student.active }),
      });
      if (!res.ok) throw new Error("fail");
      toast({
        title: student.active ? "تم إيقاف الحساب" : "تم تفعيل الحساب",
        description: student.name,
      });
      onChanged();
    } catch {
      toast({ title: "فشل التحديث", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("fail");
      toast({ title: "تم حذف الطالب", description: student.name });
      onChanged();
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        {student.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.photoUrl}
            alt={student.name}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{student.name}</TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        {student.grade}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {student.studentNumber}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-col">
          <span className="text-sm">{student.parentName ?? "—"}</span>
          {student.parentPhone && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
              <Phone className="h-3 w-3" />
              {student.parentPhone}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="secondary">{student._count?.logs ?? 0}</Badge>
      </TableCell>
      <TableCell>
        {student.active ? (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15">
            نشط
          </Badge>
        ) : (
          <Badge variant="destructive">موقوف</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <Switch
              checked={student.active}
              onCheckedChange={toggleActive}
              disabled={busy}
              aria-label="تفعيل/إيقاف"
            />
            <Power
              className={`h-4 w-4 ${student.active ? "text-emerald-600" : "text-muted-foreground"}`}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDel(true)}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>تأكيد الحذف</DialogTitle>
                <DialogDescription>
                  هل أنت متأكد من حذف الطالب &quot;{student.name}&quot;؟ سيتم حذف جميع سجلاته نهائياً.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDel(false)}
                  disabled={busy}
                >
                  إلغاء
                </Button>
                <Button variant="destructive" onClick={remove} disabled={busy}>
                  {busy ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="ml-2 h-4 w-4" />
                  )}
                  حذف نهائي
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------- Admin announcements panel ----------
const ADMIN_ALL_GRADES_VALUE = "__all__";

function AdminAnnouncementsPanel({
  announcements,
  loading,
  onChanged,
}: {
  announcements?: Announcement[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"announcement" | "assignment">("announcement");
  const [grade, setGrade] = useState<string>(ADMIN_ALL_GRADES_VALUE);
  const [dueDate, setDueDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setContent("");
    setType("announcement");
    setGrade(ADMIN_ALL_GRADES_VALUE);
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
          subject: null,
          grade: grade === ADMIN_ALL_GRADES_VALUE ? null : grade,
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
      onChanged();
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
      onChanged();
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            إنشاء إعلان / مهمة
          </CardTitle>
          <CardDescription>
            يظهر للطلاب في صفهم (أو لكل الصفوف)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-title">العنوان</Label>
            <Input
              id="a-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إعلان عن امتحان منتصف الفصل"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-content">المحتوى</Label>
            <Textarea
              id="a-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="اكتب التفاصيل هنا..."
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-type">النوع</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as "announcement" | "assignment")
                }
              >
                <SelectTrigger id="a-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">إعلان</SelectItem>
                  <SelectItem value="assignment">مهمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-grade">الصف</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="a-grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ADMIN_ALL_GRADES_VALUE}>كل الصفوف</SelectItem>
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
              <Label htmlFor="a-due" className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> تاريخ التسليم
              </Label>
              <Input
                id="a-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}
          <Button
            onClick={submit}
            disabled={saving}
            size="lg"
            className="bg-gradient-neon text-primary-foreground glow-cyan hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="ml-2 h-4 w-4" />
            )}
            نشر
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" />
            جميع الإعلانات
          </CardTitle>
          <CardDescription>إعلانات ومهام الإدارة والمعلمين</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جارٍ التحميل...
            </div>
          ) : announcements && announcements.length > 0 ? (
            <ScrollArea className="h-[520px]">
              <div className="flex flex-col gap-3 p-4 pt-0">
                {announcements.map((a) => {
                  const isAssignment = a.type === "assignment";
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:border-white/20"
                    >
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
                            <Badge variant="outline" className="text-xs">
                              {a.authorRole === "teacher" ? "معلم" : "إدارة"} ·{" "}
                              {a.authorName}
                            </Badge>
                          </div>
                          <h4 className="mt-2 font-bold leading-tight">
                            {a.title}
                          </h4>
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
                          onClick={() => remove(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8 opacity-40" />
              <p>لا توجد إعلانات بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Admin materials panel ----------
function AdminMaterialsPanel({
  materials,
  loading,
  onChanged,
}: {
  materials?: Material[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setContent("");
    setSubject("");
    setGrade(GRADES[0]);
  };

  const submit = async () => {
    if (!title.trim() || !content.trim() || !subject.trim()) {
      toast({
        title: "يرجى إكمال العنوان والمادة والمحتوى",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          subject: subject.trim(),
          grade,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "fail");
      toast({
        title: "تم حفظ المادة",
        description: title.trim(),
      });
      reset();
      onChanged();
    } catch (e) {
      toast({
        title: "فشل الحفظ",
        description: e instanceof Error ? e.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("fail");
      toast({ title: "تم الحذف" });
      onChanged();
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            إضافة مادة دراسية
          </CardTitle>
          <CardDescription>
            تُستخدم هذه المواد كمرجع للمساعد الذكي عند الإجابة على أسئلة الطلاب
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-title">عنوان المادة</Label>
            <Input
              id="m-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: قوانين نيوتن للحركة"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-subject">المادة</Label>
              <Input
                id="m-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: الفيزياء"
                list="subjects-list"
              />
              <datalist id="subjects-list">
                <option value="الرياضيات" />
                <option value="الفيزياء" />
                <option value="الكيمياء" />
                <option value="الأحياء" />
                <option value="اللغة العربية" />
                <option value="اللغة الإنجليزية" />
                <option value="التاريخ" />
                <option value="الجغرافيا" />
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-grade">الصف</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="m-grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-content">المحتوى / الشرح</Label>
            <Textarea
              id="m-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="اكتب الشرح أو الملخص الذي سيستعين به المساعد الذكي..."
            />
          </div>
          <Button
            onClick={submit}
            disabled={saving}
            size="lg"
            className="bg-gradient-neon text-primary-foreground glow-cyan hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="ml-2 h-4 w-4" />
            )}
            حفظ
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Library className="h-5 w-5 text-primary" />
            قائمة المواد الدراسية
          </CardTitle>
          <CardDescription>مرجع المساعد الذكي للطلاب</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جارٍ التحميل...
            </div>
          ) : materials && materials.length > 0 ? (
            <ScrollArea className="h-[520px]">
              <div className="flex flex-col gap-3 p-4 pt-0">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:border-white/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <BookMarked className="h-3 w-3" />
                            {m.subject}
                          </Badge>
                          <Badge variant="secondary">{m.grade}</Badge>
                        </div>
                        <h4 className="mt-2 font-bold leading-tight">
                          {m.title}
                        </h4>
                        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                          {m.content}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatArabicDateTime(m.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Library className="h-8 w-8 opacity-40" />
              <p>لا توجد مواد دراسية بعد</p>
              <p className="text-xs">
                أضف شرحاً أو ملخصاً ليستعين به المساعد الذكي
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
