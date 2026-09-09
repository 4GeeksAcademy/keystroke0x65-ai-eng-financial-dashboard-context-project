# ⚡ React Best Practices Audit: Financial Dashboard

**Skill used:** `.agents/skills/vercel-react-best-practices/SKILL.md`  
**Full reference:** `.agents/skills/vercel-react-best-practices/AGENTS.md` (40+ rules across 8 categories)  
**Date:** 2026-09-09  
**Scope:** All frontend source files

---

## Priority Matrix

| Priority | Category | Impact | # Findings |
|----------|----------|--------|------------|
| 1 | Eliminating Waterfalls | CRITICAL | 0 |
| 2 | Bundle Size Optimization | CRITICAL | 2 |
| 3 | Server-Side Performance | HIGH | 0 |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | 1 |
| 5 | Re-render Optimization | MEDIUM | 2 |
| 6 | Rendering Performance | MEDIUM | 2 |
| 7 | JavaScript Performance | LOW-MEDIUM | 1 |
| 8 | Advanced Patterns | LOW | 0 |

---

## 1. Eliminating Waterfalls — CRITICAL

**Status: ✅ No issues found**

The app performs a single `fetch` call in `useEffect` on mount. Since there's only one network request, there are no waterfall chains to eliminate. The `computeKPIs`, `computeMonthlyData`, and `derivePeriod` functions run synchronously on the already-returned data, so there are no sequential `await` chains.

If the dashboard later adds additional API endpoints (e.g., separate calls for KPI metrics and chart data), the skill's rules would apply:

- **Rule: `async-parallel`** — Use `Promise.all()` for independent fetches
- **Rule: `async-suspense-boundaries`** — Wrap sections in `<Suspense>` with skeleton fallbacks

---

## 2. Bundle Size Optimization — CRITICAL (2 findings)

### 2.1 🔴 Barrel imports from `lucide-react` — Rule: `bundle-barrel-imports`

**Impact: CRITICAL — loads ~1,583 modules, ~2.8s extra dev time**

**Files:** 
- `frontend/src/components/dashboard/kpi-row.tsx` (line 4)
- `frontend/src/components/dashboard/dashboard-header.tsx` (line 1)

**Current code:**
```tsx
// kpi-row.tsx
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react'

// dashboard-header.tsx
import { LayoutDashboard } from 'lucide-react'
```

**Problem (per AGENTS.md §2.1):** `lucide-react` is a large icon library whose barrel file re-exports thousands of modules. When imported from the barrel, the bundler loads all 1,583 icon modules even when only 5 are actually used. The skill states that for popular icon libraries, "it takes 200–800ms just to import them." Tree-shaking doesn't help because the library is bundled — it still processes the entire module graph.

This is the single biggest performance issue in the frontend.

**Proposed Fix:** Switch to direct subpath imports that avoid the barrel.

```tsx
// kpi-row.tsx
import { TrendingUp } from 'lucide-react/dist/esm/icons/trending-up'
import { TrendingDown } from 'lucide-react/dist/esm/icons/trending-down'
import { DollarSign } from 'lucide-react/dist/esm/icons/dollar-sign'
import { BarChart2 } from 'lucide-react/dist/esm/icons/bar-chart-2'

// dashboard-header.tsx
import { LayoutDashboard } from 'lucide-react/dist/esm/icons/layout-dashboard'
```

> ⚠️ **TypeScript caveat (per skill):** Some libraries don't ship `.d.ts` files for deep import paths. Verify types resolve correctly. If they don't, consider a Vite plugin or configure `optimizePackageImports` if using a compatible tool.

**Alternative Fix (Vite + Rollup):** Configure `resolve.alias` or a Vite plugin that rewrites barrel imports to deep paths during the build. No config change needed if verified that tree-shaking effectively removes unused modules — but for `lucide-react` specifically, direct imports are the proven approach per Vercel's own analysis.

---

### 2.2 🔴 Recharts imported from barrel — Rule: `bundle-barrel-imports`

