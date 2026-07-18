import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/announcements/[id] - delete an announcement by id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await db.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/announcements/[id]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الإعلان" },
      { status: 500 }
    );
  }
}
