import { useState } from "react";
import { submitSignup } from "../data/formsStore.js";
import { T, SuccessScreen, PayloadPreview } from "./formsUi.jsx";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  plan: "free",
  referral: "",
  terms: false,
};

export default function SignupForm({ onSuccess, initialValues = {} }) {
  const [f, setF] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Full name is required";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Enter a valid email";
    if (!f.terms) e.terms = "You must agree to continue";
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
      const result = await submitSignup(f);
      setDone(true);
      onSuccess?.(result);
    } catch (err) {
      setErrors({ form: err.message || "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const payload = {
    sheet_id: "17Xdqage1lBLZCfx8LC6m03n5w9fhf9IL_qcLgZRqTsM",
    timestamp: new Date().toISOString(),
    full_name: f.name,
    email: f.email,
    phone: f.phone,
    company: f.company,
    job_title: f.role,
    subscription_plan: f.plan,
    referral_source: f.referral,
    agreed_to_terms: f.terms,
  };

  if (done) {
    return (
      <SuccessScreen
        icon="🎉"
        color={T.green}
        title="You're in!"
        body="Welcome to RodStack. Your account is logged in our workshop database — check your inbox for confirmation."
        onReset={() => {
          setDone(false);
          setF({ ...EMPTY, ...initialValues });
        }}
        resetLabel="Sign up another account"
      />
    );
  }

  return (
    <div style={{ padding: "24px 28px" }} className="rs-animate">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <div className="rs-field">
          <label className="rs-label">
            Full Name <span className="rs-required">*</span>
          </label>
          <input className="rs-input" placeholder="Jane Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
          {errors.name && <div className="rs-error">{errors.name}</div>}
        </div>
        <div className="rs-field">
          <label className="rs-label">
            Email <span className="rs-required">*</span>
          </label>
          <input
            className="rs-input"
            type="email"
            placeholder="jane@company.com"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
          />
          {errors.email && <div className="rs-error">{errors.email}</div>}
        </div>
        <div className="rs-field">
          <label className="rs-label">Phone</label>
          <input className="rs-input" type="tel" placeholder="+1 555-0100" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="rs-field">
          <label className="rs-label">Company</label>
          <input className="rs-input" placeholder="Acme Corp" value={f.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div className="rs-field">
          <label className="rs-label">Job Title</label>
          <input className="rs-input" placeholder="Developer, Founder…" value={f.role} onChange={(e) => set("role", e.target.value)} />
        </div>
        <div className="rs-field">
          <label className="rs-label">Plan</label>
          <select className="rs-select" value={f.plan} onChange={(e) => set("plan", e.target.value)}>
            <option value="free">Free — $0/mo</option>
            <option value="pro">Pro — $29/mo</option>
            <option value="enterprise">Enterprise — $99/mo</option>
          </select>
        </div>
      </div>
      <div className="rs-field">
        <label className="rs-label">How did you hear about us?</label>
        <select className="rs-select" value={f.referral} onChange={(e) => set("referral", e.target.value)}>
          <option value="">Select…</option>
          {["Google / Search", "Social media", "Friend / Colleague", "Newsletter", "Other"].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="rs-field" style={{ marginBottom: 22 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={f.terms}
            onChange={(e) => set("terms", e.target.checked)}
            style={{ marginTop: 2, accentColor: T.accent, width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
            I agree to the Terms of Service and Privacy Policy
          </span>
        </label>
        {errors.terms && <div className="rs-error" style={{ marginTop: 4 }}>{errors.terms}</div>}
      </div>
      {errors.form && <div className="rs-error" style={{ marginBottom: 12 }}>{errors.form}</div>}
      <button type="button" className="rs-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="rs-spinner" /> : "Create my account →"}
      </button>
      <PayloadPreview data={payload} />
    </div>
  );
}
