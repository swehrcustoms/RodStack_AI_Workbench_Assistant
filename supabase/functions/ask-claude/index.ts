import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  assertCanWrite,
  createServiceClient,
  requirePlatformAdmin,
  requireUser,
  writeAudit,
} from "../_shared/admin.ts";

const MAX_MESSAGE = 8_000;
const MAX_CONTEXT = 40_000;
const TIMEOUT_MS = 45_000;
const RATE_LIMIT = 20;
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const ALLOWED_MODELS = new Set([
  DEFAULT_MODEL,
  "claude-sonnet-4-5-20250929",
  "claude-3-5-haiku-20241022",
]);

const SYSTEM_PROMPT = `You are RodStack's workshop assistant for custom fishing rod builders.
Help with build documentation, spine finding, guide spacing, epoxy/cure timing, inventory, CRM, and subscription troubleshooting.
Be concise, practical, and safety-conscious. Do not invent shop secrets or claim access to private customer data you were not given.
When analyzing provided JSON context, summarize clearly and suggest next actions. Prefer plain text over markdown headers.`;

function resolveModel(): string {
  const candidate = (Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL).trim();
  return ALLOWED_MODELS.has(candidate) ? candidate : DEFAULT_MODEL;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed", code: "invalid_payload" }, 405);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "Ask Claude is not configured", code: "not_configured" },
        503
      );
    }

    const { user } = await requireUser(req);
    const service = createServiceClient();
    const admin = await requirePlatformAdmin(service, user.id);
    assertCanWrite(admin.platform_role);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid JSON body", code: "invalid_payload" }, 400);
    }

    const message = String((body as Record<string, unknown>).message || "").trim();
    const context = String((body as Record<string, unknown>).context || "");
    const organizationId = (body as Record<string, unknown>).organizationId as string | undefined;

    if (!message) return jsonResponse({ error: "message required", code: "invalid_payload" }, 400);
    if (message.length > MAX_MESSAGE) {
      return jsonResponse({ error: `message exceeds ${MAX_MESSAGE} chars`, code: "invalid_payload" }, 400);
    }
    if (context.length > MAX_CONTEXT) {
      return jsonResponse({ error: `context exceeds ${MAX_CONTEXT} chars`, code: "invalid_payload" }, 400);
    }

    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await service
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("actor_id", user.id)
      .eq("action", "admin.ask_claude")
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT) {
      return jsonResponse({ error: "Rate limit exceeded", code: "rate_limited" }, 429);
    }

    const model = resolveModel();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let anthropicRes: Response;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: context
                ? `Context (trusted server-assembled):\n${context}\n\nQuestion:\n${message}`
                : message,
            },
          ],
        }),
      });
    } catch (e) {
      clearTimeout(timer);
      const aborted = e instanceof Error && e.name === "AbortError";
      return jsonResponse(
        {
          error: aborted ? "Anthropic request timed out" : "Anthropic request failed",
          code: aborted ? "timeout" : "upstream_error",
        },
        aborted ? 504 : 502
      );
    } finally {
      clearTimeout(timer);
    }

    if (!anthropicRes.ok) {
      const status = anthropicRes.status;
      const code = status === 429 ? "rate_limited" : status === 401 || status === 403 ? "not_configured" : "upstream_error";
      return jsonResponse(
        { error: `Anthropic request failed (${status})`, code },
        status === 429 ? 429 : 502
      );
    }

    const data = await anthropicRes.json();
    const text =
      Array.isArray(data.content) && data.content[0]?.text
        ? String(data.content[0].text)
        : "";

    await writeAudit(service, {
      actor_id: user.id,
      action: "admin.ask_claude",
      resource_type: "ai",
      organization_id: organizationId || null,
      metadata: {
        model,
        messageChars: message.length,
        contextChars: context.length,
        // Do not store full prompts
      },
    });

    return jsonResponse({
      ok: true,
      model,
      reply: text,
      usage: data.usage ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message.startsWith("Forbidden")
      ? 403
      : message.includes("Unauthorized") || message.includes("Authorization")
        ? 401
        : 400;
    const code = status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "invalid_payload";
    return jsonResponse({ error: message, code }, status);
  }
});
