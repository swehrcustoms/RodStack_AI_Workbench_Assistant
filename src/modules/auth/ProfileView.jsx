import { useRodStackData } from "../../context/RodStackDataContext.jsx";
import AuthPanel from "./AuthPanel.jsx";

export default function ProfileView() {
  const { data, setData, user, signOut } = useRodStackData();
  const profile = data.profile || {};

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData((d) => ({ ...d, profile: { ...d.profile, logoDataUrl: reader.result } }));
    reader.readAsDataURL(file);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white">Builder Profile</h2>
        <p className="mt-1 text-sm text-slate-400">Shop identity syncs across devices when cloud auth is enabled.</p>
        {!user ? (
          <div className="mt-4 max-w-md">
            <AuthPanel />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs text-slate-400">
              Builder Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={profile.builderName || ""}
                onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, builderName: e.target.value } }))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Shop Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={profile.shopName || ""}
                onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, shopName: e.target.value } }))}
              />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              Shop Logo
              <input type="file" accept="image/*" className="mt-1 block text-sm text-slate-400" onChange={onLogo} />
              {profile.logoDataUrl && <img src={profile.logoDataUrl} alt="Logo" className="mt-2 h-16 object-contain" />}
            </label>
            <button type="button" onClick={signOut} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
