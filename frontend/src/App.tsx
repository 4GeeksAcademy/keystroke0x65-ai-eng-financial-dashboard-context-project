import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import {
  type FinancialMovement,
} from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";

const IncomeOutcomeChart = lazy(() =>
  import('@/components/dashboard/income-outcome-chart').then((m) => ({
    default: m.IncomeOutcomeChart,
  }))
)

const ProfitPercentChart = lazy(() =>
  import('@/components/dashboard/profit-percent-chart').then((m) => ({
    default: m.ProfitPercentChart,
  }))
)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

let fetchPromise: Promise<FinancialMovement[]> | null = null;

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  if (!fetchPromise) {
    fetchPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/metrics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch financial data: ${response.status}`);
      }
      return response.json();
    })();
  }
  return fetchPromise;
}

function derivePeriod(movements: FinancialMovement[]): string {
  if (movements.length === 0) return "No data";
  let minTime = Infinity;
  let maxTime = -Infinity;
  for (const m of movements) {
    const time = new Date(m.create_date).getTime();
    if (time < minTime) minTime = time;
    if (time > maxTime) maxTime = time;
  }
  const min = new Date(minTime);
  const max = new Date(maxTime);
  const minYear = min.getFullYear();
  const maxYear = max.getFullYear();
  if (minYear === maxYear) {
    const isFullYear = min.getMonth() === 0 && max.getMonth() === 11;
    return isFullYear ? `${minYear} - Full Year` : `${minYear} (partial)`;
  }
  return `${minYear} - ${maxYear}`;
}

function App() {
  const [movements, setMovements] = useState<FinancialMovement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData()
      .then(setMovements)
      .catch(() => {
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const metrics = useMemo(() => movements ? computeKPIs(movements) : null, [movements]);
  const monthlyData = useMemo(() => movements ? computeMonthlyData(movements) : [], [movements]);
  const period = useMemo(() => movements ? derivePeriod(movements) : "", [movements]);

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" tabIndex={-1}>
        <div className="flex flex-col gap-8">
          <DashboardHeader period={period} />

          {error ? (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {loading ? "Loading dashboard data…" : "Dashboard loaded"}
          </div>

          <section aria-label="Key performance indicators">
            <KPIRow metrics={metrics} loading={loading} />
          </section>

          <section
            aria-label="Financial charts"
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <Suspense fallback={<div className="h-[280px] rounded-lg bg-accent animate-pulse" />}>
              <IncomeOutcomeChart data={monthlyData} loading={loading} />
            </Suspense>
            <Suspense fallback={<div className="h-[280px] rounded-lg bg-accent animate-pulse" />}>
              <ProfitPercentChart data={monthlyData} loading={loading} />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
