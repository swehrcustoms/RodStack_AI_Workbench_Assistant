import { useState } from "react";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AuthPanel({ onClose }) {
  const { user, migrateLegacyToCloud, migrationOffered, authReady } = useRodStackData();
  const { signIn, signUp, resetPassword, supabaseEnabled } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authReady) return null;

  if (user) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-4">
        <p className="text-sm text-slate-300">
          Signed in as <span className="text-cyan-300">{user.email}</span>
        </p>
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
    setInfo("");
    setLoading(true);
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setInfo("Password reset email sent. Check your inbox.");
        setMode("signin");
      } else if (mode === "signin") {
        await signIn({ email, password });
        onClose?.();
      } else {
        const result = await signUp({ email, password, builderName, shopName });
        if (result?.needsEmailVerification) {
          setInfo("Check your email to verify your account before signing in.");
          setMode("signin");
        } else {
          onClose?.();
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-900/90 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
      </p>
      {mode === "signup" && (
        <>
          <input
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Builder name"
            value={builderName}
            onChange={(e) => setBuilderName(e.target.value)}
            required
          />
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Shop name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </>
      )}
      <input
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {mode !== "reset" && (
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {info && <p className="mt-2 text-xs text-emerald-400">{info}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-slate-950"
      >
        {loading
          ? "…"
          : mode === "signin"
            ? "Sign In"
            : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
      </button>
      <div className="mt-2 flex flex-col gap-1">
        {mode !== "reset" && (
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-xs text-slate-400 hover:text-cyan-300"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        )}
        {supabaseEnabled && mode === "signin" && (
          <button
            type="button"
            onClick={() => setMode("reset")}
            className="w-full text-xs text-slate-500 hover:text-cyan-300"
          >
            Forgot password?
          </button>
        )}
        {mode === "reset" && (
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="w-full text-xs text-slate-400 hover:text-cyan-300"
          >
            Back to sign in
          </button>
        )}
      </div>
    </form>
  );
}
