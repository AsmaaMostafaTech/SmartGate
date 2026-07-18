import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/teachers - list all teachers (password excluded)
export async function GET() {
  try {
    const teachers = await db.teacher.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ teachers });
  } catch (e) {
    console.error("GET /api/teachers", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المعلمين" },
      { status: 500 }
    );
  }
}

// POST /api/teachers - create a new teacher (email must be unique)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const subject = String(body?.subject ?? "").trim();
    const password = String(body?.password ?? "");

    if (!name || !email || !subject || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال الاسم والبريد الإلكتروني والمادة وكلمة المرور" },
        { status: 400 }
      );
    }

    const exists = await db.teacher.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 }
      );
    }

    const teacher = await db.teacher.create({
      data: { name, email, subject, password },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ teacher }, { status: 201 });
  } catch (e) {
    console.error("POST /api/teachers", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المعلم" },
      { status: 500 }
    );
  }
}
