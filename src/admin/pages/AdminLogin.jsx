import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminLogin() {
  const { user, isAdmin, signIn, authReady, configError, supabaseEnabled } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">Loading…</div>;
  }

  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-red-300">
        {configError}
      </div>
    );
  }

  if (user && isAdmin) {
    const dest = location.state?.from || "/admin";
    return <Navigate to={dest} replace />;
  }

  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center">
        <h1 className="text-xl text-white">Not a platform admin</h1>
        <p className="max-w-md text-sm text-slate-400">
          Signed in as {user.email}, but no <code>platform_admins</code> row exists for this user.
        </p>
        <a href="/" className="text-cyan-400">
          ← Back to RodStack
        </a>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!supabaseEnabled) {
        throw new Error("Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for admin login");
      }
      await signIn({ email, password });
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] p-6 font-mono">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d1424] p-6"
      >
        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Secure admin</p>
        <h1 className="mt-2 text-xl font-bold text-slate-100">Owner console login</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Supabase Auth + platform_admins role. No client passwords or VITE_ secrets.
        </p>
        <label htmlFor="admin-email" className="mt-5 block text-[10px] uppercase tracking-wider text-slate-500">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        />
        <label htmlFor="admin-password" className="mt-3 block text-[10px] uppercase tracking-wider text-slate-500">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white"
        >
          {loading ? "…" : "Sign in"}
        </button>
        <a href="/" className="mt-3 block text-center text-xs text-slate-500 hover:text-slate-300">
          ← Back to RodStack
        </a>
      </form>
    </div>
  );
}
