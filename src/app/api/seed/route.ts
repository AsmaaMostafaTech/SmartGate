import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSecret } from "@/lib/smart-gate/totp";

// POST /api/seed - seed demo students (with parent info) if the database is empty,
// plus demo teachers, study materials, and announcements if they don't exist yet.
export async function POST() {
  try {
    const results: string[] = [];

    // ------------------------------------------------------------------
    // 1) Demo students (only if the students table is empty)
    // ------------------------------------------------------------------
    const studentCount = await db.student.count();
    if (studentCount > 0) {
      results.push(`يوجد بالفعل ${studentCount} طالب في قاعدة البيانات`);
    } else {
      const demoStudents = [
        { name: "أحمد محمد علي", grade: "الصف الأول الثانوي", studentNumber: "1001", parentName: "محمد علي", parentPhone: "01012345671", parentEmail: "parent1001@smartgate.demo" },
        { name: "سارة خالد إبراهيم", grade: "الصف الثاني الثانوي", studentNumber: "1002", parentName: "خالد إبراهيم", parentPhone: "01012345672", parentEmail: "parent1002@smartgate.demo" },
        { name: "محمود عبد الرحمن", grade: "الصف الثالث الثانوي", studentNumber: "1003", parentName: "عبد الرحمن سيد", parentPhone: "01012345673", parentEmail: "parent1003@smartgate.demo" },
        { name: "فاطمة أحمد حسن", grade: "الصف الأول الثانوي", studentNumber: "1004", parentName: "أحمد حسن", parentPhone: "01012345674", parentEmail: "parent1004@smartgate.demo" },
        { name: "يوسف إبراهيم سعد", grade: "الصف الثاني الثانوي", studentNumber: "1005", parentName: "إبراهيم سعد", parentPhone: "01012345675", parentEmail: "parent1005@smartgate.demo" },
        { name: "مريم سامي فؤاد", grade: "الصف الثالث الثانوي", studentNumber: "1006", parentName: "سامي فؤاد", parentPhone: "01012345676", parentEmail: "parent1006@smartgate.demo" },
        { name: "عمر طارق منصور", grade: "الصف الأول الثانوي", studentNumber: "1007", parentName: "طارق منصور", parentPhone: "01012345677", parentEmail: "parent1007@smartgate.demo" },
        { name: "نورهاني خالد صلاح", grade: "الصف الثاني الثانوي", studentNumber: "1008", parentName: "خالد صلاح", parentPhone: "01012345678", parentEmail: "parent1008@smartgate.demo" },
      ];

      const createdStudents = await db.student.createMany({
        data: demoStudents.map((d) => ({
          name: d.name,
          grade: d.grade,
          studentNumber: d.studentNumber,
          qrSecret: generateSecret(),
          parentName: d.parentName,
          parentPhone: d.parentPhone,
          parentEmail: d.parentEmail,
        })),
      });
      results.push(`تم إضافة ${createdStudents.count} طالب تجريبي (مع بيانات أولياء الأمور)`);
    }

    // ------------------------------------------------------------------
    // 2) Demo teachers (create each if it doesn't already exist by email)
    // ------------------------------------------------------------------
    const demoTeachers = [
      { name: "أ. محمد أحمد", email: "teacher1@smartgate.school", subject: "الرياضيات", password: "Teacher@1" },
      { name: "أ. فاطمة علي", email: "teacher2@smartgate.school", subject: "العلوم", password: "Teacher@2" },
      { name: "أ. خالد سعيد", email: "teacher3@smartgate.school", subject: "اللغة العربية", password: "Teacher@3" },
    ];

    let teachersAdded = 0;
    for (const t of demoTeachers) {
      const existing = await db.teacher.findUnique({
        where: { email: t.email },
      });
      if (!existing) {
        await db.teacher.create({
          data: {
            name: t.name,
            email: t.email,
            subject: t.subject,
            password: t.password,
          },
        });
        teachersAdded += 1;
      }
    }
    if (teachersAdded > 0) {
      results.push(`تم إضافة ${teachersAdded} معلم تجريبي`);
    } else {
      results.push("المعلمون التجريبيون موجودون بالفعل");
    }

    // ------------------------------------------------------------------
    // 3) Demo study materials (create each if it doesn't already exist by title)
    // ------------------------------------------------------------------
    const demoMaterials = [
      {
        title: "الجبر الخطي",
        content:
          "الجبر الخطي هو فرع من الرياضيات يتعامل مع المعادلات الخطية والمتجهات والمصفوفات. المعادلة الخطية هي معادلة من الدرجة الأولى مثل 2x + 3 = 7. حل المعادلة الخطية يعني إيجاد قيمة المتغير المجهول. يمكن حل المعادلات الخطية باستخدام عمليات الجمع والطرح والضرب والقسمة. مثال: لحل 2x + 3 = 7، نطرح 3 من الطرفين لنحصل على 2x = 4، ثم نقسم على 2 لنحصل على x = 2.",
        subject: "الرياضيات",
        grade: "الصف الأول الثانوي",
      },
      {
        title: "الخلية والكائنات الحية",
        content:
          "الخلية هي الوحدة الأساسية للحياة. تنقسم الخلايا إلى نوعين: خلايا بدائية النواة (مثل البكتيريا) وخلايا حقيقية النواة (مثل خلايا الإنسان والنبات). تحتوي الخلية الحقيقية النواة على نواة تحمل المادة الوراثية DNA، وميتوكوندريا تنتج الطاقة، وريبوسومات تصنع البروتينات. تتم عملية البناء الضوئي في البلاستيدات الخضراء الموجودة في خلايا النبات.",
        subject: "العلوم",
        grade: "الصف الأول الثانوي",
      },
    ];

    let materialsAdded = 0;
    for (const m of demoMaterials) {
      const existing = await db.material.findFirst({
        where: { title: m.title },
      });
      if (!existing) {
        await db.material.create({
          data: {
            title: m.title,
            content: m.content,
            subject: m.subject,
            grade: m.grade,
          },
        });
        materialsAdded += 1;
      }
    }
    if (materialsAdded > 0) {
      results.push(`تم إضافة ${materialsAdded} مادة دراسية تجريبية`);
    } else {
      results.push("المواد الدراسية التجريبية موجودة بالفعل");
    }

    // ------------------------------------------------------------------
    // 4) Demo announcements / assignments (create each if it doesn't already exist by title)
    // ------------------------------------------------------------------
    const demoAnnouncements = [
      {
        title: "مرحباً بالعام الدراسي الجديد",
        content:
          "نرحب بجميع الطلاب في العام الدراسي الجديد. نتمنى لكم عاماً مليئاً بالنجاح والتميز.",
        type: "announcement",
        authorName: "الإدارة",
        authorRole: "admin",
        subject: null as string | null,
        grade: null as string | null,
        dueDate: null as Date | null,
      },
      {
        title: "واجب الجبر الخطي",
        content:
          "حل التمارين من 1 إلى 10 في صفحة 45 من كتاب الرياضيات. الموعد النهائي: نهاية الأسبوع.",
        type: "assignment",
        authorName: "أ. محمد أحمد",
        authorRole: "teacher",
        subject: "الرياضيات",
        grade: "الصف الأول الثانوي",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    let announcementsAdded = 0;
    for (const a of demoAnnouncements) {
      const existing = await db.announcement.findFirst({
        where: { title: a.title },
      });
      if (!existing) {
        await db.announcement.create({
          data: {
            title: a.title,
            content: a.content,
            type: a.type,
            authorName: a.authorName,
            authorRole: a.authorRole,
            subject: a.subject,
            grade: a.grade,
            dueDate: a.dueDate,
          },
        });
        announcementsAdded += 1;
      }
    }
    if (announcementsAdded > 0) {
      results.push(`تم إضافة ${announcementsAdded} إعلان/واجب تجريبي`);
    } else {
      results.push("الإعلانات التجريبية موجودة بالفعل");
    }

    return NextResponse.json({
      seeded: true,
      message: results.join("، "),
      counts: {
        students: studentCount,
        teachers: teachersAdded,
        materials: materialsAdded,
        announcements: announcementsAdded,
      },
    });
  } catch (e) {
    console.error("POST /api/seed", e);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة البيانات التجريبية" }, { status: 500 });
  }
}
