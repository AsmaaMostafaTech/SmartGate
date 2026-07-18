import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/materials - list materials, optional ?grade= filter, ordered by createdAt desc
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade")?.trim() ?? "";

    const materials = await db.material.findMany({
      where: grade ? { grade } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ materials });
  } catch (e) {
    console.error("GET /api/materials", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المواد الدراسية" },
      { status: 500 }
    );
  }
}

// POST /api/materials - create a new study material
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const grade = String(body?.grade ?? "").trim();

    if (!title || !content || !subject || !grade) {
      return NextResponse.json(
        { error: "يرجى إدخال العنوان والمحتوى والمادة والصف" },
        { status: 400 }
      );
    }

    const material = await db.material.create({
      data: { title, content, subject, grade },
    });
    return NextResponse.json({ material }, { status: 201 });
  } catch (e) {
    console.error("POST /api/materials", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المادة الدراسية" },
      { status: 500 }
    );
  }
}
