/**
 * Admin console gate.
 *
 * Insecure frontend-only password auth (VITE_ADMIN_PASSWORD / hard-coded defaults)
 * has been removed. Admin access stays disabled until a server-backed auth path
 * (e.g. Supabase service role + RLS admin policies, or a secure backend) exists.
 *
 * See docs/SECURITY_AUDIT.md and docs/PRODUCTION_ROADMAP.md.
 */

/** @param {{ onExit?: () => void }} [props] */
export default function AdminGate({ onExit } = {}) {
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
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0d1424",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Admin Console
        </div>
        <h1 style={{ marginTop: 8, fontSize: 20, color: "#f1f5f9", fontWeight: 700 }}>
          Access disabled
        </h1>
        <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }}>
          Frontend-only admin authorization has been removed for security. Client-side
          password checks and <code style={{ color: "#64748b" }}>VITE_*</code> secrets are
          not safe for production.
        </p>
        <p style={{ marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          Re-enable this console only after server-backed authentication and authorization
          are in place. See <code style={{ color: "#64748b" }}>docs/SECURITY_AUDIT.md</code>.
        </p>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            style={{
              width: "100%",
              marginTop: 20,
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
            ← Back to RodStack
          </button>
        )}
      </div>
    </div>
  );
}
