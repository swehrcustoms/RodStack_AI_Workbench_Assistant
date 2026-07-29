import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../src/context/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
    signIn: vi.fn(),
    authReady: true,
    configError: null,
    supabaseEnabled: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  isProductionAuthRequired: () => false,
}));

import AdminLogin from "../src/admin/pages/AdminLogin.jsx";

describe("AdminLogin", () => {
  it("renders secure admin login (no client password gate copy)", () => {
    render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Owner console login/i)).toBeInTheDocument();
    expect(screen.queryByText(/Access disabled/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rodstack-admin-2026/i)).not.toBeInTheDocument();
  });
});
