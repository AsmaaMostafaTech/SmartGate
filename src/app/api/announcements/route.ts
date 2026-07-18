import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/announcements - list announcements, optional ?grade= filter, ordered by createdAt desc
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade")?.trim() ?? "";

    const announcements = await db.announcement.findMany({
      where: grade ? { grade } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcements });
  } catch (e) {
    console.error("GET /api/announcements", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإعلانات" },
      { status: 500 }
    );
  }
}

// POST /api/announcements - create a new announcement / assignment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const type = String(body?.type ?? "announcement").trim();
    const authorName = String(body?.authorName ?? "").trim();
    const authorRole = String(body?.authorRole ?? "admin").trim();
    const subject =
      typeof body?.subject === "string" && body.subject.trim()
        ? body.subject.trim()
        : null;
    const grade =
      typeof body?.grade === "string" && body.grade.trim()
        ? body.grade.trim()
        : null;
    const dueDate =
      body?.dueDate && !Number.isNaN(Date.parse(String(body.dueDate)))
        ? new Date(String(body.dueDate))
        : null;

    if (!title || !content || !authorName) {
      return NextResponse.json(
        { error: "يرجى إدخال العنوان والمحتوى واسم الناشر" },
        { status: 400 }
      );
    }

    if (type !== "announcement" && type !== "assignment") {
      return NextResponse.json(
        { error: "النوع يجب أن يكون announcement أو assignment" },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type,
        authorName,
        authorRole,
        subject,
        grade,
        dueDate,
      },
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (e) {
    console.error("POST /api/announcements", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة الإعلان" },
      { status: 500 }
    );
  }
}
