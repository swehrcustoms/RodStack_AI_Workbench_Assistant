import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type PlatformRole = "platform_owner" | "support_admin" | "read_only_support";

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function createUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req: Request): Promise<{ user: User; authHeader: string }> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Authorization bearer token");
  }
  const userClient = createUserClient(authHeader);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return { user: data.user, authHeader };
}

export async function requirePlatformAdmin(
  service: SupabaseClient,
  userId: string
): Promise<{ platform_role: PlatformRole }> {
  const { data, error } = await service
    .from("platform_admins")
    .select("platform_role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.platform_role) throw new Error("Forbidden: not a platform admin");
  return data as { platform_role: PlatformRole };
}

export function assertCanWrite(role: PlatformRole): void {
  if (role === "read_only_support") {
    throw new Error("Forbidden: read-only support cannot mutate");
  }
}

export async function writeAudit(
  service: SupabaseClient,
  input: {
    actor_id: string;
    action: string;
    resource_type: string;
    resource_id?: string | null;
    organization_id?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await service.from("audit_logs").insert({
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id ?? null,
    organization_id: input.organization_id ?? null,
    metadata: input.metadata ?? {},
  });
}
