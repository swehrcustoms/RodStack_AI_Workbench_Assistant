import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminGate from "../src/admin/AdminGate.jsx";

describe("AdminGate", () => {
  it("shows disabled access notice instead of a password form", () => {
    render(<AdminGate />);
    expect(screen.getByText(/Access disabled/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Enter admin password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Admin Password/i)).not.toBeInTheDocument();
  });
});
