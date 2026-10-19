-- ── Reading progress table ────────────────────────────────────────────────────
-- Tracks which page each user is currently on. One row per user, upserted on every page change.
create table if not exists reading_progress (
  username    text primary key check (username in ('harshuu','sashank')),
  page_number integer not null default 1,
  updated_at  timestamptz not null default now()
);

alter table reading_progress enable row level security;

create policy "Authenticated users can read progress"
  on reading_progress for select
  to authenticated using (true);

create policy "Authenticated users can upsert progress"
  on reading_progress for insert
  to authenticated with check (true);

create policy "Authenticated users can update progress"
  on reading_progress for update
  to authenticated using (true);

-- Enable realtime for this table too
-- Go to Supabase Dashboard > Database > Replication > reading_progress > enable
