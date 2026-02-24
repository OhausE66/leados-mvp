-- Enable UUID helper
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  leadership_level text not null,
  industry text not null,
  team_size text not null,
  team_setup text not null,
  tone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  notes_private text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.one_on_ones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  input_context text not null,
  output_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_goal text not null,
  challenge text not null,
  output_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  situation text not null,
  goal text not null,
  questions text[] not null default '{}',
  example_phrases text[] not null default '{}',
  followups text[] not null default '{}'
);

alter table public.profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.notes enable row level security;
alter table public.one_on_ones enable row level security;
alter table public.daily_briefings enable row level security;
alter table public.templates enable row level security;

create policy "profiles owner all"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "team_members owner all"
  on public.team_members
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes owner all"
  on public.notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "one_on_ones owner all"
  on public.one_on_ones
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_briefings owner all"
  on public.daily_briefings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "templates readable by authenticated"
  on public.templates
  for select
  to authenticated
  using (true);
