# API Endpoints — Compact Reference

> Compact mapping of endpoint, response shape, query params, usage guidance, and current project usage, covering all 9 endpoints across 3 features.

---

## 1. `GET /health`

**No query params.**
```typescript
// Response 200:
{ status: "ok" }
```
**Usage:** Smoke test / uptime check.
**Used in project:** Backend test only (`test_health_endpoint_returns_ok`). Not consumed by the frontend.

---

## 2. `GET /api/metrics`

**Query params:**
| Param | Type | Req | Default | Description |
|-------|------|-----|---------|-------------|
| `start_date` | `YYYY-MM-DD` | No | `null` | Inclusive lower bound |
| `end_date` | `YYYY-MM-DD` | No | `null` | Inclusive upper bound |
| `category` | `suppliers\|sales\|operational\|administrative\|others` | No | `null` | Filter by category |
| `operation_type` | `income\|outcome` | No | `null` | Filter by income/outcome |

```typescript
// Response 200 — FinancialMovement[]:
interface FinancialMovement {
  create_date: string       // "YYYY-MM-DD"
  amount: number
  operation_type: "income" | "outcome"
  category: "suppliers" | "sales" | "operational" | "administrative" | "others"
  business_type: "B2B" | "B2C"
}

// Error 422:
{ detail: [{ loc: ["query","start_date"], msg: "start_date (...) must be before or equal to end_date (...)", type: "value_error" }] }
```

**Usage:**
- **Feature 1 (Date Filter):** Pass `start_date` and `end_date` (optional). Existing frontend computes KPIs/charts client-side from the returned array. Empty array → no data for range.
- **Feature 3 (B2B vs B2C):** Pass `operation_type=income` to get income-only movements; split by `business_type` client-side to compute per-line totals for the comparison chart.
- The `business_type` field is in each movement — no server-side `business_type` filter here (use `/api/metrics/b2b` or `/api/metrics/b2c` for that).

**Used in project:**
- **Frontend `App.tsx`:** `fetchFinancialData()` → `GET /api/metrics` (no filters) → `computeKPIs(movements)` → 4 KPI cards, `computeMonthlyData(movements)` → 2 charts. Fetched once in `useEffect` on mount.
- **Backend tests:** Tests date filters, category filter, operation_type filter, inverted date rejection (422).

---

## 3. `GET /api/metrics/facets`

**No query params.**
```typescript
// Response 200 — MetricsFacets:
interface MetricsFacets {
  operation_types: ("income" | "outcome")[]
  business_types: ("B2B" | "B2C")[]
  categories: ("suppliers" | "sales" | "operational" | "administrative" | "others")[]
  min_date: string   // "YYYY-MM-DD" — earliest date in dataset
  max_date: string   // "YYYY-MM-DD" — latest date in dataset
}
```

**Usage:**
- **Feature 1 (Date Filter):** Read `min_date`/`max_date` to display "Available range: {min_date} – {max_date}" reference label.
- **Feature 3 (B2B vs B2C):** `categories` informs what category names to expect; `business_types` confirms B2B/B2C exist; `min_date`/`max_date` for date filter reference. Called once on page load.

**Used in project:**
- **Backend tests:** Verifies returned facet values, date range consistency, sorted arrays.
- **Frontend:** Not currently consumed — will need to be added.

---

## 4. `GET /api/metrics/summary`

**Query params:**
| Param | Type | Req | Default | Description |
|-------|------|-----|---------|-------------|
| `group_by` | `day\|week\|month` | No | `month` | Aggregation period |
| `start_date` | `YYYY-MM-DD` | No | `null` | Inclusive lower bound |
| `end_date` | `YYYY-MM-DD` | No | `null` | Inclusive upper bound |
| `category` | *(category enum)* | No | `null` | Filter by category |
| `operation_type` | `income\|outcome` | No | `null` | Filter by income/outcome |
| `business_type` | `B2B\|B2C` | No | `null` | Filter by business type |

```typescript
// Response 200 — MetricsSummaryItem[]:
interface MetricsSummaryItem {
  period: string     // "YYYY-MM" (month), "YYYY-Wnn" (week), "YYYY-MM-DD" (day)
  income: number
  outcome: number
  net: number
}
```

