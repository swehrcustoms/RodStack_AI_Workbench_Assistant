import { z } from "zod";

/**
 * Client env schema — only public values allowed.
 * Secrets (API keys, admin passwords) must never use the VITE_ prefix.
 */
const emptyOrUrl = z.union([z.literal(""), z.string().url()]);

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: emptyOrUrl,
  VITE_SUPABASE_ANON_KEY: z.string(),
  VITE_FORMS_WEBHOOK_URL: emptyOrUrl,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

const FORBIDDEN_CLIENT_KEYS = [
  "VITE_ADMIN_PASSWORD",
  "VITE_ANTHROPIC_API_KEY",
  "VITE_ANTHROPIC_KEY",
  "VITE_OPENAI_API_KEY",
  "VITE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
] as const;

function assertNoClientSecrets(raw: Record<string, unknown>): void {
  const present = FORBIDDEN_CLIENT_KEYS.filter((key) => {
    const value = raw[key];
    return typeof value === "string" && value.trim().length > 0;
  });
  if (present.length > 0) {
    throw new Error(
      `Forbidden client secrets detected (${present.join(", ")}). ` +
        `Remove them from VITE_* env — secrets must stay server-side. See docs/SECURITY_AUDIT.md.`
    );
  }
}

export function parseClientEnv(
  raw: Record<string, unknown> = import.meta.env as Record<string, unknown>
): ClientEnv {
  assertNoClientSecrets(raw);
  const parsed = clientEnvSchema.safeParse({
    VITE_SUPABASE_URL: raw.VITE_SUPABASE_URL ?? "",
    VITE_SUPABASE_ANON_KEY: raw.VITE_SUPABASE_ANON_KEY ?? "",
    VITE_FORMS_WEBHOOK_URL: raw.VITE_FORMS_WEBHOOK_URL ?? "",
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid client environment: ${issues}`);
  }
  return parsed.data;
}

/** Validated client env — empty strings become undefined for optional integrations. */
export function getClientEnv(): {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  formsWebhookUrl?: string;
} {
  const env = parseClientEnv();
  return {
    supabaseUrl: env.VITE_SUPABASE_URL || undefined,
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || undefined,
    formsWebhookUrl: env.VITE_FORMS_WEBHOOK_URL || undefined,
  };
}
