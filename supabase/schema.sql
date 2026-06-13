-- ================================================================
-- FinMate AI — Complete Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ypvysfgmvgxulxjctsle/sql/new
-- ================================================================

-- ============================================================
-- EXTENSION
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES — Extended user data (linked to auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  telegram_id bigint unique,
  telegram_username text,
  telegram_connected_at timestamptz,
  financial_goal text default 'Mengontrol pengeluaran',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SUBSCRIPTIONS — User subscription plans
-- ============================================================
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null default 'trial' check (plan in ('trial', 'monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  amount integer default 0,
  started_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  midtrans_order_id text,
  midtrans_transaction_id text,
  created_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES — Transaction categories (default + custom)
-- ============================================================
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  icon text default 'tag',
  color text default '#6366f1',
  type text not null default 'both' check (type in ('income', 'expense', 'both')),
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Default categories (shared, no user_id)
insert into public.categories (id, name, icon, color, type, is_default) values
  (uuid_generate_v4(), 'Makanan', 'utensils', '#f97316', 'expense', true),
  (uuid_generate_v4(), 'Transportasi', 'car', '#3b82f6', 'expense', true),
  (uuid_generate_v4(), 'Hiburan', 'film', '#a855f7', 'expense', true),
  (uuid_generate_v4(), 'Belanja', 'shopping-bag', '#ec4899', 'expense', true),
  (uuid_generate_v4(), 'Tagihan', 'file-text', '#14b8a6', 'expense', true),
  (uuid_generate_v4(), 'Kesehatan', 'heart', '#ef4444', 'expense', true),
  (uuid_generate_v4(), 'Pendidikan', 'book', '#8b5cf6', 'expense', true),
  (uuid_generate_v4(), 'Gaji', 'wallet', '#22c55e', 'income', true),
  (uuid_generate_v4(), 'Freelance', 'briefcase', '#10b981', 'income', true),
  (uuid_generate_v4(), 'Investasi', 'trending-up', '#06b6d4', 'income', true),
  (uuid_generate_v4(), 'Lainnya', 'more-horizontal', '#64748b', 'both', true)
on conflict do nothing;

-- ============================================================
-- TRANSACTIONS — All financial transactions
-- ============================================================
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0),
  category_id uuid references public.categories(id),
  category_name text,
  description text not null,
  note text,
  date date not null default current_date,
  source text default 'web' check (source in ('web', 'telegram', 'voice', 'photo')),
  receipt_url text,
  ai_parsed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BUDGETS — Monthly budget per category
-- ============================================================
create table if not exists public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id),
  category_name text not null,
  amount bigint not null check (amount > 0),
  month integer not null check (month between 1 and 12),
  year integer not null,
  created_at timestamptz default now(),
  unique (user_id, category_name, month, year)
);

-- ============================================================
-- GOALS — Savings / financial targets
-- ============================================================
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  target_amount bigint not null check (target_amount > 0),
  current_amount bigint default 0 check (current_amount >= 0),
  icon text default 'target',
  color text default '#3b82f6',
  deadline date,
  status text default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- REPORTS — Generated financial reports
-- ============================================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('monthly', 'yearly', 'custom')),
  period_start date not null,
  period_end date not null,
  pdf_url text,
  gdoc_url text,
  ai_insights jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- AI CHAT HISTORY — Conversation logs per user
-- ============================================================
create table if not exists public.ai_chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  context_data jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- PAYMENT HISTORY — Midtrans payment records
-- ============================================================
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id),
  plan text not null,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'refunded')),
  midtrans_order_id text unique,
  midtrans_snap_token text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ERROR LOGS — System monitoring
-- ============================================================
create table if not exists public.error_logs (
  id uuid default uuid_generate_v4() primary key,
  service text not null,
  error_type text not null,
  message text not null,
  stack_trace text,
  metadata jsonb,
  status text default 'unresolved' check (status in ('unresolved', 'resolved', 'ignored')),
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz default now()
);

-- Insert some sample error logs for admin demo
insert into public.error_logs (service, error_type, message, status) values
  ('n8n Workflow', 'Webhook Timeout', 'Failed to process incoming transaction receipt from Telegram.', 'unresolved'),
  ('Supabase DB', 'Connection Pool', 'Maximum connection pool size reached during peak hours.', 'resolved'),
  ('OpenAI API', 'Rate Limit', 'Exceeded quota for gpt-4o model requests.', 'unresolved'),
  ('Telegram Bot', 'API Error', 'Bad Request: chat not found.', 'resolved')
on conflict do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.reports enable row level security;
alter table public.ai_chats enable row level security;
alter table public.payments enable row level security;
alter table public.error_logs enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Subscriptions policies
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id);

-- Categories policies (see own + default)
create policy "Users can view categories" on public.categories for select using (auth.uid() = user_id or is_default = true);
create policy "Users can insert own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Budgets policies
create policy "Users can view own budgets" on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets for delete using (auth.uid() = user_id);

-- Goals policies
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

-- Reports policies
create policy "Users can view own reports" on public.reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports" on public.reports for insert with check (auth.uid() = user_id);

-- AI Chats policies
create policy "Users can view own chats" on public.ai_chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on public.ai_chats for insert with check (auth.uid() = user_id);

-- Payments policies
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);

-- Error logs — admin only (no RLS bypass needed for service role)
create policy "Error logs are visible to all authenticated users" on public.error_logs for select using (auth.role() = 'authenticated');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile after user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.subscriptions (user_id, plan, status, expires_at)
  values (new.id, 'trial', 'active', now() + interval '14 days');

  return new;
end;
$$;

-- Trigger: run handle_new_user after auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_transactions_updated_at before update on public.transactions
  for each row execute procedure public.handle_updated_at();

create trigger handle_goals_updated_at before update on public.goals
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(date desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_budgets_user_month on public.budgets(user_id, month, year);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_ai_chats_user_id on public.ai_chats(user_id, created_at desc);
create index if not exists idx_error_logs_status on public.error_logs(status, created_at desc);
