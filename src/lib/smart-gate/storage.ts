import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client with the service-role key (admin).
// Used ONLY in API routes — never import this in a client component.
// It bypasses RLS and is used to upload student photos to the
// 'student-photos' storage bucket.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const STORAGE_BUCKET = "student-photos";
