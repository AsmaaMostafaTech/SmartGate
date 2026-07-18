// Shared types for Smart Gate

export type Role = "student" | "security" | "admin" | "parent" | "teacher";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "announcement" | "assignment";
  authorName: string;
  authorRole: string;
  subject?: string | null;
  grade?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  subject: string;
  grade: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  studentNumber: string;
  qrToken: string;
  qrSecret?: string;
  active: boolean;
  photoUrl?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number; notifications?: number };
}

export type LogType = "ENTRY" | "EXIT";

export interface LogEntry {
  id: string;
  studentId: string;
  type: LogType;
  createdAt: string;
  student?: Student;
}

export interface ScanResult {
  allowed: boolean;
  reason?: string;
  message: string;
  action?: LogType;
  notifiedParent?: boolean;
  channels?: {
    inApp: boolean;
    email: boolean;
    emailReason?: string;
  };
  student?: {
    id: string;
    name: string;
    grade: string;
    studentNumber: string;
    photoUrl?: string | null;
  };
  log?: {
    id: string;
    type: LogType;
    createdAt: string;
  };
}

export interface NotificationEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: string;
  type: LogType;
  message: string;
  parentName?: string | null;
  parentPhone?: string | null;
  read: boolean;
  createdAt: string;
  student?: Student;
}

// Real-time notification received from Supabase Realtime (Postgres Changes)
export interface RealtimeNotification {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  studentNumber: string;
  type: LogType;
  message: string;
  parentName?: string | null;
  parentPhone?: string | null;
  createdAt: string;
}

export interface Stats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  todayEntries: number;
  todayExits: number;
  todayLogs: number;
  todayNotifications: number;
  presentNow: number;
  hours: { hour: string; entries: number; exits: number }[];
}

// Arabic grade options
export const GRADES = [
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
] as const;

// Format a date for display in Arabic
export function formatArabicDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatArabicTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatArabicDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