**Usage:**
- **Feature 1 (Date Filter):** Supplementary — alternative to client-side aggregation if needed (currently frontend aggregates client-side via `computeMonthlyData()`).
- **Feature 3 (B2B vs B2C):** Alternative Approach B for comparison chart — get monthly income per business type: `GET /api/metrics/summary?operation_type=income&group_by=month&business_type=B2B&start_date=X&end_date=Y`.

**Used in project:**
- **Backend tests:** Verifies monthly summary structure, week grouping, business_type filter.

---

## 5. `GET /api/metrics/categories/top`

**Query params:**
| Param | Type | Req | Default | Description |
|-------|------|-----|---------|-------------|
| `operation_type` | `income\|outcome` | No | `outcome` | **Must be `income` for Feature 3** |
| `limit` | `integer` | No | `5` | 1–20, number of top categories |
| `start_date` | `YYYY-MM-DD` | No | `null` | Inclusive lower bound |
| `end_date` | `YYYY-MM-DD` | No | `null` | Inclusive upper bound |
| `business_type` | `B2B\|B2C` | No | `null` | **Filter by business line** |

```typescript
// Response 200 — TopCategoryItem[]:
interface TopCategoryItem {
  category: "suppliers" | "sales" | "operational" | "administrative" | "others"
  operation_type: "income" | "outcome"
  total_amount: number
}
```

**Usage:**
- **Feature 3 (B2B vs B2C):** Call **twice** — once per business type:
  ```
  GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B&start_date=X&end_date=Y
  GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C&start_date=X&end_date=Y
  ```
  Display in side-by-side tables (Category, Total Income, % of Group Total). The % is **computed client-side** by dividing each `total_amount` by the business line's total income (from `/api/metrics`).

**Used in project:**
- **Backend tests:** Verifies limit (returns exactly N items), descending sort, operation_type filter.

---

## 6. `GET /api/metrics/comparison`

**Query params:**
| Param | Type | Req | Default | Description |
|-------|------|-----|---------|-------------|
| `start_date` | `YYYY-MM-DD` | **Yes** | — | Start of current period |
| `end_date` | `YYYY-MM-DD` | **Yes** | — | End of current period |
| `business_type` | `B2B\|B2C` | No | `null` | Filter by business type |

```typescript
// Response 200 — MetricsComparison:
interface MetricsComparison {
  current_period: number    // Net value (income - outcome) for current period
  previous_period: number   // Net value for same-length period immediately before
  delta_abs: number         // current - previous (absolute change)
  delta_pct: number | null  // (delta_abs / |previous|) * 100, null if previous = 0
}
```

**Usage:** Not directly tied to any of the 3 features. Could be used for additional period-over-period analysis on the dashboard. The backend computes the same-length previous period automatically from the given dates.

**Used in project:**
- **Backend tests:** Verifies response shape contains all 4 fields.

---

## 7. `GET /api/metrics/alerts`

**Query params:**
| Param | Type | Req | Default | Description |
|-------|------|-----|---------|-------------|
| `threshold` | `number` | No | `0.3` | Min increase ratio to trigger alert (≥ 0) |
| `group_by` | `day\|week\|month` | No | `month` | Aggregation period |
| `start_date` | `YYYY-MM-DD` | No | `null` | Inclusive lower bound |
| `end_date` | `YYYY-MM-DD` | No | `null` | Inclusive upper bound |
| `business_type` | `B2B\|B2C` | No | `null` | Filter by business type |

```typescript
// Response 200 — MetricsAlert[]:
interface MetricsAlert {
  period: string           // e.g. "2024-07" (for month group_by)
  outcome_total: number    // Total outcome (spending) in that period
  baseline_average: number // Average of ALL prior periods' outcomes (not just last 3)
  increase_ratio: number   // (outcome_total - baseline_average) / baseline_average
}
```

**Backend note:** The baseline is the **average of all historical periods**, not just the last 3 as mentioned in Feature 2's description. Display the returned `baseline_average` as-is.

