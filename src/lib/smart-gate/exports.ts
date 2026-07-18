"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface AttendanceRow {
  studentNumber: string;
  name: string;
  grade: string;
  parentName: string | null;
  parentPhone: string | null;
  entries: number;
  exits: number;
  totalMovements: number;
  lastEntry: string | null;
  lastExit: string | null;
  active: boolean;
}

export interface AttendanceSummary {
  totalStudents: number;
  totalEntries: number;
  totalExits: number;
  totalMovements: number;
  from: string;
  to: string;
}

export interface ReportData {
  rows: AttendanceRow[];
  summary: AttendanceSummary;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtRange(from: string, to: string): string {
  const f = new Date(from).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const t = new Date(to).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  return `${f} — ${t}`;
}

/** Export the attendance report as a professionally-styled PDF (RTL Arabic). */
export function exportAttendancePDF(data: ReportData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // Header band
  doc.setFillColor(4, 120, 87); // emerald-700
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Smart Gate — تقرير الحضور والانصراف", 40, 38);
  doc.setFontSize(11);
  doc.text(`الفترة: ${fmtRange(data.summary.from, data.summary.to)}`, 40, 58);

  // Summary chips
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  let y = 92;
  const chips = [
    `عدد الطلاب: ${data.summary.totalStudents}`,
    `إجمالي الدخول: ${data.summary.totalEntries}`,
    `إجمالي الخروج: ${data.summary.totalExits}`,
    `إجمالي الحركات: ${data.summary.totalMovements}`,
  ];
  chips.forEach((c, i) => {
    const x = 40 + i * 180;
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(x, y - 14, 170, 24, 4, 4, "F");
    doc.setTextColor(4, 120, 87);
    doc.text(c, x + 10, y + 2);
  });

  // Table — note: jsPDF doesn't shape Arabic perfectly, but numbers/labels render.
  autoTable(doc, {
    startY: 120,
    head: [["#", "الاسم", "الصف", "رقم الطالب", "الدخول", "الخروج", "الإجمالي", "آخر دخول", "آخر خروج", "الحالة"]],
    body: data.rows.map((r, i) => [
      i + 1,
      r.name,
      r.grade,
      r.studentNumber,
      r.entries,
      r.exits,
      r.totalMovements,
      fmtDate(r.lastEntry),
      fmtDate(r.lastExit),
      r.active ? "نشط" : "موقوف",
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5, halign: "center" },
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: { 1: { halign: "right", cellWidth: 120 } },
    margin: { left: 40, right: 40 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Smart Gate — تم إنشاؤه بتاريخ ${new Date().toLocaleString("ar-EG")} — صفحة ${i}/${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 16,
      { align: "center" }
    );
  }

  doc.save(`smart-gate-attendance-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** Export the attendance report as an Excel (.xlsx) workbook. */
export function exportAttendanceExcel(data: ReportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: per-student summary
  const sheet1Data = [
    ["Smart Gate — تقرير الحضور والانصراف"],
    [`الفترة: ${fmtRange(data.summary.from, data.summary.to)}`],
    [],
    ["ملخص عام"],
    ["عدد الطلاب", data.summary.totalStudents],
    ["إجمالي الدخول", data.summary.totalEntries],
    ["إجمالي الخروج", data.summary.totalExits],
    ["إجمالي الحركات", data.summary.totalMovements],
    [],
    ["#", "الاسم", "الصف", "رقم الطالب", "الدخول", "الخروج", "الإجمالي", "آخر دخول", "آخر خروج", "ولي الأمر", "الموبايل", "الحالة"],
    ...data.rows.map((r, i) => [
      i + 1,
      r.name,
      r.grade,
      r.studentNumber,
      r.entries,
      r.exits,
      r.totalMovements,
      r.lastEntry ? new Date(r.lastEntry).toLocaleString("ar-EG") : "",
      r.lastExit ? new Date(r.lastExit).toLocaleString("ar-EG") : "",
      r.parentName ?? "",
      r.parentPhone ?? "",
      r.active ? "نشط" : "موقوف",
    ]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1["!cols"] = [
    { wch: 5 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 8 },
    { wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 18 },
    { wch: 14 }, { wch: 8 },
  ];
  ws1["!rtl"] = true;
  XLSX.utils.book_append_sheet(wb, ws1, "ملخص الحضور");

  // Sheet 2: raw movements (flat) derived from the rows for richer detail
  const sheet2Data: (string | number)[][] = [["نوع الحركة", "الطالب", "رقم الطالب", "الصف", "الوقت"]];
  data.rows.forEach((r) => {
    if (r.lastEntry)
      sheet2Data.push(["دخول", r.name, r.studentNumber, r.grade, new Date(r.lastEntry).toLocaleString("ar-EG")]);
    if (r.lastExit)
      sheet2Data.push(["خروج", r.name, r.studentNumber, r.grade, new Date(r.lastExit).toLocaleString("ar-EG")]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 22 }];
  ws2["!rtl"] = true;
  XLSX.utils.book_append_sheet(wb, ws2, "الحركات");

  XLSX.writeFile(wb, `smart-gate-attendance-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