**Impact: MEDIUM — Recharts is ~200KB minified; could be deferred**

**Files:**
- `frontend/src/components/dashboard/income-outcome-chart.tsx` (lines 7–15)
- `frontend/src/components/dashboard/profit-percent-chart.tsx` (lines 6–13)

**Current code:**
```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
```

**Problem:** Recharts is a heavy charting library (~200KB+). It's imported eagerly at the top of both chart component files. Since the dashboard renders both charts on the same page, all Recharts code is included in the initial bundle, delaying Time to Interactive (TTI).

**Proposed Fix (per AGENTS.md §2.4 — Dynamic imports for heavy components):** Use `React.lazy()` + dynamic import to defer Recharts until the charts are about to render.

In `App.tsx`, convert the static import to a lazy one:

```tsx
// Remove static imports:
// import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
// import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";

// Add lazy imports:
const IncomeOutcomeChart = React.lazy(
  () => import("@/components/dashboard/income-outcome-chart")
);
const ProfitPercentChart = React.lazy(
  () => import("@/components/dashboard/profit-percent-chart")
);
```

Wrap chart sections in `<Suspense>`:

```tsx
<Suspense fallback={<div className="h-[280px] rounded-lg bg-accent animate-pulse" />}>
  <IncomeOutcomeChart data={monthlyData} loading={loading} />
</Suspense>
<Suspense fallback={<div className="h-[280px] rounded-lg bg-accent animate-pulse" />}>
  <ProfitPercentChart data={monthlyData} loading={loading} />
</Suspense>
```

This moves Recharts out of the critical bundle path, reducing initial bundle size by ~200KB.

---

## 3. Server-Side Performance — HIGH

**Status: ✅ No issues found (SPA — no server-side rendering)**

This is a Vite + React SPA with no Next.js or RSC patterns. Rules about RSC serialization, `React.cache()`, `after()`, server actions, and server-side waterfalls are not applicable. Notable by design:

- The app uses `useEffect` for data fetching (client-side), not `async` server components
- No `"use server"` actions exist
- No SSR/SSG patterns are used

---

## 4. Client-Side Data Fetching — MEDIUM-HIGH (1 finding)

### 4.1 🟠 No request deduplication — Rule: `client-swr-dedup`

**File:** `frontend/src/App.tsx` (lines 12–16)

**Current code:**
```tsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}
```

**Problem (per AGENTS.md §4.3):** The raw `fetch` API offers no built-in deduplication, caching, or revalidation. If the component unmounts and remounts (e.g., React StrictMode in dev), it fires duplicate requests. There's also no stale-while-revalidate pattern — every navigation or mount triggers a full fresh request with a loading state.

**Proposed Fix (per skill):** Use SWR for automatic deduplication:

```bash
npm install swr
```

```tsx
import useSWR from 'swr'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const fetcher = (url: string) => fetch(url).then(r => r.json())

function App() {
  const { data: movements, error, isLoading } = useSWR<FinancialMovement[]>(
    `${API_BASE_URL}/api/metrics`,
    fetcher
  );
  
  const metrics = movements ? computeKPIs(movements) : null;
  const monthlyData = movements ? computeMonthlyData(movements) : [];
  const period = movements ? derivePeriod(movements) : "";
  const loading = isLoading;
  const errorMessage = error ? "No se pudo cargar la informacion financiera. Revisa la API de backend." : null;
  // ...
}
```

This eliminates duplicate requests, provides automatic revalidation, and serves cached data while re-fetching in the background.

**Alternative:** A simpler fix without adding a dependency:

