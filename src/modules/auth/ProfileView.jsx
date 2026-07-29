import { useState } from "react";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthPanel from "./AuthPanel.jsx";

export default function ProfileView() {
  const { data, setData, user, signOut } = useRodStackData();
  const { profile, updateProfile, updatePassword, memberships, platformRole, supabaseEnabled } =
    useAuth();
  const localProfile = data.profile || {};
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setData((d) => ({ ...d, profile: { ...d.profile, logoDataUrl: reader.result } }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setError("");
    setMessage("");
    try {
      if (supabaseEnabled) {
        await updateProfile({
          builderName: localProfile.builderName,
          shopName: localProfile.shopName,
          fullName: localProfile.builderName,
        });
      }
      setMessage("Profile saved");
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setMessage("Password updated");
    } catch (err) {
      setError(err.message || "Password update failed");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white">Builder Profile</h2>
        <p className="mt-1 text-sm text-slate-400">
          Shop identity syncs across devices when cloud auth is enabled.
        </p>
        {!user ? (
          <div className="mt-4 max-w-md">
            <AuthPanel />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Builder Name
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  value={localProfile.builderName || ""}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      profile: { ...d.profile, builderName: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Shop Name
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  value={localProfile.shopName || ""}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      profile: { ...d.profile, shopName: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Shop Logo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block text-sm text-slate-400"
                  onChange={onLogo}
                />
                {localProfile.logoDataUrl && (
                  <img src={localProfile.logoDataUrl} alt="Logo" className="mt-2 h-16 object-contain" />
                )}
              </label>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p>
                Email: <span className="text-cyan-300">{user.email}</span>
                {profile?.email_verified_at ? (
                  <span className="ml-2 text-xs text-emerald-400">Verified</span>
                ) : supabaseEnabled ? (
                  <span className="ml-2 text-xs text-amber-400">Check email to verify</span>
                ) : null}
              </p>
              {platformRole && (
                <p className="mt-1 text-xs text-violet-300">Platform role: {platformRole}</p>
              )}
              {memberships?.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  {memberships.map((m) => (
                    <li key={m.organization_id}>
                      {m.organizations?.name || m.organization_id} — {m.role}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {message && <p className="text-sm text-emerald-400">{message}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Save Profile
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300"
              >
                Sign Out
              </button>
            </div>

            {supabaseEnabled && (
              <form onSubmit={changePassword} className="max-w-md space-y-2 border-t border-slate-800 pt-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Change password</p>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200"
                >
                  Update password
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
