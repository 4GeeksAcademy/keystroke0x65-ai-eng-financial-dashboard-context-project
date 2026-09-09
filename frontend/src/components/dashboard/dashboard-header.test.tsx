import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("renders the title and subtitle", () => {
    render(<DashboardHeader />);

    expect(
      screen.getByRole("heading", { name: /financial overview/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/executive metrics dashboard/i)).toBeInTheDocument();
  });

  it("renders the default period when none is provided", () => {
    render(<DashboardHeader />);

    expect(screen.getByText(/2024 — Full Year/i)).toBeInTheDocument();
  });

  it("renders a custom period when provided", () => {
    render(<DashboardHeader period="2023 — Full Year" />);

    expect(screen.getByText(/2023 — Full Year/i)).toBeInTheDocument();
  });

  it("renders the dashboard icon", () => {
    render(<DashboardHeader />);

    const icon = document.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the period badge with correct styling", () => {
    render(<DashboardHeader period="Jan 2024 — Jun 2024" />);

    const badge = screen.getByText(/Jan 2024 — Jun 2024/i);
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
  });
});