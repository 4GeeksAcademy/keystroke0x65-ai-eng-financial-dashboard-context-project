# Component Tree — 3 Features

> Alignment between features, component interfaces, and the types from `api-types.ts` & `param-types.ts`. Mismatches from `mismatches.md` are resolved inline.

---

## Feature 1 — Date Range Filter

### `DateRangeFilter`

A controlled input bar placed between the header and KPI row on the home dashboard.

**Props:**
```typescript
interface DateRangeFilterProps {
  /** From FacetsResponse.min_date */ // ← uses api-types.ts
  availableMinDate: string;
  /** From FacetsResponse.max_date */
  availableMaxDate: string;
  /** Called on "Apply" click with current raw values */
  onApply: (startDate: string, endDate: string) => void;
  /** Error from inverted date rejection (422) or network failure */
  dateError: string | null;
  /** True when facets fetch failed — shows "Could not load available date range" */
  facetsError: boolean;
  /** True while facets are still loading — disables inputs and shows skeleton placeholder */
  loading: boolean;
}
```

**State (internal):** `startDate: string`, `endDate: string` — raw `<input type="date">` values updated on keystroke.

**Behavior:**
- Renders two `<input type="date">` fields, an "Apply" button, and the "Available range: …" label.
- On Apply: calls `onApply(rawStart, rawEnd)` — parent owns fetching & applied state.
- Displays inline error from `dateError` prop.
- Loading state (`loading` is true): inputs are disabled, Apply button shows a spinner or is disabled, and the available-range label shows a skeleton placeholder instead of the date text.

**Used in:** `App.tsx` (home dashboard), positioned below `<DashboardHeader />` and above `<KPIRow />`.

### State in parent (`App.tsx`)

```typescript
// Applied filter state (updated on successful Apply)
appliedStartDate: string | null
appliedEndDate: string | null

// Facets state (fetched once on mount)
facets: FacetsResponse | null        // ← api-types.ts
facetsError: boolean

// Date error (from 422 or network)
dateError: string | null
```

Fetch on Apply: `GET /api/metrics?start_date=X&end_date=Y` using `DateRangeFilter` fields from `param-types.ts`.

---

## Feature 2 — Anomaly Alerts Table

### `AlertsTable`

Rendered below the charts on the home dashboard. Displays periods where spending spiked.

**Mismatch resolved:** The feature description says "rolling average of the previous 3 periods" but the API returns a **cumulative** average of ALL prior periods. Column label uses "Rolling Average" but displays `baseline_average` as-is from the API — no recalculation.

**Mismatch resolved:** `increase_ratio` is a raw decimal (`0.5315`), not a percentage. Multiply by 100 for "% Increase" display.

**Props:**
```typescript
interface AlertsTableProps {
  /** From GET /api/metrics/alerts */ // ← api-types.ts
  alerts: AlertResponse;
  /** True while fetching */
  loading: boolean;
  /** Error message on fetch failure */
  error: string | null;
  /** Current applied threshold */
  threshold: number;
  /** Called when user clicks threshold "Apply" */
  onThresholdChange: (threshold: number) => void;
}
```

**State (internal):** `rawThreshold: string` — raw `<input type="number">` value. On Apply, calls `onThresholdChange(parsedValue)`.

**Behavior:**
- Header row: "Anomaly Alerts" title + threshold numeric input (`min=0.01`, `max=1.0`, `step=0.01`, default `0.3`) + "Apply" button.
- Table columns: Period | Recorded Outcome | Rolling Average | % Increase.
- Empty state (`[]`): "No anomalies detected for the current threshold."
- Loading state: skeleton rows.
- Error state: error banner.

**Used in:** `App.tsx`, below `<IncomeOutcomeChart />` and `<ProfitPercentChart />`.

### Data flow in parent

- Parent forwards `appliedStartDate`/`appliedEndDate` (from Feature 1) and `threshold` to the API call.
- Fetch: `GET /api/metrics/alerts?threshold={val}&group_by=month&start_date=X&end_date=Y` using `AlertsParams` from `param-types.ts`.
- Response mapped to `AlertResponse` from `api-types.ts`.

