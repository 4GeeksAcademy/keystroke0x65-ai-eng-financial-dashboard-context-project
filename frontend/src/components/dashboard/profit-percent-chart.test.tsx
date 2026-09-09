import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfitPercentChart } from "./profit-percent-chart";
import type { MonthlyDataPoint } from "@/lib/financial-types";

const sampleData: MonthlyDataPoint[] = [
  { month: "Jan 2024", income: 50000, outcome: 30000, profitPercent: 40 },
  { month: "Feb 2024", income: 60000, outcome: 35000, profitPercent: 41.7 },
  { month: "Mar 2024", income: 70000, outcome: 40000, profitPercent: 42.9 },
];

describe("ProfitPercentChart", () => {
  it("renders the card title and description", () => {
    render(<ProfitPercentChart data={sampleData} />);

    expect(screen.getByText("Profit Margin %")).toBeInTheDocument();
    expect(
      screen.getByText(/monthly profit as a percentage of total income/i),
    ).toBeInTheDocument();
  });

  it("renders skeleton elements when loading", () => {
    render(<ProfitPercentChart data={[]} loading />);

    // When loading, skeleton elements should be rendered
    expect(screen.queryByText("Profit Margin %")).not.toBeInTheDocument();

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows no data message when all profitPercent values are zero", () => {
    const emptyData: MonthlyDataPoint[] = [
      { month: "Jan 2024", income: 100, outcome: 100, profitPercent: 0 },
    ];

    render(<ProfitPercentChart data={emptyData} />);

    expect(
      screen.getByText("No data available to display"),
    ).toBeInTheDocument();
  });

  it("renders the chart container when data is provided", () => {
    render(<ProfitPercentChart data={sampleData} />);

    // The Recharts ResponsiveContainer wraps the chart
    const chartContainer = document.querySelector(".recharts-responsive-container");
    expect(chartContainer).toBeInTheDocument();
  });

  it("renders a screen reader table with monthly profit margin data", () => {
    render(<ProfitPercentChart data={sampleData} />);

    const srTable = screen.getByRole("table", {
      name: /monthly profit margin data/i,
    });
    expect(srTable).toBeInTheDocument();
    expect(srTable.className).toContain("sr-only");
  });

  it("renders formatted profit percentage in screen reader cells", () => {
    render(<ProfitPercentChart data={sampleData} />);

    // profitPercent 40 → "40.0% profit margin"
    expect(
      screen.getByText("40.0% profit margin"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("41.7% profit margin"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("42.9% profit margin"),
    ).toBeInTheDocument();
  });

  it("renders all data points in the screen reader table", () => {
    render(<ProfitPercentChart data={sampleData} />);

    expect(screen.getByText("Jan 2024")).toBeInTheDocument();
    expect(screen.getByText("Feb 2024")).toBeInTheDocument();
    expect(screen.getByText("Mar 2024")).toBeInTheDocument();
  });
});