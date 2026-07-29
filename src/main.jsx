import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import RodStackApp from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { RodStackDataProvider } from "./context/RodStackDataContext.jsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const LEGACY_ADMIN_SESSION_KEY = "rodstack.admin.session";

function isAdminRoute() {
  const path = window.location.pathname;
  return (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    window.location.hash === "#admin"
  );
}

function clearLegacyAdminSession() {
  try {
    sessionStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function Root() {
  const [adminMode, setAdminMode] = useState(isAdminRoute);

  useEffect(() => {
    clearLegacyAdminSession();
    if (window.location.hash === "#admin") {
      window.history.replaceState({}, "", "/admin");
      setAdminMode(true);
    }
    const onRouteChange = () => setAdminMode(isAdminRoute());
    window.addEventListener("popstate", onRouteChange);
    return () => window.removeEventListener("popstate", onRouteChange);
  }, []);

  if (adminMode) {
    return <AdminApp />;
  }

  return (
    <AuthProvider>
      <RodStackDataProvider>
        <RodStackApp />
      </RodStackDataProvider>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
