import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPIRow } from "./kpi-row";
import type { KPIMetrics } from "@/lib/financial-types";

const mockMetrics: KPIMetrics = {
  totalIncome: 500000,
  totalOutcome: 200000,
  profit: 300000,
  profitPercent: 60,
};

describe("KPIRow", () => {
  it("renders all four KPI cards when metrics are provided", () => {
    render(<KPIRow metrics={mockMetrics} />);

    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("Total Outcome")).toBeInTheDocument();
    expect(screen.getByText("Profit")).toBeInTheDocument();
    expect(screen.getByText("Profit Margin")).toBeInTheDocument();
  });

  it("renders formatted currency values", () => {
    render(<KPIRow metrics={mockMetrics} />);

    // formatCurrency(500000) = "$500,000"
    expect(screen.getByText("$500,000")).toBeInTheDocument();
    // formatCurrency(200000) = "$200,000"
    expect(screen.getByText("$200,000")).toBeInTheDocument();
    // formatCurrency(300000) = "$300,000"
    expect(screen.getByText("$300,000")).toBeInTheDocument();
  });

  it("renders formatted profit percent", () => {
    render(<KPIRow metrics={mockMetrics} />);

    // formatPercent(60) = "60.0%"
    expect(screen.getByText("60.0%")).toBeInTheDocument();
  });

  it("renders dash placeholders when metrics is null", () => {
    render(<KPIRow metrics={null} />);

    // With null metrics, values should be em-dashes
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("shows loading skeletons when loading is true", () => {
    render(<KPIRow metrics={null} loading />);

    // Each KPICard in loading state renders multiple skeleton elements
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    // 4 cards with skeleton elements inside
    expect(skeletons.length).toBeGreaterThanOrEqual(12);
  });

  it("renders helper text descriptions", () => {
    render(<KPIRow metrics={mockMetrics} />);

    expect(
      screen.getByText(/cumulative revenue from all income movements/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/total expenditure across all categories/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/net profit — income minus total outcome/i),
    ).toBeInTheDocument();
  });

  it("renders four KPI cards in a grid layout", () => {
    const { container } = render(<KPIRow metrics={mockMetrics} />);

    // The grid wrapper should have the grid classes
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid");
  });
});