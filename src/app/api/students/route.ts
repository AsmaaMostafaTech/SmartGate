import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSecret } from "@/lib/smart-gate/totp";

// GET /api/students - list all students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const students = await db.student.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { studentNumber: { contains: search } },
              { grade: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { logs: true } },
      },
    });
    return NextResponse.json({ students });
  } catch (e) {
    console.error("GET /api/students", e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلاب" }, { status: 500 });
  }
}

// POST /api/students - create a new student
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const grade = String(body?.grade ?? "").trim();
    const studentNumber = String(body?.studentNumber ?? "").trim();
    const parentName = String(body?.parentName ?? "").trim() || null;
    const parentPhone = String(body?.parentPhone ?? "").trim() || null;
    const parentEmail = String(body?.parentEmail ?? "").trim() || null;
    const photoUrl = String(body?.photoUrl ?? "").trim() || null;

    if (!name || !grade || !studentNumber) {
      return NextResponse.json(
        { error: "يرجى إدخال الاسم والصف ورقم الطالب" },
        { status: 400 }
      );
    }

    const exists = await db.student.findUnique({ where: { studentNumber } });
    if (exists) {
      return NextResponse.json(
        { error: "رقم الطالب موجود بالفعل" },
        { status: 409 }
      );
    }

    const student = await db.student.create({
      data: { name, grade, studentNumber, qrSecret: generateSecret(), photoUrl, parentName, parentPhone, parentEmail },
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (e) {
    console.error("POST /api/students", e);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة الطالب" }, { status: 500 });
  }
}
