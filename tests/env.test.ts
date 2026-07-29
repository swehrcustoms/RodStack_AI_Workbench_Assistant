import { describe, expect, it } from "vitest";
import { parseClientEnv } from "../src/lib/env";

describe("parseClientEnv", () => {
  it("accepts empty optional public env", () => {
    const env = parseClientEnv({});
    expect(env.VITE_SUPABASE_URL).toBe("");
    expect(env.VITE_SUPABASE_ANON_KEY).toBe("");
    expect(env.VITE_FORMS_WEBHOOK_URL).toBe("");
  });

  it("rejects forbidden client secrets", () => {
    expect(() =>
      parseClientEnv({
        VITE_ADMIN_PASSWORD: "secret",
      })
    ).toThrow(/Forbidden client secrets/);
  });

  it("rejects Anthropic keys on VITE_ prefix", () => {
    expect(() =>
      parseClientEnv({
        VITE_ANTHROPIC_API_KEY: "sk-test",
      })
    ).toThrow(/VITE_ANTHROPIC_API_KEY/);
  });

  it("rejects Stripe secrets on VITE_ prefix", () => {
    expect(() =>
      parseClientEnv({
        VITE_STRIPE_SECRET_KEY: "sk_test",
      })
    ).toThrow(/VITE_STRIPE_SECRET_KEY/);
  });

  it("accepts valid supabase URL when provided", () => {
    const env = parseClientEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "anon-public-key",
    });
    expect(env.VITE_SUPABASE_URL).toBe("https://example.supabase.co");
  });
});
