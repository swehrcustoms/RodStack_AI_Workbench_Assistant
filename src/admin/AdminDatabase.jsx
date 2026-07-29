import { useState, useCallback } from "react";
import AdminRecords from "./AdminRecords.jsx";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SHEET_ID = "1WRA19FBOlJ5idoQ9lVJL6miQJy2Sc5Uxvq0UuvfWt_A";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const STORAGE_KEY = "rodstack.admin.users.v1";

const STATUS_OPTIONS = ["active", "inactive", "pending"];
const SUB_OPTIONS = ["free", "pro", "enterprise"];

const STATUS_COLORS = {
  active: { bg: "#0d2d1a", text: "#4ade80", border: "#166534" },
  inactive: { bg: "#2d1010", text: "#f87171", border: "#7f1d1d" },
  pending: { bg: "#2d2200", text: "#fbbf24", border: "#78350f" },
};
const SUB_COLORS = {
  free: { bg: "#1a1a2e", text: "#818cf8", border: "#3730a3" },
  pro: { bg: "#0d2233", text: "#38bdf8", border: "#0369a1" },
  enterprise: { bg: "#1a0d2e", text: "#c084fc", border: "#6b21a8" },
};

const EMPTY_USER = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  status: "active",
  subscription_level: "free",
  subscription_price: "",
  notes: "",
  tags: "",
};

