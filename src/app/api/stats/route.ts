import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats - dashboard statistics for today
export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalStudents, activeStudents, todayEntries, todayExits, todayLogs, todayNotifications] =
      await Promise.all([
        db.student.count(),
        db.student.count({ where: { active: true } }),
        db.log.count({
          where: { type: "ENTRY", createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        db.log.count({
          where: { type: "EXIT", createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        db.log.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        db.notification.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
      ]);

    // Currently inside the school = students whose last log is ENTRY
    const allStudents = await db.student.findMany({
      where: { active: true },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const presentNow = allStudents.filter(
      (s) => s.logs[0]?.type === "ENTRY"
    ).length;

    // Hourly distribution for today
    const todayLogsWithTime = await db.log.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      select: { type: true, createdAt: true },
    });
    const hours: { hour: string; entries: number; exits: number }[] = [];
    for (let h = 7; h <= 18; h++) {
      const label = `${String(h).padStart(2, "0")}:00`;
      hours.push({ hour: label, entries: 0, exits: 0 });
    }
    for (const l of todayLogsWithTime) {
      const h = l.createdAt.getHours();
      if (h >= 7 && h <= 18) {
        const idx = h - 7;
        if (l.type === "ENTRY") hours[idx].entries += 1;
        else hours[idx].exits += 1;
      }
    }

    return NextResponse.json({
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      todayEntries,
      todayExits,
      todayLogs,
      todayNotifications,
      presentNow,
      hours,
    });
  } catch (e) {
    console.error("GET /api/stats", e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}
