import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { canAccessAdminConsole, canMutatePlatform } from "../auth/roles";

export function ProtectedRoute({ children, requireAdmin = false, requireWrite = false }) {
  const { authReady, user, platformRole, configError, supabaseEnabled } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading auth…
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-red-300">
        {configError}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !canAccessAdminConsole(platformRole)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center">
        <h1 className="text-xl font-semibold text-white">Admin access required</h1>
        <p className="max-w-md text-sm text-slate-400">
          Your account is signed in but is not in <code>platform_admins</code>.
          {supabaseEnabled
            ? " Ask a platform owner to grant platform_owner / support_admin / read_only_support."
            : " Configure Supabase and promote your user."}
        </p>
        <a href="/" className="text-cyan-400 hover:underline">
          ← Back to RodStack
        </a>
      </div>
    );
  }

  if (requireWrite && !canMutatePlatform(platformRole)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center">
        <h1 className="text-xl font-semibold text-white">Read-only support</h1>
        <p className="max-w-md text-sm text-slate-400">
          This action requires platform_owner or support_admin.
        </p>
      </div>
    );
  }

  return children;
}
