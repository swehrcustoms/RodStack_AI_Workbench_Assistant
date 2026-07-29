import { z } from "zod";

export const ASK_CLAUDE_MAX_MESSAGE_CHARS = 8_000;
export const ASK_CLAUDE_MAX_CONTEXT_CHARS = 40_000;
export const ASK_CLAUDE_TIMEOUT_MS = 45_000;
export const ASK_CLAUDE_RATE_LIMIT_PER_MINUTE = 20;

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

export const ALLOWED_ANTHROPIC_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-sonnet-4-5-20250929",
  "claude-3-5-haiku-20241022",
] as const;

export const askClaudeRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "message required")
    .max(ASK_CLAUDE_MAX_MESSAGE_CHARS, `message exceeds ${ASK_CLAUDE_MAX_MESSAGE_CHARS} chars`),
  context: z
    .string()
    .max(ASK_CLAUDE_MAX_CONTEXT_CHARS, `context exceeds ${ASK_CLAUDE_MAX_CONTEXT_CHARS} chars`)
    .optional()
    .default(""),
  organizationId: z.string().uuid().optional().nullable(),
});

export type AskClaudeRequest = z.infer<typeof askClaudeRequestSchema>;

export type AskClaudeErrorCode =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "subscription_required"
  | "rate_limited"
  | "invalid_payload"
  | "upstream_error"
  | "timeout";

export function resolveAnthropicModel(envModel?: string | null): string {
  const candidate = (envModel || DEFAULT_ANTHROPIC_MODEL).trim();
  if ((ALLOWED_ANTHROPIC_MODELS as readonly string[]).includes(candidate)) {
    return candidate;
  }
  return DEFAULT_ANTHROPIC_MODEL;
}

export function mapAnthropicHttpError(status: number): { code: AskClaudeErrorCode; message: string } {
  if (status === 429) return { code: "rate_limited", message: "Anthropic rate limit exceeded" };
  if (status === 401 || status === 403) {
    return { code: "not_configured", message: "Anthropic credentials rejected" };
  }
  return { code: "upstream_error", message: `Anthropic request failed (${status})` };
}

export const RODSTACK_SYSTEM_PROMPT = `You are RodStack's workshop assistant for custom fishing rod builders.
Help with build documentation, spine finding, guide spacing, epoxy/cure timing, inventory, CRM, and subscription troubleshooting.
Be concise, practical, and safety-conscious. Do not invent shop secrets or claim access to private customer data you were not given.
When analyzing provided JSON context, summarize clearly and suggest next actions. Prefer plain text over markdown headers.`;