---

## Feature 3 — B2B vs B2C Comparison View

### Page: `/comparison`

New page with its own date filter (independent of Feature 1).

### `ComparisonPage` (page-level container)

Owns all fetching and state for the comparison view.

**State:**
```typescript
// Date filter (independent of Feature 1)
startDate: string
endDate: string
dateError: string | null

// Facets (fetched once on mount)
facets: FacetsResponse | null    // ← api-types.ts

// Top categories per business line
b2bCategories: TopCategoriesResponse   // ← api-types.ts
b2cCategories: TopCategoriesResponse
categoriesLoading: boolean
categoriesError: string | null

// Income movements for comparison chart & % computation
incomeMovements: FinancialMovement[]   // ← financial-types.ts
movementsLoading: boolean
movementsError: string | null
```

**Data flow:**
- On mount & date Apply: fetches 4 requests in parallel (or with dependencies):
  1. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B` (`TopCategoriesParams` from `param-types.ts`)
  2. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C`
  3. `GET /api/metrics?operation_type=income`
  4. `GET /api/metrics/facets` (once on mount only)
- Computes per-business-line totals client-side from `incomeMovements`:
  ```typescript
  b2bTotal = incomeMovements.filter(m => m.business_type === "B2B").reduce(...)
  b2cTotal = incomeMovements.filter(m => m.business_type === "B2C").reduce(...)
  ```

### `CategoryTable`

One per business line (B2B left, B2C right).

**Mismatch resolved:** `CategoryEntry` has no `% of group total` field. The percentage is computed client-side by dividing each `total_amount` by the business line's total income.

**Mismatch resolved:** Facets endpoint returns a single global category list, not per-group. The actual categories shown come from `GET /api/metrics/categories/top` per business type. Facets are only used for the date range reference label.

**Props:**
```typescript
interface CategoryTableProps {
  /** Top categories for this business line */ // ← api-types.ts
  entries: CategoryEntry[];
  /** "B2B" | "B2C" — used for title and empty-state message */
  businessType: "B2B" | "B2C";
  /** Total income for this business line (for % computation) */
  totalIncome: number;
  /** True while fetching */
  loading: boolean;
}
```

**Behavior:**
- Title: "B2B — Top Categories" / "B2C — Top Categories"
- Table columns: Category | Total Income | % of Group Total
- % computed: `(entry.total_amount / totalIncome) * 100`, formatted via `formatPercent()`.
- Empty state: "No income data for B2B" / "No income data for B2C".
- Loading state: skeleton rows.

### `ComparisonBarChart`

Below the two tables. Compares total B2B income vs total B2C income.

**Mismatch resolved:** No single B2B-vs-B2C endpoint exists. Totals are computed client-side by filtering `incomeMovements` by `business_type`.

**Props:**
```typescript
interface ComparisonBarChartProps {
  b2bTotal: number;
  b2cTotal: number;
  loading: boolean;
}
```

**Behavior:**
- Two bars (B2B | B2C) with distinct colors.
- Currency label on each bar via `formatCurrency()`.
- Loading state: skeleton bars.
- Empty state ("No data for the selected date range") handled by parent when both totals are zero.

---

## Cross-feature notes

| Concern | Resolution |
|---|---|
| Feature 1 → Feature 2 date propagation | `App.tsx` passes `appliedStartDate`/`appliedEndDate` to both `/api/metrics` and `/api/metrics/alerts` fetches |
| Feature 1 vs Feature 3 date filter | Independent — Feature 3 has its own `DateRangeFilter`-like controls on `/comparison` |
| Formatting consistency | All monetary values via `formatCurrency()`, all percentages via `formatPercent()` from `financial-utils.ts` |
| Loading states | Each data-displaying component accepts optional `loading` boolean for skeleton UI |
| Error states | Each component accepts `error: string \| null` — parent decides whether to show inline or a banner |