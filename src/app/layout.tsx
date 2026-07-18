import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Gate - البوابة الذكية لإدارة دخول الطلاب",
  description:
    "نظام ذكي لإدارة دخول وخروج الطلاب داخل المدرسة باستخدام QR Code بدل الطرق التقليدية.",
  keywords: ["Smart Gate", "QR Code", "حضور", "انصراف", "مدارس", "بوابة ذكية"],
  authors: [{ name: "Smart Gate" }],
  // favicon is auto-served from src/app/icon.png (Next.js file convention)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
