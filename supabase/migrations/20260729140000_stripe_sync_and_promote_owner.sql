-- Additive Stripe sync + secure owner promotion (idempotent)
-- Safe to re-run on environments that already applied 20260729120000_*

-- ─── Extend subscriptions for Stripe ─────────────────────────────────────────

alter table public.subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_product_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_start timestamptz;

create unique index if not exists subscriptions_stripe_subscription_id_uidx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

-- ─── Stripe event ledger (idempotency) ───────────────────────────────────────

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  livemode boolean not null default false,
  organization_id uuid references public.organizations (id) on delete set null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

alter table public.stripe_events enable row level security;

drop policy if exists "stripe_events_select_admin" on public.stripe_events;
create policy "stripe_events_select_admin" on public.stripe_events
  for select using (public.is_platform_admin());

grant select on public.stripe_events to authenticated;

-- ─── Secure platform owner promotion (service_role only) ─────────────────────

create or replace function public.promote_platform_owner(
  target_email text default null,
  target_user_id uuid default null,
  desired_role public.platform_role default 'platform_owner'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.profiles%rowtype;
  previous_role public.platform_role;
  actor uuid := auth.uid(); -- null when called with service role key without JWT
begin
  if target_email is null and target_user_id is null then
    raise exception 'target_email or target_user_id required';
  end if;

  if target_user_id is not null then
    select * into target from public.profiles where id = target_user_id;
  else
    select * into target from public.profiles where lower(email) = lower(trim(target_email));
  end if;

  if target.id is null then
    raise exception 'User profile not found for given email/id';
  end if;

  select pa.platform_role into previous_role
  from public.platform_admins pa
  where pa.user_id = target.id;

  insert into public.platform_admins (user_id, platform_role, created_by)
  values (target.id, desired_role, actor)
  on conflict (user_id) do update
    set platform_role = excluded.platform_role;

  insert into public.audit_logs (actor_id, action, resource_type, resource_id, metadata)
  values (
    coalesce(actor, target.id),
    'admin.promote_platform_owner',
    'platform_admins',
    target.id::text,
    jsonb_build_object(
      'email', target.email,
      'previous_role', previous_role,
      'new_role', desired_role
    )
  );

  return jsonb_build_object(
    'ok', true,
    'user_id', target.id,
    'email', target.email,
    'previous_role', previous_role,
    'platform_role', desired_role
  );
end;
$$;

revoke all on function public.promote_platform_owner(text, uuid, public.platform_role) from public;
revoke all on function public.promote_platform_owner(text, uuid, public.platform_role) from anon;
revoke all on function public.promote_platform_owner(text, uuid, public.platform_role) from authenticated;
grant execute on function public.promote_platform_owner(text, uuid, public.platform_role) to service_role;

-- Map Stripe price IDs → tiers via app metadata or helper
create or replace function public.tier_from_stripe_price(price_id text, metadata jsonb default '{}'::jsonb)
returns public.subscription_tier
language plpgsql
immutable
as $$
declare
  meta_tier text := lower(coalesce(metadata->>'tier', metadata->>'plan', ''));
begin
  if meta_tier in ('free', 'pro', 'enterprise') then
    return meta_tier::public.subscription_tier;
  end if;
  if price_id is null then
    return 'free';
  end if;
  -- Fallback: callers should pass metadata.tier from Stripe Price/Product metadata
  return 'pro';
end;
$$;
