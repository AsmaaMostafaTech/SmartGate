import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

// Smart Gate authentication.
// The Management dashboard (admin) is gated by a single email/password
// credential backed by environment variables (ADMIN_EMAIL / ADMIN_PASSWORD).
// This keeps the project simple for the demo while proving "real" auth
// (JWT session, protected server components, server actions) works end-to-end.
//
// A third CredentialsProvider ("teacher") authenticates teachers against the
// `Teacher` table in the database (plain-text password comparison for the demo).

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SECURITY_PIN = process.env.SECURITY_PIN;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin",
      name: "الإدارة",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email &&
          credentials?.password &&
          ADMIN_EMAIL &&
          ADMIN_PASSWORD &&
          credentials.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
          credentials.password === ADMIN_PASSWORD
        ) {
          return {
            id: "admin",
            email: ADMIN_EMAIL,
            name: "الإدارة",
            role: "admin" as const,
          };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "security",
      name: "الأمن",
      credentials: {
        pin: { label: "رمز الأمن", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.pin &&
          SECURITY_PIN &&
          credentials.pin === SECURITY_PIN
        ) {
          return {
            id: "security",
            name: "فرد الأمن",
            role: "security" as const,
          };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "teacher",
      name: "المعلم",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        try {
          const teacher = await db.teacher.findUnique({
            where: { email },
          });
          if (!teacher) return null;
          // Plain-text comparison for the demo (do NOT use in production).
          if (teacher.password !== password) return null;
          return {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            role: "teacher" as const,
            // stash subject on the user object so the session callback can
            // expose it to the client.
            subject: teacher.subject,
          } as unknown as {
            id: string;
            email: string;
            name: string;
            role: string;
          };
        } catch (e) {
          console.error("teacher authorize", e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 }, // 12h
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        // Carry the teacher's subject onto the JWT for the session.
        const subject = (user as { subject?: string }).subject;
        if (subject) {
          (token as { subject?: string }).subject = subject;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as { role?: string }).role = token.role as string;
      }
      const subject = (token as { subject?: string }).subject;
      if (session.user && subject) {
        (session.user as { subject?: string }).subject = subject;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // On Vercel, NEXTAUTH_URL should match the deployment URL. If unset,
  // NextAuth tries to infer it from request headers (works in most cases).
  ...(process.env.NEXTAUTH_URL
    ? { url: process.env.NEXTAUTH_URL }
    : {}),
};
