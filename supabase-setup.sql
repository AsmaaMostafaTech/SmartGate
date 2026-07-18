-- ============================================================
--  Smart Gate — Supabase setup
--  Run this in: Supabase Dashboard → SQL Editor → New query
--  AFTER running `bun run db:push` (which creates the tables).
-- ============================================================

-- 1) Add the notifications table to Supabase Realtime so INSERT events
--    are broadcast to subscribers (parents + admin).
alter publication supabase_realtime add table notifications;

-- 2) Enable Row Level Security and allow the browser (anon key) to read
--    notifications. This is what makes the real-time subscription work.
--    (For a production multi-tenant app you would tighten this with auth;
--     for the school demo a permissive read policy is fine.)
alter table notifications enable row level security;

drop policy if exists "notifications: public read for realtime" on notifications;
create policy "notifications: public read for realtime"
  on notifications
  for select
  to anon, authenticated
  using (true);
