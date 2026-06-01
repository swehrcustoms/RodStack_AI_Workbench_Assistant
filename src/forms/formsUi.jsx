import { useState } from "react";

export const T = {
  bg: "#07090f",
  surface: "#0d1120",
  border: "#1a2236",
  borderHi: "#253352",
  text: "#e2e8f0",
  muted: "#64748b",
  faint: "#1e293b",
  accent: "#3b82f6",
  accentDim: "#1d3461",
  green: "#22c55e",
  greenDim: "#052e16",
  amber: "#f59e0b",
  amberDim: "#431407",
  red: "#ef4444",
  redDim: "#3b0a0a",
  purple: "#a78bfa",
  purpleDim: "#2e1065",
};

export const font = "'Sora', 'Segoe UI', system-ui, sans-serif";
export const mono = "'JetBrains Mono', 'Courier New', monospace";

export const formsCss = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  .rs-forms *, .rs-forms *::before, .rs-forms *::after { box-sizing: border-box; }
  .rs-input {
    width: 100%; background: ${T.bg}; border: 1px solid ${T.border};
    color: ${T.text}; padding: 11px 14px; border-radius: 9px;
    font-family: ${font}; font-size: 14px; outline: none;
    transition: border-color 0.15s;
  }
  .rs-input:focus { border-color: ${T.accent}; }
  .rs-input::placeholder { color: ${T.muted}; }
  .rs-select {
    width: 100%; background: ${T.bg}; border: 1px solid ${T.border};
    color: ${T.text}; padding: 11px 14px; border-radius: 9px;
    font-family: ${font}; font-size: 14px; cursor: pointer; outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
  }
  .rs-select:focus { border-color: ${T.accent}; }
  .rs-textarea {
    width: 100%; background: ${T.bg}; border: 1px solid ${T.border};
    color: ${T.text}; padding: 11px 14px; border-radius: 9px;
    font-family: ${font}; font-size: 14px; resize: vertical;
    min-height: 90px; outline: none;
  }
  .rs-textarea:focus { border-color: ${T.accent}; }
  .rs-textarea::placeholder { color: ${T.muted}; }
  .rs-btn-primary {
    background: ${T.accent}; color: #fff; border: none;
    padding: 12px 28px; border-radius: 9px; font-family: ${font};
    font-size: 14px; font-weight: 600; cursor: pointer; width: 100%;
    transition: all 0.15s;
  }
  .rs-btn-primary:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
  .rs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .rs-label {
    display: block; font-size: 12px; font-weight: 500;
    color: ${T.muted}; letter-spacing: 0.06em; text-transform: uppercase;
    margin-bottom: 7px;
  }
  .rs-field { margin-bottom: 18px; }
  .rs-error { font-size: 11px; color: ${T.red}; margin-top: 5px; }
  .rs-required { color: ${T.red}; margin-left: 2px; }
  .rs-success-wrap {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 48px 24px; text-align: center; gap: 14px;
  }
  .rs-success-icon {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 26px;
  }
  .rs-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 500; border: 1px solid; font-family: ${mono};
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .rs-animate { animation: fadeUp 0.35s ease forwards; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .rs-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff; animation: spin 0.7s linear infinite;
    display: inline-block;
  }
`;

export function FormsStyles() {
  return <style>{formsCss}</style>;
}

export function Card({ children, style }) {
  return (
    <div
      className="rs-forms"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: font,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FormHeader({ icon, title, subtitle, color = T.accent }) {
  return (
    <div
      style={{
        padding: "24px 28px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: `${color}18`,
          border: `1px solid ${color}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: "-0.2px" }}>{title}</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

export function SuccessScreen({ icon, color, title, body, onReset, resetLabel = "Submit another" }) {
  return (
    <div className="rs-success-wrap rs-animate">
      <div className="rs-success-icon" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
        {icon}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{title}</div>
      <div style={{ fontSize: 13, color: T.muted, maxWidth: 300, lineHeight: 1.7 }}>{body}</div>
      <button
        type="button"
        className="rs-btn-primary"
        style={{ width: "auto", padding: "9px 22px", fontSize: 13, marginTop: 8 }}
        onClick={onReset}
      >
        {resetLabel}
      </button>
    </div>
  );
}

export function PayloadPreview({ data }) {
  const [open, setOpen] = useState(false);
  if (!import.meta.env.DEV) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: `1px solid ${T.border}`,
          color: T.muted,
          padding: "6px 12px",
          borderRadius: 7,
          fontSize: 11,
          fontFamily: mono,
          cursor: "pointer",
        }}
      >
        {open ? "▲ Hide" : "▼ Show"} POST payload
      </button>
      {open && (
        <pre
          style={{
            marginTop: 8,
            padding: 14,
            background: T.bg,
            borderRadius: 9,
            border: `1px solid ${T.border}`,
            fontSize: 11,
            color: "#7dd3fc",
            fontFamily: mono,
            overflow: "auto",
            maxHeight: 220,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
