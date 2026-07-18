# 🚀 دليل الرفع السريع — GitHub + Vercel

## الخطوة 1: فك الضغط وارفع على GitHub

1. فُكّ ضغط `smart-gate.zip` في مجلد
2. افتح Terminal في المجلد:
   ```bash
   git init
   git add .
   git commit -m "Smart Gate - production ready"
   ```
3. على GitHub: اعمل مستودع جديد (New repository) باسم `smart-gate`
4. ارمي الكود:
   ```bash
   git remote add origin https://github.com/USERNAME/smart-gate.git
   git branch -M main
   git push -u origin main
   ```

## الخطوة 2: ارفع على Vercel

1. روح [vercel.com](https://vercel.com) → سجّل بحساب GitHub
2. **Add New → Project** → اختار مستودع `smart-gate`
3. Vercel هيكتشف Next.js تلقائياً (ماتغيّرش إعدادات الـ Build)
4. **مهم قبل Deploy:** اضغط **Environment Variables** وضيف دول (القيم من `.env` بتاعك):

   ```
   DATABASE_URL=postgresql://postgres.mzhjzwcoelyrummqzrfb:Asmaasmartgate@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres.mzhjzwcoelyrummqzrfb:Asmaasmartgate@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://mzhjzwcoelyrummqzrfb.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TqWBk-E0etrilgv--uHEMQ_UeG9ZfP3
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aGp6d2NvZWx5cnVtbXF6cmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU0MTI1MSwiZXhwIjoyMDk5MTE3MjUxfQ.nN-Uh4eYN7hfBayoy56oTH_NCzHRjtw1Bc41xT8OpL8
   NEXTAUTH_SECRET=JpuYZXB6qILjXp6H94p76Q+nAKdS8w1eiH4yU3wo1Gg=
   NEXTAUTH_URL=https://smart-gate-xxx.vercel.app
   ADMIN_EMAIL=admin@smartgate.school
   ADMIN_PASSWORD=Admin@2026
   SECURITY_PIN=1919
   RESEND_API_KEY=
   RESEND_FROM=Smart Gate <onboarding@resend.dev>
   ```

   ⚠️ **غيّر `NEXTAUTH_URL`** لرابط Vercel الفعلي بعد أول deploy.

5. **Deploy** → هياخد 1-2 دقيقة

## الخطوة 3: بعد الـ Deploy

1. افتح الرابط اللي Vercel هيديك (`https://smart-gate-xxx.vercel.app`)
2. لو الـ NextAuth فشل: ارجع لـ Vercel → Settings → Environment Variables → حدّث `NEXTAUTH_URL` برابط Vercel → **Redeploy**
3. اعمل seed للطلاب (افتح Terminal):
   ```bash
   curl -X POST https://smart-gate-xxx.vercel.app/api/seed
   ```
4. جرّب:
   - **ولي الأمر**: رقم `1001`
   - **الأمن**: PIN `1919`
   - **الإدارة**: `admin@smartgate.school` / `Admin@2026`

## ⚠️ ملاحظات أمان مهمة

- **غيّر باسورد قاعدة البيانات** على Supabase بعد ما تخلص المسابقة (Dashboard → Database → Reset password)، وحدّثه في Vercel
- **الـ service role key** سري جداً — متشاركهوش مع حد
- `.env` مش موجود في الـ zip (آمن)، بس `.env.example` فيه placeholders

## ✅ بيانات الدخول

| الدور | البيانات |
|-------|---------|
| الإدارة | `admin@smartgate.school` / `Admin@2026` |
| الأمن | PIN: `1919` |
| الطالب | `1001`–`1008` أو اسم |
| ولي الأمر | نفس رقم/اسم الطالب |

بالتوفيق! 🏆
