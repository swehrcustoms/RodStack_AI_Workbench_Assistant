import { useState } from "react";
import { submitFeatureRequest } from "../data/formsStore.js";
import { T, SuccessScreen, PayloadPreview } from "./formsUi.jsx";

export default function FeatureRequestForm({ onSuccess }) {
  const [f, setF] = useState({
    name: "",
    email: "",
    title: "",
    problem: "",
    description: "",
    usecase: "",
    priority: "nice_to_have",
    workaround: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Name is required";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Enter a valid email";
    if (!f.title.trim()) e.title = "Feature title is required";
    if (!f.problem.trim()) e.problem = "Describe the problem it solves";
    if (!f.description.trim()) e.description = "Describe the feature";
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
      const record = await submitFeatureRequest(f);
      setDone(true);
      onSuccess?.({ ...f, record });
    } catch (err) {
      setErrors({ form: err.message || "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const payload = {
    sheet_id: "1LEuolm3ZoGG3JOs9EEtOxbx4CCK8xVs6Pju8gB7GBzs",
    timestamp: new Date().toISOString(),
    full_name: f.name,
    email: f.email,
    feature_title: f.title,
    problem_it_solves: f.problem,
    description: f.description,
    use_case: f.usecase,
    priority: f.priority,
    current_workaround: f.workaround,
  };

  const PRIS = [
    { val: "nice_to_have", label: "Nice to have", color: T.muted, dim: T.faint },
    { val: "important", label: "Important", color: T.amber, dim: T.amberDim },
    { val: "critical", label: "Critical", color: T.purple, dim: T.purpleDim },
  ];

  if (done) {
    return (
      <SuccessScreen
        icon="💡"
        color={T.purple}
        title="Feature request received!"
        body="Thank you for helping shape RodStack. We review every request and will keep you posted."
        onReset={() => {
          setDone(false);
          setF({ name: "", email: "", title: "", problem: "", description: "", usecase: "", priority: "nice_to_have", workaround: "" });
        }}
      />
    );
  }

  return (
    <div style={{ padding: "24px 28px" }} className="rs-animate">
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
          Feature Title <span className="rs-required">*</span>
        </label>
        <input className="rs-input" placeholder="e.g. Dark mode, CSV export…" value={f.title} onChange={(e) => set("title", e.target.value)} />
        {errors.title && <div className="rs-error">{errors.title}</div>}
      </div>
      <div className="rs-field">
        <label className="rs-label">
          Problem it solves <span className="rs-required">*</span>
        </label>
        <textarea className="rs-textarea" placeholder="What frustration does this address?" value={f.problem} onChange={(e) => set("problem", e.target.value)} style={{ minHeight: 72 }} />
        {errors.problem && <div className="rs-error">{errors.problem}</div>}
      </div>
      <div className="rs-field">
        <label className="rs-label">
          Describe the feature <span className="rs-required">*</span>
        </label>
        <textarea className="rs-textarea" placeholder="How should it work?" value={f.description} onChange={(e) => set("description", e.target.value)} style={{ minHeight: 90 }} />
        {errors.description && <div className="rs-error">{errors.description}</div>}
      </div>
      <div className="rs-field">
        <label className="rs-label">Who benefits / Use case</label>
        <input className="rs-input" placeholder="e.g. Power users managing 100+ builds" value={f.usecase} onChange={(e) => set("usecase", e.target.value)} />
      </div>
      <div className="rs-field">
        <label className="rs-label">Priority for you</label>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {PRIS.map((p) => (
            <button
              key={p.val}
              type="button"
              onClick={() => set("priority", p.val)}
              style={{
                flex: 1,
                padding: "11px 8px",
                borderRadius: 9,
                border: "1px solid",
                borderColor: f.priority === p.val ? `${p.color}55` : T.border,
                background: f.priority === p.val ? p.dim : T.bg,
                color: f.priority === p.val ? p.color : T.muted,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'Sora', sans-serif",
                fontWeight: 600,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rs-field">
        <label className="rs-label">Current workaround</label>
        <input className="rs-input" placeholder="How are you handling this today?" value={f.workaround} onChange={(e) => set("workaround", e.target.value)} />
      </div>
      {errors.form && <div className="rs-error" style={{ marginBottom: 12 }}>{errors.form}</div>}
      <button type="button" className="rs-btn-primary" onClick={handleSubmit} disabled={loading} style={{ background: "#7c3aed", marginTop: 4 }}>
        {loading ? <span className="rs-spinner" /> : "Submit feature request →"}
      </button>
      <PayloadPreview data={payload} />
    </div>
  );
}
