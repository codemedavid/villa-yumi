-- Villa Yumi booking system — Supabase schema.
-- Paste this whole file once into Supabase → SQL Editor → Run.
-- Safe to re-run.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  guest_name        text not null,
  guest_email       text not null,
  guest_phone       text,
  check_in          date not null,
  check_out         date not null,
  nights            int  not null,
  guests            int  not null default 1,
  total             numeric(10,2) not null,
  confirmation_code text not null unique,
  gcash_reference   text,
  payment_proof_url text,
  status            text not null default 'pending'
                    check (status in ('pending','confirmed','cancelled'))
);

create index if not exists bookings_dates_idx on public.bookings (check_in, check_out);

-- Single-row site settings (id is always 1).
create table if not exists public.settings (
  id            int primary key default 1 check (id = 1),
  nightly_price numeric(10,2) not null default 5000,
  cleaning_fee  numeric(10,2) not null default 500,
  gcash_name    text,
  gcash_number  text,
  gcash_qr_url  text
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Gallery images shown on the home page (managed from /admin).
create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists gallery_url_key on public.gallery (url);

-- Manual availability blocks set by the owner from /admin.
-- A date with a row here is unavailable to guests. 'closed' = not operating,
-- 'reserved' = held manually. No row = open/bookable.
create table if not exists public.date_blocks (
  date       date primary key,
  status     text not null check (status in ('closed','reserved')),
  note       text,
  created_at timestamptz not null default now()
);

-- Seed with the photos already in /public/photos (safe to re-run).
insert into public.gallery (url, position) values
  ('/photos/p3.jpg', 0), ('/photos/p4.jpg', 1), ('/photos/p10.jpg', 2),
  ('/photos/p6.jpg', 3), ('/photos/p11.jpg', 4), ('/photos/p7.jpg', 5),
  ('/photos/p2.jpg', 6), ('/photos/p1.jpg', 7), ('/photos/p5.jpg', 8),
  ('/photos/p8.jpg', 9)
on conflict (url) do nothing;

-- ============================================================
-- Row Level Security
-- The app talks to Supabase only from the server, using the anon key.
-- These policies grant the anon role exactly the access the booking
-- system needs. (Admin actions are gated separately by ADMIN_PASSWORD
-- in the app, not by the database.)
-- ============================================================

alter table public.bookings enable row level security;
alter table public.settings enable row level security;
alter table public.gallery enable row level security;
alter table public.date_blocks enable row level security;

-- date_blocks: read by everyone, managed by the server.
drop policy if exists "date_blocks anon all" on public.date_blocks;
create policy "date_blocks anon all"
  on public.date_blocks for all
  to anon
  using (true)
  with check (true);

-- gallery: read by everyone, managed by the server.
drop policy if exists "gallery anon all" on public.gallery;
create policy "gallery anon all"
  on public.gallery for all
  to anon
  using (true)
  with check (true);

-- bookings: guests create them; the server reads + updates status.
drop policy if exists "bookings anon all" on public.bookings;
create policy "bookings anon all"
  on public.bookings for all
  to anon
  using (true)
  with check (true);

-- settings: read by everyone, updated by the server.
drop policy if exists "settings anon all" on public.settings;
create policy "settings anon all"
  on public.settings for all
  to anon
  using (true)
  with check (true);

-- ============================================================
-- Storage bucket for GCash QR + payment screenshots (public read).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('villa-public', 'villa-public', true)
on conflict (id) do nothing;

-- Read, upload, and replace objects in this bucket (QR image + payment
-- screenshots). Scoped to the single 'villa-public' bucket.
drop policy if exists "villa-public read" on storage.objects;
create policy "villa-public read"
  on storage.objects for select
  using (bucket_id = 'villa-public');

drop policy if exists "villa-public insert" on storage.objects;
create policy "villa-public insert"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'villa-public');

drop policy if exists "villa-public update" on storage.objects;
create policy "villa-public update"
  on storage.objects for update
  to anon
  using (bucket_id = 'villa-public')
  with check (bucket_id = 'villa-public');
