import { useState } from "react";
import { adminApi, AdminApiError } from "../../lib/adminApi";
import { useAuth } from "../../context/AuthContext.jsx";
import { canMutatePlatform } from "../../lib/auth/roles";
import {
  ASK_CLAUDE_MAX_MESSAGE_CHARS,
  askClaudeRequestSchema,
} from "../../lib/askClaude";

export default function AdminAskClaude() {
  const { platformRole, primaryOrgId } = useAuth();
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  const canAsk = canMutatePlatform(platformRole);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCode("");
    setReply("");

    if (!canAsk) {
      setStatus("error");
      setCode("forbidden");
      setError("Read-only support cannot use Ask Claude");
      return;
    }

    const parsed = askClaudeRequestSchema.safeParse({
      message,
      context,
      organizationId: primaryOrgId || null,
    });
    if (!parsed.success) {
      setStatus("error");
      setCode("invalid_payload");
      setError(parsed.error.issues[0]?.message || "Invalid request");
      return;
    }

    setStatus("loading");
    try {
      const res = await adminApi.askClaude(parsed.data);
      setReply(res.reply || "");
      setStatus("success");
    } catch (err) {
      const apiErr = err instanceof AdminApiError ? err : null;
      const msg = apiErr?.message || (err instanceof Error ? err.message : "Request failed");
      const errCode =
        apiErr?.code ||
        (/not configured/i.test(msg)
          ? "not_configured"
          : /rate limit/i.test(msg)
            ? "rate_limited"
            : /Forbidden|not a platform/i.test(msg)
              ? "forbidden"
              : /Unauthorized/i.test(msg)
                ? "unauthorized"
                : /subscription/i.test(msg)
                  ? "subscription_required"
                  : "upstream_error");
      setCode(errCode);
      setError(msg);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Ask Claude</h1>
        <p className="mt-1 text-sm text-slate-400">
          Server-side Anthropic proxy. The API key never reaches the browser.
        </p>
      </div>

      {!canAsk && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Your role is read-only. Ask Claude requires platform_owner or support_admin.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-[#0d1424] p-4">
        <label className="block text-xs text-slate-500">
          Question
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={ASK_CLAUDE_MAX_MESSAGE_CHARS}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            placeholder="How should I troubleshoot a past_due Pro subscription?"
            required
          />
        </label>
        <label className="block text-xs text-slate-500">
          Optional context (subscription JSON, user summary — avoid secrets)
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            placeholder='{"tier":"pro","status":"past_due"}'
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading" || !canAsk}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "loading" ? "Thinking…" : "Ask Claude"}
        </button>
      </form>

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <p className="font-semibold uppercase tracking-wide text-[10px] text-red-300">{code || "error"}</p>
          <p className="mt-1">{error}</p>
          {code === "not_configured" && (
            <p className="mt-2 text-xs text-red-300/80">
              Set ANTHROPIC_API_KEY (and optional ANTHROPIC_MODEL) as Supabase function secrets, then
              redeploy ask-claude.
            </p>
          )}
        </div>
      )}

      {status === "success" && (
        <div className="rounded-xl border border-cyan-500/20 bg-[#0d1424] p-4 text-sm text-slate-200 whitespace-pre-wrap">
          {reply || "(empty response)"}
        </div>
      )}
    </div>
  );
}
