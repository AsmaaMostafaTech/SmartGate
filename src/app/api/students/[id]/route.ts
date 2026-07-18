import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSecret } from "@/lib/smart-gate/totp";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/students/[id] - update a student (name/grade/active)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.grade === "string" && body.grade.trim()) data.grade = body.grade.trim();
    if (typeof body?.active === "boolean") data.active = body.active;
    if (typeof body?.parentName === "string") data.parentName = body.parentName.trim() || null;
    if (typeof body?.parentPhone === "string") data.parentPhone = body.parentPhone.trim() || null;
    if (typeof body?.parentEmail === "string") data.parentEmail = body.parentEmail.trim() || null;
    if (typeof body?.photoUrl === "string") data.photoUrl = body.photoUrl.trim() || null;
    if (body?.regenerateSecret === true) data.qrSecret = generateSecret();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
    }

    const student = await db.student.update({ where: { id }, data });
    return NextResponse.json({ student });
  } catch (e) {
    console.error("PATCH /api/students/[id]", e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث بيانات الطالب" }, { status: 500 });
  }
}

// DELETE /api/students/[id] - delete a student
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await db.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/students/[id]", e);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الطالب" }, { status: 500 });
  }
}
