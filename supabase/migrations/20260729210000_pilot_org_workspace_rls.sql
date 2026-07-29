-- Pilot hardening: org-scoped workspace RLS + helpers for multi-user shops
-- Idempotent / safe to re-run

-- Ensure organization_id stays populated when possible
create or replace function public.touch_workspace_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null then
    select m.organization_id into new.organization_id
    from public.organization_members m
    where m.user_id = new.user_id
    order by case when m.role = 'owner' then 0 else 1 end, m.created_at
    limit 1;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rodstack_workspaces_touch_org on public.rodstack_workspaces;
create trigger rodstack_workspaces_touch_org
  before insert or update on public.rodstack_workspaces
  for each row execute function public.touch_workspace_org();

-- Replace workspace policies: own row, same-org members, or platform admin.
-- Cross-organization access remains denied for normal users.
drop policy if exists "workspace_select_own_or_admin" on public.rodstack_workspaces;
drop policy if exists "workspace_insert_own" on public.rodstack_workspaces;
drop policy if exists "workspace_update_own" on public.rodstack_workspaces;
drop policy if exists "Users read own workspace" on public.rodstack_workspaces;
drop policy if exists "Users upsert own workspace" on public.rodstack_workspaces;
drop policy if exists "Users update own workspace" on public.rodstack_workspaces;

create policy "workspace_select_tenant"
  on public.rodstack_workspaces for select
  using (
    auth.uid() = user_id
    or public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

create policy "workspace_insert_own"
  on public.rodstack_workspaces for insert
  with check (auth.uid() = user_id);

create policy "workspace_update_tenant"
  on public.rodstack_workspaces for update
  using (
    auth.uid() = user_id
    or public.is_platform_admin()
    or (
      organization_id is not null
      and public.has_org_role(organization_id, array['owner', 'admin', 'builder']::public.org_role[])
    )
  )
  with check (
    auth.uid() = user_id
    or public.is_platform_admin()
    or (
      organization_id is not null
      and public.has_org_role(organization_id, array['owner', 'admin', 'builder']::public.org_role[])
    )
  );

-- Secure RPC: add an existing user to an organization (service_role only)
create or replace function public.add_user_to_organization(
  target_email text,
  target_org_id uuid,
  member_role public.org_role default 'builder',
  copy_workspace boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.profiles%rowtype;
  org public.organizations%rowtype;
  existing uuid;
  owner_ws jsonb;
begin
  if target_email is null or target_org_id is null then
    raise exception 'target_email and target_org_id are required';
  end if;

  select * into target from public.profiles where lower(email) = lower(trim(target_email));
  if target.id is null then
    raise exception 'User profile not found for email %', target_email;
  end if;

  select * into org from public.organizations where id = target_org_id;
  if org.id is null then
    raise exception 'Organization not found';
  end if;

  select m.id into existing
  from public.organization_members m
  where m.organization_id = target_org_id and m.user_id = target.id;

  if existing is null then
    insert into public.organization_members (organization_id, user_id, role)
    values (target_org_id, target.id, member_role);
  else
    update public.organization_members
    set role = member_role
    where id = existing;
  end if;

  if copy_workspace then
    select w.payload into owner_ws
    from public.rodstack_workspaces w
    where w.user_id = org.owner_id
    limit 1;

    if owner_ws is not null then
      insert into public.rodstack_workspaces (user_id, organization_id, payload, updated_at)
      values (target.id, target_org_id, owner_ws, now())
      on conflict (user_id) do update
        set organization_id = excluded.organization_id,
            payload = excluded.payload,
            updated_at = now();
    else
      insert into public.rodstack_workspaces (user_id, organization_id, payload, updated_at)
      values (target.id, target_org_id, '{}'::jsonb, now())
      on conflict (user_id) do update
        set organization_id = excluded.organization_id,
            updated_at = now();
    end if;
  end if;

  insert into public.audit_logs (actor_id, action, resource_type, resource_id, organization_id, metadata)
  values (
    coalesce(auth.uid(), org.owner_id),
    'admin.add_user_to_organization',
    'organization_members',
    target.id::text,
    target_org_id,
    jsonb_build_object(
      'email', target.email,
      'role', member_role,
      'copy_workspace', copy_workspace
    )
  );

  return jsonb_build_object(
    'ok', true,
    'user_id', target.id,
    'email', target.email,
    'organization_id', target_org_id,
    'organization_name', org.name,
    'role', member_role,
    'workspace_copied', copy_workspace and owner_ws is not null
  );
end;
$$;

revoke all on function public.add_user_to_organization(text, uuid, public.org_role, boolean) from public;
revoke all on function public.add_user_to_organization(text, uuid, public.org_role, boolean) from anon;
revoke all on function public.add_user_to_organization(text, uuid, public.org_role, boolean) from authenticated;
grant execute on function public.add_user_to_organization(text, uuid, public.org_role, boolean) to service_role;
