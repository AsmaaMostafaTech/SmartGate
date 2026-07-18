import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TEMP route: create the 'student-photos' storage bucket (public) + a public-read policy.
export async function POST() {
  const results: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to set up storage" },
      { status: 500 }
    );
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1) Create the bucket (idempotent)
  const { error: bucketErr } = await supabase.storage.createBucket("student-photos", {
    public: true,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    fileSizeLimit: "4MB",
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    results.push(`bucket: ${bucketErr.message}`);
  } else {
    results.push("✓ bucket student-photos ready (public, 4MB, images only)");
  }

  return NextResponse.json({ results });
}
