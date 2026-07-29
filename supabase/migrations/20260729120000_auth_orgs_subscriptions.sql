-- RodStack Prompt 2: auth, orgs, platform roles, subscriptions, entitlements, audit
-- Apply via: supabase db push | supabase migration up | SQL editor

create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type public.org_role as enum ('owner', 'admin', 'builder', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.platform_role as enum ('platform_owner', 'support_admin', 'read_only_support');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_tier as enum ('free', 'pro', 'enterprise');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null;
end $$;

-- ─── Profiles ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  builder_name text,
  shop_name text,
  avatar_url text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ─── Organizations ───────────────────────────────────────────────────────────

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_owner_idx on public.organizations (owner_id);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.org_role not null default 'builder',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_idx on public.organization_members (user_id);
create index if not exists organization_members_org_idx on public.organization_members (organization_id);

-- ─── Platform admins ─────────────────────────────────────────────────────────

create table if not exists public.platform_admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  platform_role public.platform_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

-- ─── Subscriptions & entitlements ────────────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  current_period_end timestamptz,
  stripe_customer_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tier public.subscription_tier not null,
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists subscription_overrides_org_active_idx
  on public.subscription_overrides (organization_id)
  where active = true;

create table if not exists public.feature_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default true,
  source text not null check (source in ('subscription', 'override', 'preview', 'manual')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, feature_key)
);

-- ─── Plan preview & support view sessions ────────────────────────────────────

create table if not exists public.plan_preview_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  preview_tier public.subscription_tier not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active boolean not null default true
);

create table if not exists public.support_view_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active boolean not null default true
);

-- ─── Audit logs ──────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  organization_id uuid references public.organizations (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_org_idx on public.audit_logs (organization_id);

-- ─── Workspaces (retain + org link) ──────────────────────────────────────────

create table if not exists public.rodstack_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists feature_entitlements_updated_at on public.feature_entitlements;
create trigger feature_entitlements_updated_at before update on public.feature_entitlements
  for each row execute function public.set_updated_at();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid()
  );
$$;

create or replace function public.get_platform_role()
returns public.platform_role
language sql
stable
security definer
set search_path = public
as $$
  select pa.platform_role from public.platform_admins pa where pa.user_id = auth.uid();
$$;

create or replace function public.can_write_platform()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = auth.uid()
      and pa.platform_role in ('platform_owner', 'support_admin')
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = any (allowed)
  );
$$;

-- Default entitlements by tier
create or replace function public.tier_feature_keys(t public.subscription_tier)
returns text[]
language sql
immutable
as $$
  select case t
    when 'free' then array['bench', 'vault', 'forms']
    when 'pro' then array['bench', 'vault', 'forms', 'crm', 'inventory', 'analytics', 'photos']
    when 'enterprise' then array['bench', 'vault', 'forms', 'crm', 'inventory', 'analytics', 'photos', 'api', 'sso', 'priority_support']
  end;
$$;

create or replace function public.refresh_org_entitlements(org_id uuid, src text default 'subscription')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_tier public.subscription_tier := 'free';
  preview_tier public.subscription_tier;
  override_tier public.subscription_tier;
  keys text[];
  k text;
begin
  select s.tier into effective_tier
  from public.subscriptions s
  where s.organization_id = org_id;

  select o.tier into override_tier
  from public.subscription_overrides o
  where o.organization_id = org_id
    and o.active = true
    and (o.ends_at is null or o.ends_at > now())
  order by o.created_at desc
  limit 1;

  if override_tier is not null then
    effective_tier := override_tier;
    src := 'override';
  end if;

  select p.preview_tier into preview_tier
  from public.plan_preview_sessions p
  where p.organization_id = org_id
    and p.active = true
    and p.ended_at is null
  order by p.started_at desc
  limit 1;

  if preview_tier is not null then
    effective_tier := preview_tier;
    src := 'preview';
  end if;

  keys := public.tier_feature_keys(coalesce(effective_tier, 'free'));

  delete from public.feature_entitlements
  where organization_id = org_id
    and source in ('subscription', 'override', 'preview');

  foreach k in array keys loop
    insert into public.feature_entitlements (organization_id, feature_key, enabled, source)
    values (org_id, k, true, src)
    on conflict (organization_id, feature_key)
    do update set enabled = true, source = excluded.source, updated_at = now(), expires_at = null;
  end loop;
end;
$$;

-- ─── Auth trigger: profile + personal org ────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  base_slug text;
  final_slug text;
