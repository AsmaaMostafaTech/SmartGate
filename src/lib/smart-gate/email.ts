// Real parent email notifications via Resend.
// Gracefully no-ops (logs) when RESEND_API_KEY is not configured, so the app
// keeps working in environments without email — only the in-app realtime feed
// is used in that case.

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM || "Smart Gate <onboarding@resend.dev>";
const client = apiKey ? new Resend(apiKey) : null;

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendParentNotificationEmail(
  to: string | null | undefined,
  studentName: string,
  action: "ENTRY" | "EXIT",
  message: string
): Promise<EmailResult> {
  if (!client) return { sent: false, reason: "no_api_key" };
  if (!to) return { sent: false, reason: "no_email_address" };

  const actionAr = action === "ENTRY" ? "دخول" : "خروج";
  const html = `
  <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #047857, #059669); padding: 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px;">🔔 إشعار من Smart Gate</h1>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">البوابة الذكية لإدارة دخول الطلاب</p>
    </div>
    <div style="padding: 24px;">
      <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: ${action === "ENTRY" ? "#ecfdf5" : "#fffbeb"}; color: ${action === "ENTRY" ? "#047857" : "#b45309"}; font-weight: 600; font-size: 13px; margin-bottom: 14px;">
        ${action === "ENTRY" ? "↓ دخول" : "↑ خروج"}
      </div>
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">${studentName}</h2>
      <p style="margin: 0; color: #4b5563; line-height: 1.6; font-size: 15px;">${message}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #f3f4f6;" />
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">تم إرسال هذا الإشعار تلقائياً من نظام Smart Gate. لا ترد على هذه الرسالة.</p>
    </div>
  </div>`;

  try {
    const { error } = await client.emails.send({
      from: fromAddress,
      to,
      subject: `إشعار ${actionAr} الطالب ${studentName} — Smart Gate`,
      html,
    });
    if (error) {
      console.error("[email] resend error:", error.message);
      return { sent: false, reason: error.message };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] exception:", e);
    return { sent: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}
