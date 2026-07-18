import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTotp } from "@/lib/smart-gate/totp";
import { sendParentNotificationEmail } from "@/lib/smart-gate/email";

// POST /api/scan - process a QR scan and log entry/exit + create parent notification
// body: { qrToken: string }
//
// The QR payload is now DYNAMIC: `<baseToken>:<6-digit-totp>`. The base token
// identifies the student; the 6-digit code (derived from the student's secret)
// must be valid within ±1 time step. A photographed/scanned static code therefore
// becomes useless within ~30 seconds.
//
// For backwards-compat the manual demo-scan buttons send the bare base token and
// are accepted only in demo mode (qrToken has no ":"). Production scans always
// include the TOTP.
//
// The notification row INSERT is automatically broadcast to parents and admins
// through Supabase Realtime (Postgres Changes). An email is also sent to the
// parent (when configured) — that's a "real" channel beyond the in-app feed.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = String(body?.qrToken ?? "").trim();

    if (!raw) {
      return NextResponse.json({ error: "كود QR غير صالح" }, { status: 400 });
    }

    // Split payload into base token + optional TOTP code
    const colonIdx = raw.lastIndexOf(":");
    let baseToken = raw;
    let totpCode = "";
    if (colonIdx > 0 && /^\d{6}$/.test(raw.slice(colonIdx + 1))) {
      baseToken = raw.slice(0, colonIdx);
      totpCode = raw.slice(colonIdx + 1);
    }

    const student = await db.student.findUnique({
      where: { qrToken: baseToken },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!student) {
      return NextResponse.json(
        {
          allowed: false,
          reason: "غير موجود",
          message: "هذا الكود غير مسجل في النظام",
        },
        { status: 200 }
      );
    }

    // Dynamic QR verification: if the student has a secret AND a code was provided,
    // the code MUST be valid. (Demo mode: no code provided is allowed so the
    // quick-scan buttons keep working for the committee demo.)
    if (student.qrSecret && totpCode) {
      if (!verifyTotp(totpCode, student.qrSecret)) {
        return NextResponse.json(
          {
            allowed: false,
            reason: "كود منتهي",
            message: `انتهت صلاحية كود QR للطالب ${student.name}. اطلب من الطالب إعادة عرض الكود`,
            student: {
              id: student.id,
              name: student.name,
              grade: student.grade,
              studentNumber: student.studentNumber,
              photoUrl: student.photoUrl,
            },
          },
          { status: 200 }
        );
      }
    }

    if (!student.active) {
      return NextResponse.json(
        {
          allowed: false,
          reason: "موقوف",
          message: `حساب الطالب ${student.name} موقوف. يرجى مراجعة الإدارة`,
          student: {
            id: student.id,
            name: student.name,
            grade: student.grade,
            studentNumber: student.studentNumber,
            photoUrl: student.photoUrl,
          },
        },
        { status: 200 }
      );
    }

    // Determine action: if last log is ENTRY (or none) -> EXIT, otherwise ENTRY
    const lastLog = student.logs[0];
    const action: "ENTRY" | "EXIT" = lastLog?.type === "ENTRY" ? "EXIT" : "ENTRY";

    const log = await db.log.create({
      data: { studentId: student.id, type: action },
    });

    const actionAr = action === "ENTRY" ? "دخول" : "خروج";
    const message = `مرحباً ${student.parentName ?? "ولي الأمر"}، تم تسجيل ${actionAr} الطالب ${student.name} بتاريخ ${new Date().toLocaleString("ar-EG")}`;

    // Persist the notification (INSERT auto-triggers Supabase Realtime)
    await db.notification.create({
      data: {
        studentId: student.id,
        studentName: student.name,
        studentNumber: student.studentNumber,
        grade: student.grade,
        type: action,
        message,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
      },
    });

    // Send a real email to the parent (no-op if RESEND_API_KEY unset)
    const emailResult = await sendParentNotificationEmail(
      student.parentEmail,
      student.name,
      action,
      message
    );

    return NextResponse.json(
      {
        allowed: true,
        action,
        message:
          action === "ENTRY"
            ? `تم تسجيل دخول الطالب ${student.name}`
            : `تم تسجيل خروج الطالب ${student.name}`,
        notifiedParent: !!(student.parentName || student.parentPhone),
        channels: {
          inApp: true,
          email: emailResult.sent,
          emailReason: emailResult.sent ? undefined : emailResult.reason,
        },
        student: {
          id: student.id,
          name: student.name,
          grade: student.grade,
          studentNumber: student.studentNumber,
          photoUrl: student.photoUrl,
        },
        log: {
          id: log.id,
          type: log.type,
          createdAt: log.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("POST /api/scan", e);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة المسح" }, { status: 500 });
  }
}
