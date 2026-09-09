import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "./kpi-card";
import { TrendingUp } from "lucide-react";

describe("KPICard", () => {
  const defaultProps = {
    label: "Total Income",
    value: "$100,000",
    helperText: "Cumulative revenue",
    icon: TrendingUp,
    variant: "income" as const,
  };

  it("renders the label, value, and helper text", () => {
    render(<KPICard {...defaultProps} />);

    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("Cumulative revenue")).toBeInTheDocument();
  });

  it("renders the icon with aria-hidden", () => {
    render(<KPICard {...defaultProps} />);

    const icon = document.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("shows skeleton placeholders when loading", () => {
    render(<KPICard {...defaultProps} loading />);

    // When loading, skeleton elements should be rendered instead of actual content
    expect(screen.queryByText("Total Income")).not.toBeInTheDocument();
    expect(screen.queryByText("$100,000")).not.toBeInTheDocument();

    // The skeleton container should be present
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders with outcome variant", () => {
    render(
      <KPICard
        label="Total Outcome"
        value="$50,000"
        helperText="Total expenditure"
        icon={TrendingUp}
        variant="outcome"
      />,
    );

    expect(screen.getByText("Total Outcome")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("renders with profit percent variant", () => {
    render(
      <KPICard
        label="Profit Margin"
        value="25.0%"
        helperText="Profit as percentage"
        icon={TrendingUp}
        variant="profitPercent"
      />,
    );

    expect(screen.getByText("Profit Margin")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });

  it("applies the correct card structure", () => {
    render(<KPICard {...defaultProps} />);

    const card = document.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();

    const cardContent = document.querySelector('[data-slot="card-content"]');
    expect(cardContent).toBeInTheDocument();
  });
});