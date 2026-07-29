import { describe, expect, it } from "vitest";
import {
  ASK_CLAUDE_MAX_MESSAGE_CHARS,
  askClaudeRequestSchema,
  mapAnthropicHttpError,
  resolveAnthropicModel,
  ALLOWED_ANTHROPIC_MODELS,
} from "../src/lib/askClaude";

describe("askClaude validation", () => {
  it("accepts a valid message", () => {
    const parsed = askClaudeRequestSchema.parse({ message: "How do I spine a blank?" });
    expect(parsed.message).toContain("spine");
  });

  it("rejects empty and oversized messages", () => {
    expect(() => askClaudeRequestSchema.parse({ message: "" })).toThrow();
    expect(() =>
      askClaudeRequestSchema.parse({ message: "x".repeat(ASK_CLAUDE_MAX_MESSAGE_CHARS + 1) })
    ).toThrow();
  });

  it("resolves model allowlist", () => {
    expect(resolveAnthropicModel(ALLOWED_ANTHROPIC_MODELS[0])).toBe(ALLOWED_ANTHROPIC_MODELS[0]);
    expect(resolveAnthropicModel("not-a-real-model")).toBe("claude-sonnet-4-20250514");
  });

  it("maps Anthropic HTTP errors", () => {
    expect(mapAnthropicHttpError(429).code).toBe("rate_limited");
    expect(mapAnthropicHttpError(401).code).toBe("not_configured");
    expect(mapAnthropicHttpError(500).code).toBe("upstream_error");
  });
});
