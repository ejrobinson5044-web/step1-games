create table if not exists public.step1_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.step1_progress enable row level security;

drop policy if exists "Users can read their own Step 1 progress" on public.step1_progress;
drop policy if exists "Users can insert their own Step 1 progress" on public.step1_progress;
drop policy if exists "Users can update their own Step 1 progress" on public.step1_progress;

create policy "Users can read their own Step 1 progress"
on public.step1_progress
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own Step 1 progress"
on public.step1_progress
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own Step 1 progress"
on public.step1_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