**Usage:**
- **Feature 2 (Anomaly Alerts):** Pass `threshold` (0.01–1.0, default 0.3), `start_date`, `end_date` from Feature 1. `group_by` should match the dashboard's period granularity (default `month`).
  - Empty response `[]` → show "No anomalies detected for the current threshold."
  - Non-empty → render table: Period | Recorded Outcome | Rolling Average | % Increase.

**Used in project:**
- **Backend tests:** Tests with threshold 0.2 returns data, threshold 0 returns all periods, high threshold returns empty, business_type filter.

---

## 8. `GET /api/metrics/b2b`

**Query params:** Same as `/api/metrics` (`start_date`, `end_date`, `category`, `operation_type`).

```typescript
// Response 200 — FinancialMovement[] (B2B only):
// Same shape as FinancialMovement, but all business_type === "B2B"
```

**Usage:** Dedicated B2B endpoint — convenience filter so the frontend doesn't need to filter client-side. Not directly called by the 3 features (Feature 3 uses `/api/metrics/categories/top` with `business_type` and `/api/metrics` for totals).

**Used in project:**
- **Backend test:** Verifies all returned items have `business_type === "B2B"`.

---

## 9. `GET /api/metrics/b2c`

**Query params:** Same as `/api/metrics` (`start_date`, `end_date`, `category`, `operation_type`).

```typescript
// Response 200 — FinancialMovement[] (B2C only):
// Same shape as FinancialMovement, but all business_type === "B2C"
```

**Usage:** Dedicated B2C endpoint — analog to `/api/metrics/b2b`. Not directly called by the 3 features.

**Used in project:**
- **Backend test:** Verifies all returned items have `business_type === "B2C"`.

---

## Per-Feature Quick Reference

### Feature 1 — Date Range Filter (Dashboard)
| Endpoint | Params | Why |
|----------|--------|-----|
| `GET /api/metrics/facets` | *(none)* | Get `min_date`/`max_date` for the "Available range" label |
| `GET /api/metrics` | `start_date`, `end_date` | Get filtered movements for KPI computation & charts |

### Feature 2 — Anomaly Alerts (Dashboard)
| Endpoint | Params | Why |
|----------|--------|-----|
| `GET /api/metrics/alerts` | `threshold` (0.01–1.0), `start_date`, `end_date`, `group_by=month` | Get anomaly data for the alerts table |

### Feature 3 — B2B vs B2C Comparison (New Page)
| Endpoint | Params | Why |
|----------|--------|-----|
| `GET /api/metrics/categories/top` | `operation_type=income`, `limit=5`, `business_type=B2B` / `B2C`, `start_date`, `end_date` | Top 5 income categories per business line |
| `GET /api/metrics` | `operation_type=income`, `start_date`, `end_date` | Total income per business line (for % computation & chart) |
| `GET /api/metrics/facets` | *(none)* | Category list & date range reference (once on page load) |

---

## Error Handling Summary

| Status | Meaning | Where |
|--------|---------|-------|
| **200** | OK — empty array means "no data" | All list endpoints |
| **422** | Validation error (inverted dates, bad enum) | All endpoints except `/health` and `/api/metrics/facets` |
| **404** | No movements exist to build facets | `/api/metrics/facets` (empty dataset edge case) |

## Existing Frontend Data Flow

```
App.tsx (mount)
  └── GET /api/metrics (no filters)
        └── computeKPIs()     → KPIMetrics   → KPIRow (4 cards)
        └── computeMonthlyData() → MonthlyDataPoint[] → IncomeOutcomeChart + ProfitPercentChart
```

The 3 features add the following new calls:

```
Feature 1:
  ├── GET /api/metrics/facets         → min_date, max_date (reference label)
  └── GET /api/metrics?start_date=X&end_date=Y  → Filtered data (same compute chain)

Feature 2:
  └── GET /api/metrics/alerts?threshold=X&start_date=X&end_date=Y → MetricsAlert[] (new table)

Feature 3 (new page):
  ├── GET /api/metrics/categories/top?op=income&limit=5&business_type=B2B&dates=...
  ├── GET /api/metrics/categories/top?op=income&limit=5&business_type=B2C&dates=...
  ├── GET /api/metrics?operation_type=income&dates=...          → totals for chart
  └── GET /api/metrics/facets                                   → reference labels
```