begin
  insert into public.profiles (id, email, full_name, builder_name, shop_name, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'builder_name'),
    new.raw_user_meta_data->>'builder_name',
    new.raw_user_meta_data->>'shop_name',
    case when new.email_confirmed_at is not null then new.email_confirmed_at else null end
  )
  on conflict (id) do update set
    email = excluded.email,
    email_verified_at = coalesce(public.profiles.email_verified_at, excluded.email_verified_at),
    updated_at = now();

  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'shop_name', split_part(new.email, '@', 1), 'shop'),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'shop'; end if;
  final_slug := base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug, owner_id)
  values (
    coalesce(nullif(new.raw_user_meta_data->>'shop_name', ''), 'My Workshop'),
    final_slug,
    new.id
  )
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  insert into public.subscriptions (organization_id, tier, status)
  values (org_id, 'free', 'active');

  insert into public.rodstack_workspaces (user_id, organization_id, payload)
  values (new.id, org_id, '{}'::jsonb)
  on conflict (user_id) do update set organization_id = coalesce(public.rodstack_workspaces.organization_id, excluded.organization_id);

  perform public.refresh_org_entitlements(org_id, 'subscription');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.profiles
    set email_verified_at = new.email_confirmed_at, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_verified on auth.users;
create trigger on_auth_user_email_verified
  after update of email_confirmed_at on auth.users
  for each row execute function public.sync_profile_email_verified();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_overrides enable row level security;
alter table public.feature_entitlements enable row level security;
alter table public.plan_preview_sessions enable row level security;
alter table public.support_view_sessions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rodstack_workspaces enable row level security;

-- Profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_platform_admin()
    or exists (
      select 1 from public.organization_members me
      join public.organization_members them on them.organization_id = me.organization_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Organizations
drop policy if exists "orgs_select_member_or_admin" on public.organizations;
create policy "orgs_select_member_or_admin" on public.organizations
  for select using (public.is_org_member(id) or public.is_platform_admin());

drop policy if exists "orgs_update_owner_admin" on public.organizations;
create policy "orgs_update_owner_admin" on public.organizations
  for update using (
    public.has_org_role(id, array['owner', 'admin']::public.org_role[])
    or public.can_write_platform()
  );

-- Members
drop policy if exists "members_select" on public.organization_members;
create policy "members_select" on public.organization_members
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "members_manage" on public.organization_members;
create policy "members_manage" on public.organization_members
  for all using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
    or public.can_write_platform()
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
    or public.can_write_platform()
  );

-- Platform admins: users can read own row; only service role / owners manage via functions
drop policy if exists "platform_admins_select" on public.platform_admins;
create policy "platform_admins_select" on public.platform_admins
  for select using (user_id = auth.uid() or public.is_platform_admin());

-- Subscriptions / entitlements: org members read; writes via service role / edge
drop policy if exists "subscriptions_select" on public.subscriptions;
create policy "subscriptions_select" on public.subscriptions
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "overrides_select" on public.subscription_overrides;
create policy "overrides_select" on public.subscription_overrides
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "entitlements_select" on public.feature_entitlements;
create policy "entitlements_select" on public.feature_entitlements
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "preview_select_admin" on public.plan_preview_sessions;
create policy "preview_select_admin" on public.plan_preview_sessions
  for select using (public.is_platform_admin());

drop policy if exists "support_select_admin" on public.support_view_sessions;
create policy "support_select_admin" on public.support_view_sessions
  for select using (public.is_platform_admin());

drop policy if exists "audit_select_admin" on public.audit_logs;
create policy "audit_select_admin" on public.audit_logs
  for select using (public.is_platform_admin());

-- Workspaces: own row or platform admin (support view uses edge + service role for cross-tenant)
drop policy if exists "Users read own workspace" on public.rodstack_workspaces;
drop policy if exists "Users upsert own workspace" on public.rodstack_workspaces;
drop policy if exists "Users update own workspace" on public.rodstack_workspaces;

create policy "workspace_select_own_or_admin" on public.rodstack_workspaces
  for select using (auth.uid() = user_id or public.is_platform_admin());

create policy "workspace_insert_own" on public.rodstack_workspaces
  for insert with check (auth.uid() = user_id);

create policy "workspace_update_own" on public.rodstack_workspaces
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Grants ──────────────────────────────────────────────────────────────────

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.platform_admins to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.subscription_overrides to authenticated;
grant select on public.feature_entitlements to authenticated;
grant select on public.plan_preview_sessions to authenticated;
grant select on public.support_view_sessions to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert, update on public.rodstack_workspaces to authenticated;

-- Seed note: promote a platform owner after first signup:
-- insert into public.platform_admins (user_id, platform_role)
-- values ('<user-uuid>', 'platform_owner');
