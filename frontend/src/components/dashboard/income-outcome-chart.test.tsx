import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { IncomeOutcomeChart } from "./income-outcome-chart";
import type { MonthlyDataPoint } from "@/lib/financial-types";

const sampleData: MonthlyDataPoint[] = [
  { month: "Jan 2024", income: 50000, outcome: 30000, profitPercent: 40 },
  { month: "Feb 2024", income: 60000, outcome: 35000, profitPercent: 41.7 },
  { month: "Mar 2024", income: 70000, outcome: 40000, profitPercent: 42.9 },
];

describe("IncomeOutcomeChart", () => {
  it("renders the card title and description", () => {
    render(<IncomeOutcomeChart data={sampleData} />);

    expect(
      screen.getByText("Income vs. Outcome"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/monthly revenue and expenditure evolution/i),
    ).toBeInTheDocument();
  });

  it("renders skeleton elements when loading", () => {
    render(<IncomeOutcomeChart data={[]} loading />);

    // When loading, skeleton elements should be rendered
    expect(screen.queryByText("Income vs. Outcome")).not.toBeInTheDocument();

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows no data message when all values are zero", () => {
    const emptyData: MonthlyDataPoint[] = [
      { month: "Jan 2024", income: 0, outcome: 0, profitPercent: 0 },
    ];

    render(<IncomeOutcomeChart data={emptyData} />);

    expect(
      screen.getByText("No data available to display"),
    ).toBeInTheDocument();
  });

  it("renders the chart container when data is provided", () => {
    render(<IncomeOutcomeChart data={sampleData} />);

    // The Recharts ResponsiveContainer wraps the chart
    const chartContainer = document.querySelector(".recharts-responsive-container");
    expect(chartContainer).toBeInTheDocument();
  });

  it("renders a screen reader table with monthly data", () => {
    render(<IncomeOutcomeChart data={sampleData} />);

    const srTable = screen.getByRole("table", {
      name: /monthly income and outcome data/i,
    });
    expect(srTable).toBeInTheDocument();
    expect(srTable.className).toContain("sr-only");
  });

  it("renders all data points in the screen reader table", () => {
    render(<IncomeOutcomeChart data={sampleData} />);

    // screen reader rows for each data point
    const rows = screen.getAllByRole("row");
    // 3 data points + rowgroup wrapper rows
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Jan 2024")).toBeInTheDocument();
    expect(screen.getByText("Feb 2024")).toBeInTheDocument();
    expect(screen.getByText("Mar 2024")).toBeInTheDocument();
  });

  it("renders formatted value in screen reader cells", () => {
    render(<IncomeOutcomeChart data={sampleData} />);

    // formatCurrency(50000) = "$50,000" - check in the screen reader data
    const srTable = screen.getByRole("table", {
      name: /monthly income and outcome data/i,
    });
    expect(srTable.textContent).toContain("50,000");
    expect(srTable.textContent).toContain("income");
  });
});