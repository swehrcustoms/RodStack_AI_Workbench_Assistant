import { useState, useCallback } from "react";
import { getFormsStats, loadFormsStore, SHEETS } from "../data/formsStore.js";

const mono = "'JetBrains Mono', monospace";

export default function AdminRecords({ onBack }) {
  const [tab, setTab] = useState("all");
  const [store, setStore] = useState(() => getFormsStats().store);

  const refresh = useCallback(() => {
    setStore(getFormsStats().store);
  }, []);

  const s = {
    btn: {
      background: "#1e293b",
      color: "#cbd5e1",
      border: "none",
      borderRadius: 7,
      padding: "7px 14px",
      fontSize: 12,
      cursor: "pointer",
      fontFamily: mono,
    },
    th: {
      textAlign: "left",
      padding: "8px 12px",
      borderBottom: "1px solid #1e293b",
      color: "#475569",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    td: { padding: "10px 12px", borderBottom: "1px solid #111827", fontSize: 12, color: "#94a3b8" },
  };

  const rows =
    tab === "signup"
      ? store.signups || []
      : tab === "support"
        ? store.support || []
        : tab === "feature"
          ? store.features || []
          : tab === "email"
            ? store.emailLogs || []
            : store.submissions || [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {onBack && (
          <button type="button" style={s.btn} onClick={onBack}>
            ← Users
          </button>
        )}
        <button type="button" style={s.btn} onClick={refresh}>
          ↻ Refresh
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["all", "All", store.submissions?.length],
            ["signup", "Signups", store.signups?.length],
            ["support", "Support", store.support?.length],
            ["feature", "Features", store.features?.length],
            ["email", "Emails", store.emailLogs?.length],
          ].map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                ...s.btn,
                background: tab === id ? "#1d4ed8" : "#1e293b",
                color: tab === id ? "#fff" : "#94a3b8",
              }}
            >
              {label} ({count || 0})
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
        {Object.entries(SHEETS).map(([key, id]) => (
          <a
            key={key}
            href={`https://docs.google.com/spreadsheets/d/${id}/edit`}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#0d1424",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "12px 14px",
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{key}</div>
            <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 4, fontFamily: mono }}>{id.slice(0, 14)}… ↗</div>
          </a>
        ))}
      </div>

      <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Contact</th>
              <th style={s.th}>Summary</th>
              <th style={s.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...s.td, textAlign: "center", padding: 40, color: "#334155" }}>
                  No records yet — submit a form from the website or Forms view
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id || r.ticket_id || r.timestamp}>
                <td style={{ ...s.td, fontFamily: mono, color: "#475569" }}>{r.id || r.ticket_id || "—"}</td>
                <td style={s.td}>{r.record_type || r.type || tab}</td>
                <td style={s.td}>
                  <div style={{ color: "#e2e8f0" }}>{r.full_name || r.recipient_name || "—"}</div>
                  <div style={{ fontSize: 11 }}>{r.email || r.recipient_email}</div>
                </td>
                <td style={s.td}>
                  {r.subject || r.feature_title || r.subscription_plan || r.description?.slice(0, 60) || "—"}
                </td>
                <td style={{ ...s.td, fontSize: 11 }}>{(r.timestamp || "").replace("T", " ").slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
