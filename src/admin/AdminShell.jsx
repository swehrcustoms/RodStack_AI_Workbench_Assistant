import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isReadOnlySupport } from "../lib/auth/roles";

const NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/organizations", label: "Organizations" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/entitlements", label: "Entitlements" },
  { to: "/admin/audit", label: "Audit" },
  { to: "/admin/system", label: "System" },
];

export default function AdminShell() {
  const { user, platformRole, signOut } = useAuth();
  const navigate = useNavigate();
  const readOnly = isReadOnlySupport(platformRole);

  return (
    <div className="min-h-screen bg-[#070b12] font-mono text-slate-300">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-[#0a0f1a] px-4 py-3">
        <div className="text-sm font-bold uppercase tracking-widest text-slate-100">
          RodStack <span className="text-slate-600">/ Owner</span>
        </div>
        <nav className="flex flex-wrap gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-xs ${
                  isActive ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          {readOnly && <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-300">Read-only</span>}
          <span className="text-violet-300">{platformRole}</span>
          <span>{user?.email}</span>
          <button
            type="button"
            className="rounded border border-slate-700 px-2 py-1 hover:border-slate-500"
            onClick={async () => {
              await signOut();
              navigate("/admin/login");
            }}
          >
            Sign out
          </button>
          <a href="/" className="text-cyan-400 hover:underline">
            ← App
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
