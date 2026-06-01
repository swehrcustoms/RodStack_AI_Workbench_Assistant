import { useState } from "react";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";

export default function AuthPanel({ onClose }) {
  const { user, signIn, signUp, migrateLegacyToCloud, migrationOffered, authReady } = useRodStackData();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authReady) return null;

  if (user) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-4">
        <p className="text-sm text-slate-300">Signed in as <span className="text-cyan-300">{user.email}</span></p>
        {!migrationOffered && (
          <button
            type="button"
            onClick={migrateLegacyToCloud}
            className="mt-3 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          >
            Migrate local builds to cloud
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} className="mt-2 text-xs text-slate-500 hover:text-white">
            Close
          </button>
        )}
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") await signIn({ email, password });
      else await signUp({ email, password, builderName, shopName });
      onClose?.();
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-900/90 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{mode === "signin" ? "Sign In" : "Create Account"}</p>
      {mode === "signup" && (
        <>
          <input className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder="Builder name" value={builderName} onChange={(e) => setBuilderName(e.target.value)} required />
          <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
        </>
      )}
      <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="mt-3 w-full rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-slate-950">
        {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
      </button>
      <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-2 w-full text-xs text-slate-400 hover:text-cyan-300">
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
