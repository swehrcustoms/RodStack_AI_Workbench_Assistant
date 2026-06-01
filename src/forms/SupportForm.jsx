import { useState } from "react";
import { submitSupport } from "../data/formsStore.js";
import { T, PayloadPreview } from "./formsUi.jsx";

export default function SupportForm({ onSuccess }) {
  const [f, setF] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    priority: "medium",
    description: "",
    steps: "",
    device: "",
    attachment: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ticketId] = useState(`TKT-${String(Math.floor(Math.random() * 90000) + 10000)}`);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Name is required";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Enter a valid email";
    if (!f.subject.trim()) e.subject = "Subject is required";
    if (!f.category) e.category = "Select a category";
    if (!f.description.trim()) e.description = "Please describe the issue";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const record = await submitSupport(f, ticketId);
      setDone(true);
      onSuccess?.({ ...f, ticket_id: ticketId, record });
    } catch (err) {
      setErrors({ form: err.message || "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const payload = {
    sheet_id: "1m8jG_3mva_CowBPQIzU4mQ8Upn4ADGZabPBmIoDzods",
    ticket_id: ticketId,
    timestamp: new Date().toISOString(),
    full_name: f.name,
    email: f.email,
    subject: f.subject,
    category: f.category,
    priority: f.priority,
    description: f.description,
    steps: f.steps,
    device: f.device,
    attachment: f.attachment,
    status: "open",
  };

  const PRIORITIES = [
    { val: "low", label: "Low", color: T.green, dim: T.greenDim },
    { val: "medium", label: "Medium", color: T.amber, dim: T.amberDim },
    { val: "high", label: "High", color: "#f97316", dim: "#431407" },
    { val: "critical", label: "Critical", color: T.red, dim: T.redDim },
  ];

  if (done) {
    return (
      <div className="rs-success-wrap rs-animate" style={{ padding: "48px 28px" }}>
        <div className="rs-success-icon" style={{ background: T.greenDim, border: `1px solid ${T.green}33`, fontSize: 28 }}>
          🎫
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Ticket submitted</div>
        <span className="rs-tag" style={{ background: T.accentDim, color: "#93c5fd", borderColor: `${T.accent}44`, fontSize: 13, padding: "5px 14px" }}>
          {ticketId}
        </span>
        <div style={{ fontSize: 13, color: T.muted, maxWidth: 320, lineHeight: 1.7, textAlign: "center" }}>
          We received your request and will respond to <strong style={{ color: T.text }}>{f.email}</strong> within 24 hours.
        </div>
        <button
          type="button"
          className="rs-btn-primary"
          style={{ width: "auto", padding: "9px 22px", fontSize: 13 }}
          onClick={() => {
            setDone(false);
            setF({ name: "", email: "", subject: "", category: "", priority: "medium", description: "", steps: "", device: "", attachment: "" });
          }}
        >
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }} className="rs-animate">
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: T.muted }}>Your ticket ID:</span>
        <span className="rs-tag" style={{ background: T.faint, color: T.muted, borderColor: T.border }}>
          {ticketId}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <div className="rs-field">
          <label className="rs-label">
            Name <span className="rs-required">*</span>
          </label>
          <input className="rs-input" placeholder="Jane Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
          {errors.name && <div className="rs-error">{errors.name}</div>}
        </div>
        <div className="rs-field">
          <label className="rs-label">
            Email <span className="rs-required">*</span>
          </label>
          <input className="rs-input" type="email" placeholder="jane@company.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
          {errors.email && <div className="rs-error">{errors.email}</div>}
        </div>
      </div>
      <div className="rs-field">
        <label className="rs-label">
          Subject <span className="rs-required">*</span>
        </label>
        <input className="rs-input" placeholder="Brief summary of the issue" value={f.subject} onChange={(e) => set("subject", e.target.value)} />
        {errors.subject && <div className="rs-error">{errors.subject}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <div className="rs-field">
          <label className="rs-label">
            Category <span className="rs-required">*</span>
          </label>
          <select className="rs-select" value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select category…</option>
            {["Bug / Error", "Account", "Billing", "Performance", "Integration", "Other"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          {errors.category && <div className="rs-error">{errors.category}</div>}
        </div>
        <div className="rs-field">
          <label className="rs-label">Priority</label>
          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => set("priority", p.val)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: f.priority === p.val ? `${p.color}66` : T.border,
                  background: f.priority === p.val ? p.dim : T.bg,
                  color: f.priority === p.val ? p.color : T.muted,
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 600,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="rs-field">
        <label className="rs-label">
          Describe the issue <span className="rs-required">*</span>
        </label>
        <textarea
          className="rs-textarea"
          placeholder="What happened? What did you expect to happen?"
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
          style={{ minHeight: 100 }}
        />
        {errors.description && <div className="rs-error">{errors.description}</div>}
      </div>
      <div className="rs-field">
        <label className="rs-label">Steps to reproduce</label>
        <textarea className="rs-textarea" placeholder="1. Go to…" value={f.steps} onChange={(e) => set("steps", e.target.value)} style={{ minHeight: 72 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <div className="rs-field">
          <label className="rs-label">Browser / Device</label>
          <input className="rs-input" placeholder="Chrome 124 / macOS" value={f.device} onChange={(e) => set("device", e.target.value)} />
        </div>
        <div className="rs-field">
          <label className="rs-label">Attachment URL</label>
          <input className="rs-input" placeholder="https://drive.google.com/…" value={f.attachment} onChange={(e) => set("attachment", e.target.value)} />
        </div>
      </div>
      {errors.form && <div className="rs-error" style={{ marginBottom: 12 }}>{errors.form}</div>}
      <button type="button" className="rs-btn-primary" onClick={handleSubmit} disabled={loading} style={{ background: "#dc2626", marginTop: 4 }}>
        {loading ? <span className="rs-spinner" /> : "Submit support request →"}
      </button>
      <PayloadPreview data={payload} />
    </div>
  );
}
