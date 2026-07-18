import NextAuth from "next-auth";
import { authOptions } from "@/lib/smart-gate/auth";

// Force the Node.js runtime (not Edge) — required for NextAuth v4 on Vercel.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
