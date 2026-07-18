import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications - list notifications
// query: ?studentId=...&limit=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { student: true },
    });

    return NextResponse.json({ notifications });
  } catch (e) {
    console.error("GET /api/notifications", e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإشعارات" }, { status: 500 });
  }
}

// PATCH /api/notifications - mark as read
// body: { id?: string, all?: boolean }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.all) {
      await db.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, markedAll: true });
    }
    const id = String(body?.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "id مطلوب" }, { status: 400 });
    }
    await db.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/notifications", e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإشعار" }, { status: 500 });
  }
}
