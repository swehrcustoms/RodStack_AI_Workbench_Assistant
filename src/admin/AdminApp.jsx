import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import { ProtectedRoute } from "../lib/auth/ProtectedRoute.jsx";
import AdminShell from "./AdminShell.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminOverview from "./pages/AdminOverview.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminOrganizations from "./pages/AdminOrganizations.jsx";
import AdminSubscriptions from "./pages/AdminSubscriptions.jsx";
import AdminEntitlements from "./pages/AdminEntitlements.jsx";
import AdminAudit from "./pages/AdminAudit.jsx";
import AdminSystem from "./pages/AdminSystem.jsx";

export default function AdminApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="entitlements" element={<AdminEntitlements />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
