import { useEffect, useState } from "react";
import AdminDatabase from "./AdminDatabase.jsx";

const SESSION_KEY = "rodstack.admin.session";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || "rodstack-admin-2026";

export default function AdminGate({ onExit }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setError("");
      return;
    }
    setError("Invalid admin credentials");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPassword("");
    onExit?.();
  };

  if (authed) {
    return <AdminDatabase onExit={handleLogout} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070b12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Mono', monospace",
        padding: 24,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');`}</style>
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#0d1424",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: "28px 24px",
        }}
      >
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Admin Only
        </div>
        <h1 style={{ marginTop: 8, fontSize: 20, color: "#f1f5f9", fontWeight: 700 }}>RodStack Database</h1>
        <p style={{ marginTop: 8, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          Restricted access. User records, subscriptions, and AI analytics console.
        </p>
        <label style={{ display: "block", marginTop: 20, fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Admin Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            marginTop: 6,
            background: "#070b12",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#e2e8f0",
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            boxSizing: "border-box",
          }}
          placeholder="Enter admin password"
          autoFocus
        />
        {error && <p style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>{error}</p>}
        <button
          type="submit"
          style={{
            width: "100%",
            marginTop: 16,
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "11px 0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Unlock Console
        </button>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            style={{
              width: "100%",
              marginTop: 10,
              background: "transparent",
              color: "#64748b",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "9px 0",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            ← Back to RodStack
          </button>
        )}
      </form>
    </div>
  );
}
