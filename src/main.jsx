import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import RodStackApp from "./App.jsx";
import AdminGate from "./admin/AdminGate.jsx";
import "./index.css";

function isAdminRoute() {
  return window.location.hash === "#admin" || window.location.pathname.endsWith("/admin");
}

function Root() {
  const [adminMode, setAdminMode] = useState(isAdminRoute);

  useEffect(() => {
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

  return <RodStackApp />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
