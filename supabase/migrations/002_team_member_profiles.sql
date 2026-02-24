create table if not exists public.team_member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  profile_json jsonb not null,
  source_answers jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.team_member_profiles enable row level security;

create policy "team_member_profiles owner all"
  on public.team_member_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
