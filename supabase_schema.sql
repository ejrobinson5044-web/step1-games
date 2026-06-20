create table if not exists public.step1_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.step1_progress enable row level security;

drop policy if exists "Users can read their own Step 1 progress" on public.step1_progress;
drop policy if exists "Users can insert their own Step 1 progress" on public.step1_progress;
drop policy if exists "Users can update their own Step 1 progress" on public.step1_progress;
drop policy if exists "Users can delete their own Step 1 progress" on public.step1_progress;

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

create policy "Users can delete their own Step 1 progress"
on public.step1_progress
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.step1_progress where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