// Claude / Anthropic calls must go through a server proxy. Never embed API keys
// in VITE_* client env vars. See docs/SECURITY_AUDIT.md.

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const hue = name ? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360 : 200;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `hsl(${hue},35%,22%)`,
        border: `1px solid hsl(${hue},35%,32%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.33,
        fontWeight: 600,
        color: `hsl(${hue},60%,70%)`,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.05em",
      }}
    >
      {initials}
    </div>
  );
}

function Badge({ value, map }) {
  const c = map[value] || { bg: "#1e293b", text: "#94a3b8", border: "#334155" };
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        letterSpacing: "0.04em",
        textTransform: "capitalize",
      }}
    >
      {value}
    </span>
  );
}

function Pill({ label, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        background: "#1e293b",
        color: "#94a3b8",
        border: "1px solid #334155",
      }}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: 0,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

function buildMockUsers() {
  return [
    {
      id: "U-000001",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1 555-0101",
      company: "RodStack",
      role: "Admin",
      signup_date: "2026-06-01",
      status: "active",
      subscription_level: "pro",
      subscription_price: "29.00",
      notes: "Founding user",
      tags: "beta;power-user",
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
    {
      id: "U-000002",
      name: "John Smith",
      email: "john@acme.com",
      phone: "+1 555-0102",
      company: "Acme Corp",
      role: "Developer",
      signup_date: "2026-06-01",
      status: "active",
      subscription_level: "enterprise",
      subscription_price: "99.00",
      notes: "Referred by Jane",
      tags: "enterprise;referral",
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
    {
      id: "U-000003",
      name: "Sara Lee",
      email: "sara@example.com",
      phone: "",
      company: "",
      role: "",
      signup_date: "2026-06-01",
      status: "pending",
      subscription_level: "free",
      subscription_price: "0.00",
      notes: "",
      tags: "new",
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
  ];
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* use mock */
  }
  return buildMockUsers();
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function AdminDatabase({ onExit }) {
  const [users, setUsers] = useState(loadUsers);
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSub, setFilterSub] = useState("all");
  const [form, setForm] = useState(EMPTY_USER);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortCol, setSortCol] = useState("signup_date");
  const [sortDir, setSortDir] = useState("desc");
  const [hoveredRow, setHoveredRow] = useState(null);

  const persistUsers = useCallback((nextUsers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUsers));
    } catch {
      /* storage full or unavailable */
    }
  }, []);

  const commitUsers = useCallback(
    (updater) => {
      setUsers((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistUsers(next);
        return next;
      });
    },
    [persistUsers]
  );

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        [u.name, u.email, u.company, u.role, u.tags].some((f) =>
          (f || "").toLowerCase().includes(q)
        );
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      const matchSub = filterSub === "all" || u.subscription_level === filterSub;
      return matchSearch && matchStatus && matchSub;
    })
    .sort((a, b) => {
      const av = a[sortCol] || "";
      const bv = b[sortCol] || "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    mrr: users.reduce((s, u) => s + parseFloat(u.subscription_price || 0), 0),
    enterprise: users.filter((u) => u.subscription_level === "enterprise").length,
  };

  const handleAdd = () => {
    if (!form.name || !form.email) {
      showToast("Name and email are required", "error");
      return;
    }
    const maxId = users.reduce((m, u) => {
      const n = parseInt((u.id || "U-000000").split("-")[1], 10);
      return n > m ? n : m;
    }, 0);
    const nextNum = maxId + 1;
    const newUser = {
      ...form,
      id: "U-" + String(nextNum).padStart(6, "0"),
      signup_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };
    commitUsers((prev) => [newUser, ...prev]);
    setForm(EMPTY_USER);
    setView("table");
    showToast(`✓ ${newUser.name} added (U-${String(nextNum).padStart(6, "0")})`);
  };

  const handleUpdate = () => {
    const updated = {
      ...selected,
      updated_at: new Date().toISOString().split("T")[0],
    };
    commitUsers((prev) => prev.map((u) => (u.id === selected.id ? updated : u)));
    showToast(`✓ ${selected.name} updated`);
    setView("table");
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Remove ${name} from the database?`)) return;
    commitUsers((prev) => prev.filter((u) => u.id !== id));
    if (view === "detail") setView("table");
    showToast(`${name} removed`);
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(false);
    setAiResponse(
      "Ask Claude is disabled. Client-side Anthropic API keys (VITE_ANTHROPIC_API_KEY) were removed for security. Re-enable via a server-side proxy after secure admin auth is in place."
    );
  };

  const s = {
    app: {
      minHeight: "100vh",
      background: "#070b12",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#cbd5e1",
      display: "flex",
      flexDirection: "column",
    },
    topbar: {
      background: "#0a0f1a",
      borderBottom: "1px solid #1e293b",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      height: 52,
      gap: 16,
      flexShrink: 0,
    },
    logo: {
      fontFamily: "'DM Mono', monospace",
      fontWeight: 700,
      fontSize: 14,
      color: "#f1f5f9",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    navBtn: (active) => ({
      background: active ? "#1e293b" : "transparent",
      border: "none",
      color: active ? "#f1f5f9" : "#475569",
      padding: "5px 12px",
      borderRadius: 6,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.04em",
      transition: "all 0.15s",
    }),
    main: { flex: 1, padding: "20px 24px", overflow: "auto" },
    statRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      background: "#0d1424",
      border: "1px solid #1e293b",
      borderRadius: 10,
      padding: "14px 16px",
    },
    statLabel: {
      fontSize: 10,
      color: "#475569",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 4,
    },
    statVal: { fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" },
    toolbar: {
      display: "flex",
      gap: 10,
      marginBottom: 16,
      flexWrap: "wrap",
      alignItems: "center",
    },
    input: {
      background: "#0d1424",
      border: "1px solid #1e293b",
      color: "#cbd5e1",
      padding: "7px 12px",
      borderRadius: 7,
      fontSize: 12,
      fontFamily: "'DM Mono', monospace",
      outline: "none",
    },
    select: {
      background: "#0d1424",
      border: "1px solid #1e293b",
      color: "#94a3b8",
      padding: "7px 10px",
      borderRadius: 7,
      fontSize: 12,
      fontFamily: "'DM Mono', monospace",
      cursor: "pointer",
    },
    btn: (variant = "default") => ({
      background:
        variant === "primary" ? "#1d4ed8" : variant === "danger" ? "#7f1d1d" : "#1e293b",
      color: variant === "primary" ? "#fff" : variant === "danger" ? "#fca5a5" : "#cbd5e1",
      border: "none",
      borderRadius: 7,
      padding: "7px 14px",
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.03em",
      transition: "all 0.15s",
    }),
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th: {
      textAlign: "left",
      padding: "8px 12px",
      borderBottom: "1px solid #1e293b",
      color: "#475569",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      cursor: "pointer",
      userSelect: "none",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "10px 12px",
      borderBottom: "1px solid #111827",
      verticalAlign: "middle",
    },
    row: (hover) => ({
      background: hover ? "#0d1424" : "transparent",
      cursor: "pointer",
      transition: "background 0.1s",
    }),
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 14,
    },
    label: {
      fontSize: 10,
      color: "#475569",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 5,
      display: "block",
    },
    formInput: {
      width: "100%",
      background: "#0d1424",
      border: "1px solid #1e293b",
      color: "#cbd5e1",
      padding: "9px 12px",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "'DM Mono', monospace",
      boxSizing: "border-box",
      outline: "none",
    },
    formSelect: {
      width: "100%",
      background: "#0d1424",
      border: "1px solid #1e293b",
      color: "#cbd5e1",
      padding: "9px 12px",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "'DM Mono', monospace",
      boxSizing: "border-box",
    },
    card: {
      background: "#0d1424",
      border: "1px solid #1e293b",
      borderRadius: 12,
      padding: "20px 24px",
    },
  };

  const FormSection = ({ title, user, setUser, onSave, onCancel, saveLabel }) => {
    const tags = (user.tags || "").split(";").filter(Boolean);
    const [tagVal, setTagVal] = useState("");

    const addTag = () => {
      const t = tagVal.trim().toLowerCase();
      if (t && !tags.includes(t)) {
        setUser((u) => ({ ...u, tags: [...tags, t].join(";") }));
      }
      setTagVal("");
    };

    return (
      <div style={s.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={user.name} size={40} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{title}</div>
              {user.id && <div style={{ fontSize: 11, color: "#475569" }}>{user.id}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={s.btn()} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" style={s.btn("primary")} onClick={onSave}>
              {saveLabel || "Save"}
            </button>
          </div>
        </div>

        <div style={s.formGrid}>
          {[
            ["name", "Full Name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "text"],
            ["company", "Company", "text"],
            ["role", "Role / Title", "text"],
            ["subscription_price", "Price (USD/mo)", "number"],
          ].map(([field, label, type]) => (
            <div key={field}>
              <label style={s.label}>{label}</label>
              <input
                type={type}
                style={s.formInput}
                value={user[field] || ""}
                onChange={(e) => setUser((u) => ({ ...u, [field]: e.target.value }))}
              />
            </div>
          ))}

          <div>
            <label style={s.label}>Status</label>
            <select
              style={s.formSelect}
              value={user.status}
              onChange={(e) => setUser((u) => ({ ...u, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={s.label}>Subscription Plan</label>
            <select
              style={s.formSelect}
              value={user.subscription_level}
              onChange={(e) => setUser((u) => ({ ...u, subscription_level: e.target.value }))}
            >
              {SUB_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={s.label}>Notes</label>
          <textarea
            style={{ ...s.formInput, height: 70, resize: "vertical" }}
            value={user.notes || ""}
            onChange={(e) => setUser((u) => ({ ...u, notes: e.target.value }))}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={s.label}>Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {tags.map((t) => (
              <Pill
                key={t}
                label={t}
                onRemove={() =>
                  setUser((u) => ({ ...u, tags: tags.filter((x) => x !== t).join(";") }))
                }
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...s.formInput, flex: 1 }}
              placeholder="Add tag…"
              value={tagVal}
              onChange={(e) => setTagVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <button type="button" style={s.btn()} onClick={addTag}>
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TableView = () => (
    <>
      <div style={s.statRow}>
        {[
          { label: "Total Users", val: stats.total },
          { label: "Active", val: stats.active, accent: "#4ade80" },
          { label: "MRR", val: `$${stats.mrr.toFixed(2)}`, accent: "#38bdf8" },
          { label: "Enterprise", val: stats.enterprise, accent: "#c084fc" },
        ].map(({ label, val, accent }) => (
          <div key={label} style={s.statCard}>
            <div style={s.statLabel}>{label}</div>
            <div style={{ ...s.statVal, color: accent || "#f1f5f9" }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={s.toolbar}>
        <input
          style={{ ...s.input, width: 220 }}
          placeholder="Search name, email, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={s.select}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select style={s.select} value={filterSub} onChange={(e) => setFilterSub(e.target.value)}>
          <option value="all">All plans</option>
          {SUB_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" style={s.btn()} onClick={() => window.open(SHEET_URL, "_blank")}>
            ↗ Open Sheet
          </button>
          <button
            type="button"
            style={s.btn("primary")}
            onClick={() => {
              setForm(EMPTY_USER);
              setView("add");
            }}
          >
            + Add User
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#0a0f1a",
          border: "1px solid #1e293b",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={s.table}>
          <thead>
            <tr>
              {[
                ["id", "ID"],
                ["name", "Name"],
                ["email", "Email"],
                ["company", "Company"],
                ["status", "Status"],
                ["subscription_level", "Plan"],
                ["subscription_price", "Price"],
                ["signup_date", "Signed Up"],
              ].map(([col, label]) => (
                <th key={col} style={s.th} onClick={() => toggleSort(col)}>
                  {label} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
              <th style={s.th} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...s.td, textAlign: "center", color: "#334155", padding: 40 }}>
                  No users match your filters
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr
                key={u.id}
                style={s.row(hoveredRow === u.id)}
                onMouseEnter={() => setHoveredRow(u.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => {
                  setSelected({ ...u });
                  setView("detail");
                }}
              >
                <td style={s.td}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#475569" }}>{u.id}</span>
                </td>
                <td style={s.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={u.name} size={28} />
                    <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={s.td}>
                  <span style={{ color: "#94a3b8" }}>{u.email}</span>
                </td>
                <td style={s.td}>
                  <span style={{ color: "#64748b" }}>{u.company || "—"}</span>
                </td>
                <td style={s.td}>
                  <Badge value={u.status} map={STATUS_COLORS} />
                </td>
                <td style={s.td}>
                  <Badge value={u.subscription_level} map={SUB_COLORS} />
                </td>
                <td style={s.td}>
                  <span style={{ color: "#38bdf8" }}>
                    ${parseFloat(u.subscription_price || 0).toFixed(2)}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={{ color: "#475569", fontSize: 11 }}>{u.signup_date}</span>
                </td>
                <td style={s.td} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    style={{ ...s.btn("danger"), padding: "4px 10px", fontSize: 11 }}
                    onClick={() => handleDelete(u.id, u.name)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid #1e293b",
            fontSize: 11,
            color: "#334155",
          }}
        >
          {filtered.length} of {users.length} users
        </div>
      </div>
    </>
  );

  const DetailView = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button type="button" style={s.btn()} onClick={() => setView("table")}>
          ← Back
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          style={s.btn("danger")}
          onClick={() => handleDelete(selected.id, selected.name)}
        >
          Delete
        </button>
      </div>

      <FormSection
        title={selected.name}
        user={selected}
        setUser={setSelected}
        onSave={handleUpdate}
        onCancel={() => setView("table")}
        saveLabel="Save Changes"
      />

      <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11, color: "#334155" }}>
        <span>Created: {selected.created_at}</span>
        <span>Updated: {selected.updated_at}</span>
        <span>Signup: {selected.signup_date}</span>
      </div>
    </div>
  );

  const AddView = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button type="button" style={s.btn()} onClick={() => setView("table")}>
          ← Back
        </button>
      </div>
      <FormSection
        title="New User"
        user={form}
        setUser={setForm}
        onSave={handleAdd}
        onCancel={() => setView("table")}
        saveLabel="+ Add User"
      />
    </div>
  );

  const AiView = () => (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" style={s.btn()} onClick={() => setView("table")}>
          ← Back
        </button>
        <span style={{ fontSize: 12, color: "#475569" }}>Ask Claude about your user database</span>
      </div>

      <div style={{ ...s.card, marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            color: "#475569",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Quick prompts
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {[
            "How many active users do I have?",
            "Which users are on the enterprise plan?",
            "What's my total MRR?",
            "Show me all pending users",
            "Which users signed up most recently?",
            "Summarize my user base",
          ].map((q) => (
            <button key={q} type="button" style={{ ...s.btn(), fontSize: 11 }} onClick={() => setAiQuery(q)}>
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...s.input, flex: 1, fontSize: 13 }}
            placeholder="Ask anything about your users…"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
          />
          <button type="button" style={s.btn("primary")} onClick={handleAiQuery} disabled={aiLoading}>
            {aiLoading ? "…" : "Ask →"}
          </button>
        </div>
      </div>

      {(aiResponse || aiLoading) && (
        <div style={{ ...s.card, borderColor: "#1e3a5f" }}>
          <div
            style={{
              fontSize: 10,
              color: "#38bdf8",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Claude
          </div>
          {aiLoading ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Thinking…</div>
          ) : (
            <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {aiResponse}
            </div>
          )}
        </div>
      )}

      <div style={{ ...s.card, marginTop: 12 }}>
        <div
          style={{
            fontSize: 10,
            color: "#475569",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Current database
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px,1fr))",
            gap: 8,
          }}
        >
          {[
            ["Total", users.length, "#f1f5f9"],
            ["Active", users.filter((u) => u.status === "active").length, "#4ade80"],
            ["Pending", users.filter((u) => u.status === "pending").length, "#fbbf24"],
            ["Inactive", users.filter((u) => u.status === "inactive").length, "#f87171"],
            ["Free", users.filter((u) => u.subscription_level === "free").length, "#818cf8"],
            ["Pro", users.filter((u) => u.subscription_level === "pro").length, "#38bdf8"],
            ["Enterprise", users.filter((u) => u.subscription_level === "enterprise").length, "#c084fc"],
          ].map(([label, val, color]) => (
            <div
              key={label}
              style={{
                background: "#070b12",
                borderRadius: 8,
                padding: "10px 12px",
                border: "1px solid #1e293b",
              }}
            >
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #1d4ed8 !important; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #070b12; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>

      <div style={s.topbar}>
        <div style={s.logo}>
          RodStack <span style={{ color: "#334155" }}>/ DB</span>
        </div>
        <div style={{ width: 1, height: 20, background: "#1e293b" }} />
        <button
          type="button"
          style={s.navBtn(view === "table" || view === "detail" || view === "add")}
          onClick={() => setView("table")}
        >
          Users
        </button>
        <button type="button" style={s.navBtn(view === "ai")} onClick={() => setView("ai")}>
          ✦ Ask Claude
        </button>
        <button type="button" style={s.navBtn(view === "records")} onClick={() => setView("records")}>
          📋 Form Records
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#334155" }}>Sheet:</span>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: "#475569", textDecoration: "none" }}
          >
            {SHEET_ID.slice(0, 12)}… ↗
          </a>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              style={{
                ...s.btn(),
                marginLeft: 8,
                border: "1px solid #334155",
              }}
            >
              ← Exit Admin
            </button>
          )}
        </div>
      </div>

      <div style={s.main}>
        {view === "table" && <TableView />}
        {view === "detail" && selected && <DetailView />}
        {view === "add" && <AddView />}
        {view === "ai" && <AiView />}
        {view === "records" && <AdminRecords onBack={() => setView("table")} />}
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: toast.type === "error" ? "#7f1d1d" : "#0d2d1a",
            border: `1px solid ${toast.type === "error" ? "#991b1b" : "#166534"}`,
            color: toast.type === "error" ? "#fca5a5" : "#4ade80",
            padding: "10px 18px",
            borderRadius: 9,
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            zIndex: 999,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
