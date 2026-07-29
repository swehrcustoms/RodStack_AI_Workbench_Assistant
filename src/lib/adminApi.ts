import { supabase, supabaseEnabled } from "./supabaseClient.js";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function invoke<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!supabaseEnabled || !supabase) {
    throw new AdminApiError("Supabase is not configured", 503, "not_configured");
  }

  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    // Prefer structured body from Edge Function when available
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = await ctx.json();
        if (payload?.error) {
          throw new AdminApiError(String(payload.error), ctx.status, payload.code);
        }
      } catch (inner) {
        if (inner instanceof AdminApiError) throw inner;
      }
    }
    throw new AdminApiError(error.message || `Function ${name} failed`);
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new AdminApiError(
      String((data as { error: string }).error),
      undefined,
      (data as { code?: string }).code
    );
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

  askClaude: (payload: { message: string; context?: string; organizationId?: string | null }) =>
    invoke<{ ok: boolean; reply: string; model: string; usage?: unknown }>("ask-claude", payload),
};
