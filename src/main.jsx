import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import RodStackApp from "./App.jsx";
import AdminGate from "./admin/AdminGate.jsx";
import { RodStackDataProvider } from "./context/RodStackDataContext.jsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const LEGACY_ADMIN_SESSION_KEY = "rodstack.admin.session";

function isAdminRoute() {
  return window.location.hash === "#admin" || window.location.pathname.endsWith("/admin");
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
    const onRouteChange = () => setAdminMode(isAdminRoute());
    window.addEventListener("hashchange", onRouteChange);
    window.addEventListener("popstate", onRouteChange);
    return () => {
      window.removeEventListener("hashchange", onRouteChange);
      window.removeEventListener("popstate", onRouteChange);
    };
  }, []);

  if (adminMode) {
    return (
      <AdminGate
        onExit={() => {
          window.location.hash = "";
          setAdminMode(false);
        }}
      />
    );
  }

  return (
    <RodStackDataProvider>
      <RodStackApp />
    </RodStackDataProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