```tsx
const fetchPromiseRef = useRef<Promise<FinancialMovement[]> | null>(null);

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  if (!fetchPromiseRef.current) {
    fetchPromiseRef.current = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/metrics`);
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    })();
  }
  return fetchPromiseRef.current;
}
```

This deduplicates within a single render cycle using a module-level or ref-based promise cache.

---

## 5. Re-render Optimization — MEDIUM (2 findings)

### 5.1 🟠 Derived state computed on every render — Rule: `rerender-derived-state-no-effect`

**File:** `frontend/src/App.tsx` (lines 43–49)

**Current code:**
```tsx
useEffect(() => {
  fetchFinancialData()
    .then((movements) => {
      setMetrics(computeKPIs(movements));
      setMonthlyData(computeMonthlyData(movements));
      setPeriod(derivePeriod(movements));
    })
    // ...
}, []);
```

**Problem:** The `metrics`, `monthlyData`, and `period` are derived from `movements` and stored as separate state variables. This forces the computations to happen in the `useEffect` callback rather than during render. Per the skill (AGENTS.md §5.1), derived state should be computed during rendering, not in effects.

**Proposed Fix:** Store the raw data and compute derived values during render:

```tsx
function App() {
  const [movements, setMovements] = useState<FinancialMovement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData()
      .then(setMovements)
      .catch(() => setError("No se pudo cargar la informacion financiera. Revisa la API de backend."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => movements ? computeKPIs(movements) : null, [movements]);
  const monthlyData = useMemo(() => movements ? computeMonthlyData(movements) : [], [movements]);
  const period = useMemo(() => movements ? derivePeriod(movements) : "", [movements]);
  // ...
}
```

This moves computations to the render phase where they are cached via `useMemo` and only recompute when `movements` changes.

---

### 5.2 🟠 `CustomTooltip` components not memoized — Rule: `rerender-memo`

**Files:**
- `frontend/src/components/dashboard/income-outcome-chart.tsx` (lines 24–39)
- `frontend/src/components/dashboard/profit-percent-chart.tsx` (lines 24–40)

**Current code:**
```tsx
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  // ... renders tooltip JSX
}
```

**Problem:** Every time the chart re-renders (e.g., due to data changes or parent re-render), `CustomTooltip` is re-created as a new component instance. However, since it's defined **outside** the component (at module scope), it's not actually re-created — it's a stable reference. This is the correct pattern per the skill (AGENTS.md §5.4 — "Don't Define Components Inside Components").

**Assessment:** ❌ **Not an issue** — `CustomTooltip` is correctly defined at module level, not inside a component. This is already the recommended pattern.

---

## 6. Rendering Performance — MEDIUM (2 findings)

### 6.1 🟡 Chart components not lazy-loaded — Rule: `rendering-resource-hints`

**Files:** `frontend/src/App.tsx` (lines 5–6)

**Current code:**
```tsx
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
```

**Problem:** Both chart components (which include all of Recharts) are statically imported and included in the critical bundle. On initial page load, users wait for ~200KB of charting code before they can interact with the page, even though the charts appear below the KPI row.

**Proposed Fix (per AGENTS.md §2.4 — Dynamic imports):** See finding #2.2 above. This overlaps with bundle optimization.

Additionally, per AGENTS.md §6.10, React DOM resource hints (`<link rel="preload">`) could be used to hint browsers about critical resources:

```html
<link rel="preload" href="/assets/chart-chunk.hash.js" as="script" />
```

---

### 6.2 🟡 Conditional rendering uses `&&` pattern instead of ternary — Rule: `rendering-conditional-render`

**File:** `frontend/src/App.tsx` (line 57)

**Current code:**
```tsx
{error ? (
  <div role="alert" className="...">
    {error}
  </div>
) : null}
```

**Assessment:** ❌ **Not an issue** — The code already uses a ternary (`error ? ... : null`). This is safe. The `&&` pattern (`error && <div>...`) would be risky if `error` could be `0` or `""` (falsy non-null values). The current ternary is correct per rule §6.9.

---

## 7. JavaScript Performance — LOW-MEDIUM (1 finding)

### 7.1 🟡 `derivePeriod` uses multiple passes over array — Rule: `js-combine-iterations`

**File:** `frontend/src/App.tsx` (lines 20–30)

**Current code:**
```tsx
function derivePeriod(movements: FinancialMovement[]): string {
  if (movements.length === 0) return "No data";
  const dates = movements.map((m) => new Date(m.create_date));
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  // ...
}
```

**Problem:** This code creates a new array of `Date` objects, then iterates it twice more (once for `Math.min`, once for `Math.max`) via `.map()`. For small datasets (<1000 items) the impact is negligible, but per AGENTS.md §7.6, combining iterations is a best practice.

**Proposed Fix (per skill — combine iterations):**

```tsx
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
  // ...
}
```

This reduces 3 array iterations to 1, eliminating the intermediate array allocation.

---

## 8. Advanced Patterns — LOW

**Status: ✅ No issues found**

The app doesn't use `useEffectEvent`, callback refs, or module-level initialization patterns that would trigger these rules. The `useEffect` with `[]` deps is the standard mount pattern.

---

## Summary of Findings

| # | Priority | Rule | Issue | File | Proposed Fix |
|---|----------|------|-------|------|-------------|
| 1 | 🔴 Critical | `bundle-barrel-imports` | `lucide-react` barrel import loads 1,583 modules | `kpi-row.tsx`, `dashboard-header.tsx` | Direct subpath imports: `lucide-react/dist/esm/icons/...` |
| 2 | 🔴 Critical | `bundle-barrel-imports`, `bundle-dynamic-imports` | Recharts (~200KB) imported eagerly in critical bundle | `App.tsx`, both chart files | `React.lazy()` + `<Suspense>` for chart components |
| 3 | 🟠 Medium-High | `client-swr-dedup` | Raw `fetch` without deduplication or caching | `App.tsx` | Use SWR or ref-based promise deduplication |
| 4 | 🟠 Medium | `rerender-derived-state-no-effect` | Derived computations in `useEffect` instead of render phase | `App.tsx` | Store raw data, compute with `useMemo` during render |
| 5 | 🟡 Medium | `bundle-dynamic-imports` | Heavy charts in critical bundle (overlaps #2) | `App.tsx` | `React.lazy` + `Suspense` |
| 6 | 🟡 Low-Medium | `js-combine-iterations` | `derivePeriod` makes 3 passes over array | `App.tsx` | Single loop for min/max calculation |

---

## Recommendations (Priority Order)

### Immediate (Critical — <1 day)
1. **Fix `lucide-react` imports** — Switch to direct subpath imports to eliminate ~1,583 unnecessary modules from the bundle.
2. **Lazy-load Recharts** — Use `React.lazy()` to defer both chart components, reducing initial bundle by ~200KB.

### Short-term (Medium-High — 1–3 days)
3. **Add request deduplication** — Use SWR or the ref-based promise cache pattern to prevent duplicate API calls.

### Medium-term (Medium — 1 week)
4. **Refactor derived state** — Move `computeKPIs`, `computeMonthlyData`, and `derivePeriod` from effect to render-phase `useMemo`.
5. **Optimize `derivePeriod` iteration** — Single-pass loop instead of `.map()` chain.

---

## Applicable Rules (Not Applicable)

The following categories from the skill have zero findings because this is a Vite + React SPA (no Next.js/RSC):

| Category | Reason Not Applicable |
|----------|----------------------|
| Server-Side Performance | No RSC, SSR, server actions, or API routes |
| Advanced Patterns | No `useEffectEvent`, callback refs, or module init patterns |
| Eliminating Waterfalls | Single fetch call — no waterfall chain possible |

---

## References

- [Vercel React Best Practices — Bundle Barrel Imports](.agents/skills/vercel-react-best-practices/rules/bundle-barrel-imports.md)
- [Vercel React Best Practices — Dynamic Imports](.agents/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md)
- [Vercel React Best Practices — SWR Deduplication](.agents/skills/vercel-react-best-practices/rules/client-swr-dedup.md)
- [Vercel React Best Practices — Derived State During Render](.agents/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md)
- [Vercel React Best Practices — Combine Iterations](.agents/skills/vercel-react-best-practices/rules/js-combine-iterations.md)
- [Vercel blog: How We Optimized Package Imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)