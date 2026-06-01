import { useState } from "react";
import { logWelcomeEmail } from "../data/formsStore.js";
import { T, font, mono } from "./formsUi.jsx";

export default function WelcomeEmailPreview() {
  const [tab, setTab] = useState("preview");
  const [resendEmail, setResendEmail] = useState("");
  const [resendName, setResendName] = useState("");
  const [resendPlan, setResendPlan] = useState("pro");
  const [resendDone, setResendDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const sampleVars = {
    first_name: resendName || "Jane",
    email: resendEmail || "jane@example.com",
    subscription_level: resendPlan,
    subscription_price: resendPlan === "free" ? "0" : resendPlan === "pro" ? "29" : "99",
    signup_date: new Date().toISOString().split("T")[0],
  };

  const fillTemplate = (t) => Object.entries(sampleVars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), t);

  const previewHtml = fillTemplate(`
    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#0f172a;padding:32px 36px 28px;text-align:center;">
        <div style="font-size:22px;font-weight:700;color:#fff;">RodStack</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">AI Workbench Assistant</div>
      </div>
      <div style="padding:32px 36px;">
        <p style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 4px;">Welcome aboard, {{first_name}}! 👋</p>
        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;margin:12px 0 18px;">✓ {{subscription_level}} Plan — Active</span>
        <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 22px;">Your account is live and ready. We're thrilled to have you — here's your quick-start link.</p>
        <a href="https://rod-stack-ai-workbench-assistant.vercel.app" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;">Open your dashboard →</a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.7;">
          <strong>Email:</strong> {{email}}<br>
          <strong>Plan:</strong> {{subscription_level}} · ${{subscription_price}}/mo<br>
          <strong>Member since:</strong> {{signup_date}}
        </p>
      </div>
      <div style="background:#f8fafc;padding:20px 36px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="font-size:11px;color:#94a3b8;margin:0;">RodStack · Mayer, MN</p>
      </div>
    </div>
  `);

  const codeSnippet = `// Google Apps Script — paste into your sheet's Script Editor
function sendWelcomeEmail(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = e.range.getRow();
  if (row < 2) return;
  const name  = sheet.getRange(row, 2).getValue();
  const email = sheet.getRange(row, 3).getValue();
  const plan  = sheet.getRange(row, 9).getValue();
  const price = sheet.getRange(row, 10).getValue();
  const firstName = name.split(" ")[0];
  GmailApp.sendEmail(email, "Welcome to RodStack — you're in! 🎉", "", { htmlBody: htmlTemplate, name: "RodStack" });
}`;

  const handleResend = async () => {
    if (!resendEmail) return;
    setLoading(true);
    try {
      await logWelcomeEmail({ name: resendName, email: resendEmail, plan: resendPlan });
      setResendDone(true);
      setTimeout(() => setResendDone(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rs-animate">
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
        {[
          ["preview", "Preview"],
          ["code", "Apps Script"],
          ["resend", "Send Test"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: tab === id ? `2px solid ${T.accent}` : "2px solid transparent",
              color: tab === id ? T.text : T.muted,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 13,
              fontWeight: tab === id ? 600 : 400,
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "preview" && (
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {["free", "pro", "enterprise"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setResendPlan(p)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  border: `1px solid ${resendPlan === p ? T.accent : T.border}`,
                  background: resendPlan === p ? T.accentDim : T.bg,
                  color: resendPlan === p ? "#93c5fd" : T.muted,
                  fontFamily: font,
                  textTransform: "capitalize",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {tab === "code" && (
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span className="rs-tag" style={{ background: T.greenDim, color: T.green, borderColor: `${T.green}33` }}>
              Apps Script
            </span>
            <span style={{ fontSize: 12, color: T.muted }}>Extensions → Apps Script → paste this</span>
          </div>
          <pre
            style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: 18,
              fontSize: 12,
              color: "#7dd3fc",
              fontFamily: mono,
              overflow: "auto",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {codeSnippet}
          </pre>
        </div>
      )}

      {tab === "resend" && (
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 18, lineHeight: 1.6 }}>
            Test the welcome email — logs to your forms database and admin records.
          </div>
          <div className="rs-field">
            <label className="rs-label">Recipient Name</label>
            <input className="rs-input" placeholder="Jane Doe" value={resendName} onChange={(e) => setResendName(e.target.value)} />
          </div>
          <div className="rs-field">
            <label className="rs-label">Recipient Email</label>
            <input className="rs-input" type="email" placeholder="jane@example.com" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} />
          </div>
          <div className="rs-field">
            <label className="rs-label">Plan</label>
            <select className="rs-select" value={resendPlan} onChange={(e) => setResendPlan(e.target.value)}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button
            type="button"
            className="rs-btn-primary"
            onClick={handleResend}
            disabled={loading || !resendEmail}
            style={{ background: resendDone ? "#16a34a" : undefined }}
          >
            {loading ? <span className="rs-spinner" /> : resendDone ? "✓ Logged!" : "Send test email →"}
          </button>
        </div>
      )}
    </div>
  );
}
