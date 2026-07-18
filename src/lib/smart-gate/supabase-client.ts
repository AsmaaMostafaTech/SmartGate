"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client used for real-time subscriptions only.
// The Next.js API routes still read/write the database through Prisma (server-side),
// using the DATABASE_URL — this client never touches the DB directly except via
// the real-time Postgres-changes feed (which needs the publishable/anon key + RLS).
//
// Supports both the new publishable key (sb_publishable_...) and the legacy
// anon key (eyJ...) — whichever is provided.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
