import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTotp, secondsUntilExpiry } from "@/lib/smart-gate/totp";

// GET /api/qr/[qrToken] — returns the CURRENT dynamic QR payload for a student.
// The payload is `<qrToken>:<6-digit-code>` and refreshes every 30s based on the
// student's secret. The Student view polls this endpoint to render the live QR.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  try {
    const { qrToken } = await params;
    const student = await db.student.findUnique({
      where: { qrToken },
      select: { id: true, name: true, active: true, qrSecret: true },
    });
    if (!student || !student.qrSecret) {
      return NextResponse.json({ error: "كود غير صالح" }, { status: 404 });
    }
    const code = generateTotp(student.qrSecret);
    const payload = `${qrToken}:${code}`;
    return NextResponse.json({
      payload,
      expiresInSeconds: secondsUntilExpiry(),
      studentName: student.name,
      active: student.active,
    });
  } catch (e) {
    console.error("GET /api/qr/[qrToken]", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
