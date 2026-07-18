import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/materials/[id] - delete a material by id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await db.material.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/materials/[id]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المادة الدراسية" },
      { status: 500 }
    );
  }
}
