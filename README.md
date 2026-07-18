# Smart Gate — البوابة الذكية لإدارة دخول الطلاب

نظام رقمي متكامل لإدارة دخول وخروج الطلاب داخل المدرسة باستخدام **QR Code ديناميكي**، مع إشعارات لحظية لأولياء الأمور، ومصادقة حقيقية، وتقارير احترافية.

![Smart Gate](https://img.shields.io/badge/Smart%20Gate-Production%20Ready-047857) ![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-Postgres+Realtime+Storage-3ECF8E) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## ✨ المميزات

### 🔒 QR ديناميكي (TOTP)
كود QR بيتجدّد كل 30 ثانية لكل طالب. صورة الكود تصبح غير صالحة خلال ثواني — أمان قوي ضد نسخ الكود.

### 🔐 مصادقة حقيقية (NextAuth)
- **الإدارة:** تسجيل دخول بإيميل + كلمة مرور
- **الأمن:** PIN code
- جلسات JWT مع role-based access

### 🔔 إشعارات لحظية لأولياء الأمور
- **في التطبيق:** عبر Supabase Realtime (Postgres Changes) — الإشعار بيوصّل في نفس اللحظة
- **بريد إلكتروني:** عبر Resend (HTML عربي احترافي)

### 📸 صور الطلاب + التحقق البصري
صورة كل طالب بتظهر عند المسح عشان فرد الأمن يقارن الوجه بالشخص اللي قدامه — منع انتحال الهوية. الصور متخزنة على Supabase Storage.

### 📊 تقارير PDF / Excel
تقرير حضور لكل طالب (دخول، خروج، آخر حركة) مع تصدير PDF احترافي و Excel متعدد الشيتات.

### 🛡️ 4 أدوار متكاملة
| الدور | الشاشة |
|-------|--------|
| 🎓 الطالب | عرض كود QR الديناميكي + سجل الحركة |
| 🔍 الأمن | ماسح الكاميرا + بطاقة نتيجة بالصورة |
| 🛡️ الإدارة | إحصائيات + إدارة الطلاب + السجلات + الإشعارات + التقارير |
| 🔔 ولي الأمر | إشعارات لحظية + سجل كامل |

---

## 🛠️ التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 16 (App Router) + TypeScript |
| قاعدة البيانات | Supabase Postgres (Prisma ORM) |
| الإشعارات اللحظية | Supabase Realtime |
| تخزين الصور | Supabase Storage |
| المصادقة | NextAuth.js (JWT) |
| البريد الإلكتروني | Resend |
| QR Code | qrcode.react + html5-qrcode |
| QR الديناميكي | TOTP (RFC 6238) مُنفّذ يدوياً |
| التقارير | jsPDF + jspdf-autotable + xlsx |
| الـ UI | Tailwind CSS 4 + shadcn/ui + Lucide |
| State | TanStack Query + Zustand |
| Realtime client | @supabase/supabase-js |

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js 18+ أو Bun
- حساب Supabase (مجاني)

### الخطوات

1. **انسخ المتغيرات:**
   ```bash
   cp .env.example .env
   ```

2. **اعمل مشروع Supabase** من [supabase.com](https://supabase.com) واملأ المتغيرات في `.env`:
   - `DATABASE_URL` + `DIRECT_URL` (Connection string — pooler)
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SECURITY_PIN`
   - `RESEND_API_KEY` (اختياري)

3. **أنشئ الجداول:**
   ```bash
   bun run db:push
   ```

4. **فعّل Realtime + RLS** (شغّل `supabase-setup.sql` في Supabase SQL Editor)

5. **شغّل المشروع:**
   ```bash
   bun run dev
   ```

6. افتح `http://localhost:3000`

---

## 📦 الرفع على Vercel

1. ارفع الكود على GitHub
2. في Vercel → Import Project
3. أضف كل الـ Environment Variables (نفس اللي في `.env`)
4. **مهم:** غيّر `NEXTAUTH_URL` لرابط Vercel الفعلي
5. Deploy
6. بعد الرفع، اعمل seed: `curl -X POST https://your-app.vercel.app/api/seed`

---

## 🔑 بيانات الدخول التجريبية

| الدور | البيانات |
|-------|---------|
| الإدارة | `admin@smartgate.school` / `Admin@2026` |
| الأمن | PIN: `1919` |
| الطالب | رقم الطالب: `1001`–`1008` (أو الاسم: `أحمد`، `سارة`...) |
| ولي الأمر | نفس رقم/اسم الطالب |

---

## 📁 بنية المشروع

```
src/
├── app/
│   ├── api/
│   │   ├── students/          # CRUD الطلاب
│   │   ├── scan/              # معالجة المسح + TOTP + إشعار
│   │   ├── qr/[qrToken]/      # QR الديناميكي
│   │   ├── logs/              # سجلات الدخول/الخروج
│   │   ├── notifications/     # الإشعارات
│   │   ├── stats/             # إحصائيات اللوحة
│   │   ├── reports/attendance # بيانات تقرير الحضور
│   │   ├── upload/            # رفع الصور (Supabase Storage)
│   │   ├── seed/              # بيانات تجريبية
│   │   └── auth/[...nextauth] # NextAuth
│   ├── page.tsx               # الصفحة الرئيسية (4 أدوار)
│   └── layout.tsx             # RTL Arabic + Cairo font
├── components/smart-gate/
│   ├── student-view.tsx       # شاشة الطالب + Dynamic QR
│   ├── security-view.tsx      # شاشة الأمن + الماسح + الصورة
│   ├── admin-view.tsx         # لوحة الإدارة (5 تبويبات)
│   ├── parent-view.tsx        # شاشة ولي الأمر
│   ├── auth-gate.tsx          # بوابة المصادقة
│   ├── qr-display.tsx         # عرض QR
│   └── qr-scanner.tsx         # ماسح الكاميرا
└── lib/smart-gate/
    ├── types.ts               # الأنواع
    ├── totp.ts                # TOTP (RFC 6238)
    ├── auth.ts                # NextAuth config
    ├── email.ts               # Resend
    ├── storage.ts             # Supabase Storage admin
    ├── supabase-client.ts     # Browser client
    ├── use-realtime.ts        # Supabase Realtime hook
    └── exports.ts             # PDF/Excel export
```

---

## 📜 الترخيص

مشروع تعليمي/مسابقة. حر الاستخدام والتعديل.

---

**Smart Gate** — نظام ذكي لإدارة دخول وخروج الطلاب باستخدام QR Code. 🎓🔒
