-- RodStack workspace payload (one row per user, last-write-wins sync)
create table if not exists public.rodstack_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.rodstack_workspaces enable row level security;

create policy "Users read own workspace"
  on public.rodstack_workspaces for select
  using (auth.uid() = user_id);

create policy "Users upsert own workspace"
  on public.rodstack_workspaces for insert
  with check (auth.uid() = user_id);

create policy "Users update own workspace"
  on public.rodstack_workspaces for update
  using (auth.uid() = user_id);
