import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/logs - list logs with optional filters
// query: ?studentId=...&date=YYYY-MM-DD&type=ENTRY|EXIT&limit=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const type = searchParams.get("type") || undefined;
    const date = searchParams.get("date"); // YYYY-MM-DD
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (type === "ENTRY" || type === "EXIT") where.type = type;
    if (date) {
      const start = new Date(`${date}T00:00:00.000`);
      const end = new Date(`${date}T23:59:59.999`);
      where.createdAt = { gte: start, lte: end };
    }

    const logs = await db.log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { student: true },
    });

    return NextResponse.json({ logs });
  } catch (e) {
    console.error("GET /api/logs", e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب السجلات" }, { status: 500 });
  }
}
