import { supabase, supabaseEnabled } from "./supabaseClient.js";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function invoke<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!supabaseEnabled || !supabase) {
    throw new AdminApiError("Supabase is not configured");
  }
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    throw new AdminApiError(error.message || `Function ${name} failed`);
  }
  if (data?.error) {
    throw new AdminApiError(String(data.error));
  }
  return data as T;
}

export const adminApi = {
  getUser: (payload: { userId?: string; email?: string }) =>
    invoke<{
      profile: Record<string, unknown>;
      memberships: unknown[];
      subscriptions: unknown[];
    }>("admin-get-user", payload),

  searchUsers: (query: string, limit = 25) =>
    invoke<{ users: Array<Record<string, unknown>> }>("admin-search-users", { query, limit }),

  getSubscription: (organizationId: string) =>
    invoke<{
      subscription: Record<string, unknown> | null;
      overrides: unknown[];
      entitlements: unknown[];
      activePreview: Record<string, unknown> | null;
    }>("admin-get-subscription", { organizationId }),

  refreshEntitlements: (organizationId: string) =>
    invoke<{ ok: boolean; entitlements: unknown[] }>("admin-refresh-entitlements", {
      organizationId,
    }),

  startPlanPreview: (organizationId: string, tier: string) =>
    invoke<{ ok: boolean; session: Record<string, unknown> }>("admin-start-plan-preview", {
      organizationId,
      tier,
    }),

  endPlanPreview: (payload: { organizationId?: string; sessionId?: string }) =>
    invoke<{ ok: boolean }>("admin-end-plan-preview", payload),

  startSupportView: (targetUserId: string, organizationId?: string | null) =>
    invoke<{
      ok: boolean;
      session: Record<string, unknown>;
      supportView: Record<string, unknown>;
    }>("admin-start-support-view", { targetUserId, organizationId }),

  endSupportView: (sessionId?: string) =>
    invoke<{ ok: boolean }>("admin-end-support-view", { sessionId }),

  manualOverride: (payload: {
    organizationId: string;
    tier: string;
    reason: string;
    endsAt?: string | null;
  }) => invoke<{ ok: boolean; override: Record<string, unknown> }>("admin-manual-override", payload),
};
