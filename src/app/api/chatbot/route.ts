import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT =
  "You are a helpful study assistant for school students. Answer questions based ONLY on the provided study material. If the question is not covered in the material, say you don't have information about that. Respond in Arabic. Be concise and educational.";

type HistoryMessage = { role: "user" | "assistant"; content: string };

// POST /api/chatbot
// Body: { question, grade, history? }
// Returns: { answer }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = String(body?.question ?? "").trim();
    const grade = String(body?.grade ?? "").trim();
    const historyRaw = Array.isArray(body?.history) ? body.history : [];

    if (!question) {
      return NextResponse.json(
        { error: "يرجى إدخال سؤال" },
        { status: 400 }
      );
    }

    if (!grade) {
      return NextResponse.json(
        { error: "يرجى تحديد الصف الدراسي" },
        { status: 400 }
      );
    }

    // Fetch all materials for that grade from DB
    const materials = await db.material.findMany({
      where: { grade },
      orderBy: { createdAt: "desc" },
    });

    if (materials.length === 0) {
      return NextResponse.json({
        answer:
          "عذراً، لا توجد مواد دراسية متاحة لهذا الصف حالياً. يرجى المحاولة لاحقاً أو اختيار صف آخر.",
      });
    }

    // Build the material context block
    const materialContext = materials
      .map(
        (m, i) =>
          `المادة ${i + 1}: ${m.title}\nالموضوع: ${m.subject}\nالمحتوى:\n${m.content}`
      )
      .join("\n\n---\n\n");

    const userMessage = `إليك المواد الدراسية المتاحة لهذا الصف:\n\n${materialContext}\n\nسؤال الطالب: ${question}`;

    // Build conversation history (only role+content messages)
    const history: HistoryMessage[] = historyRaw
      .filter((m: unknown): m is HistoryMessage => {
        if (typeof m !== "object" || m === null) return false;
        const role = (m as { role?: string }).role;
        const content = (m as { content?: string }).content;
        return (
          (role === "user" || role === "assistant") &&
          typeof content === "string" &&
          content.trim().length > 0
        );
      })
      .map((m) => ({
        role: m.role,
        content: String(m.content),
      }))
      .slice(-10); // keep last 10 turns max to stay under token limits

    const messages: { role: "system" | "user" | "assistant"; content: string }[] =
      [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessage },
      ];

    // Call the Z.ai LLM
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const answer =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "عذراً، لم أتمكن من توليد إجابة. حاول مرة أخرى.";

    return NextResponse.json({ answer });
  } catch (e) {
    console.error("POST /api/chatbot", e);
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء معالجة سؤالك. حاول مرة أخرى لاحقاً.",
      },
      { status: 500 }
    );
  }
}
