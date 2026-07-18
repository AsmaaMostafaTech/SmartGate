import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public-stats — lightweight public counts for the welcome hero.
// No auth (safe to expose: aggregate numbers only).
export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalStudents, todayEntries, todayExits, todayNotifications] =
      await Promise.all([
        db.student.count({ where: { active: true } }),
        db.log.count({
          where: { type: "ENTRY", createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        db.log.count({
          where: { type: "EXIT", createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        db.notification.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
      ]);

    return NextResponse.json({
      totalStudents,
      todayEntries,
      todayExits,
      todayNotifications,
    });
  } catch (e) {
    console.error("GET /api/public-stats", e);
    return NextResponse.json(
      { totalStudents: 0, todayEntries: 0, todayExits: 0, todayNotifications: 0 },
      { status: 200 }
    );
  }
}
