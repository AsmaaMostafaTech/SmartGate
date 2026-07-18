import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reports/attendance — per-student attendance summary for a date range.
// query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    // Default range: current month
    const now = new Date();
    const from = fromStr ? new Date(`${fromStr}T00:00:00.000Z`) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toStr ? new Date(`${toStr}T23:59:59.999Z`) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const students = await db.student.findMany({
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      include: {
        logs: {
          where: { createdAt: { gte: from, lte: to } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    type Row = {
      studentNumber: string;
      name: string;
      grade: string;
      parentName: string | null;
      parentPhone: string | null;
      entries: number;
      exits: number;
      totalMovements: number;
      lastEntry: string | null;
      lastExit: string | null;
      active: boolean;
    };

    const rows: Row[] = students.map((s) => {
      const entries = s.logs.filter((l) => l.type === "ENTRY");
      const exits = s.logs.filter((l) => l.type === "EXIT");
      return {
        studentNumber: s.studentNumber,
        name: s.name,
        grade: s.grade,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        entries: entries.length,
        exits: exits.length,
        totalMovements: s.logs.length,
        lastEntry: entries.length ? entries[entries.length - 1].createdAt.toISOString() : null,
        lastExit: exits.length ? exits[exits.length - 1].createdAt.toISOString() : null,
        active: s.active,
      };
    });

    const summary = {
      totalStudents: students.length,
      totalEntries: rows.reduce((a, r) => a + r.entries, 0),
      totalExits: rows.reduce((a, r) => a + r.exits, 0),
      totalMovements: rows.reduce((a, r) => a + r.totalMovements, 0),
      from: from.toISOString(),
      to: to.toISOString(),
    };

    return NextResponse.json({ rows, summary });
  } catch (e) {
    console.error("GET /api/reports/attendance", e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء التقرير" }, { status: 500 });
  }
}
