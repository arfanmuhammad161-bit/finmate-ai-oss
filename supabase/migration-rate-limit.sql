-- ============================================================
-- MIGRATION: Rate Limiting untuk endpoint AI
-- Jalankan SQL ini di Supabase SQL Editor (sekali saja).
-- Tujuan: cegah abuse endpoint AI yang menghabiskan kuota
-- Gemini gratis Anda.
-- ============================================================

-- Tabel counter penggunaan AI per user dan per bucket waktu
create table if not exists public.ai_usage_counters (
  user_id uuid not null,
  bucket text not null, -- format: "hour:2026-06-15T03" atau "day:2026-06-15"
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

-- Index untuk cleanup row lama
create index if not exists idx_ai_usage_updated on public.ai_usage_counters(updated_at);

-- RLS: hanya service role yang boleh tulis. User tidak akses langsung.
alter table public.ai_usage_counters enable row level security;

-- Optional: auto-cleanup rows lebih dari 7 hari (jalankan manual atau pakai cron)
-- delete from public.ai_usage_counters where updated_at < now() - interval '7 days';
