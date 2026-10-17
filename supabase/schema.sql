-- ─────────────────────────────────────────────────────────────────────────────
-- Book Boo — Supabase Schema
-- Run this in the Supabase SQL editor (project > SQL Editor > New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Threads table ─────────────────────────────────────────────────────────────
-- A thread is anchored to a specific location in the book
create table if not exists threads (
  id           uuid primary key default gen_random_uuid(),
  page_number  integer not null,
  selected_text text,                                    -- the highlighted text (empty for full-page threads)
  anchor_type  text not null default 'page'              -- word | phrase | sentence | paragraph | page | chapter
                check (anchor_type in ('word','phrase','sentence','paragraph','page','chapter')),
  created_by   text not null                             -- harshuu | sashank
                check (created_by in ('harshuu','sashank')),
  created_at   timestamptz not null default now()
);

-- Index for fast per-page queries
create index if not exists threads_page_number_idx on threads (page_number);
create index if not exists threads_created_at_idx  on threads (created_at desc);

-- ── Replies table ─────────────────────────────────────────────────────────────
-- Each reply is a message in a thread
create table if not exists replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references threads(id) on delete cascade,
  content    text not null,
  created_by text not null
               check (created_by in ('harshuu','sashank')),
  created_at timestamptz not null default now()
);

create index if not exists replies_thread_id_idx  on replies (thread_id);
create index if not exists replies_created_at_idx on replies (created_at asc);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table threads enable row level security;
alter table replies enable row level security;

-- Both authenticated users can read everything
create policy "Authenticated users can read threads"
  on threads for select
  to authenticated
  using (true);

create policy "Authenticated users can insert threads"
  on threads for insert
  to authenticated
  with check (true);

create policy "Authenticated users can read replies"
  on replies for select
  to authenticated
  using (true);

create policy "Authenticated users can insert replies"
  on replies for insert
  to authenticated
  with check (true);

-- ── Supabase Storage bucket ───────────────────────────────────────────────────
-- Run this to create the 'books' bucket (public read)
insert into storage.buckets (id, name, public)
values ('books', 'books', true)
on conflict (id) do nothing;

-- Allow authenticated users to read from the books bucket
create policy "Public read for books"
  on storage.objects for select
  using (bucket_id = 'books');

-- ── Auth: Create the two users ────────────────────────────────────────────────
-- DO THIS in the Supabase Auth dashboard (Authentication > Users > Add user)
-- or via the Supabase JS client once (see README).
--
-- User 1:  harshuu@bookboo.app  / <password>
-- User 2:  sashank@bookboo.app  / <password>
--
-- Passwords are set by you — pick something you'll both remember.

-- ── Realtime: Enable for both tables ─────────────────────────────────────────
-- In the Supabase dashboard: Database > Replication > Tables
-- Enable realtime for: threads, replies
