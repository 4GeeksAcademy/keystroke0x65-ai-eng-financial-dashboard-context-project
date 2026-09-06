# Data Contracts — Financial Dashboard

> Covers all API contracts for the 3 features. Each section lists the endpoints, request/response types, valid values, constraints, and edge cases.

---

## Feature 1 — Date Range Filter

Filters the home dashboard by a date range. Both dates are optional.

### Consumed Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/metrics/facets` | GET | Retrieve `min_date` / `max_date` for the reference label |
| `GET /api/metrics` | GET | Retrieve filtered `FinancialMovement[]` for KPI & chart recomputation |

### Types

**Request — `GET /api/metrics/facets`**

No query parameters.

**Response — `FacetsResponse`** (`frontend/specs/api-types.ts`)
```typescript
interface FacetsResponse {
  operation_types: Array<"income" | "outcome">;
  business_types: Array<"B2B" | "B2C">;
  categories: Array<"suppliers" | "sales" | "operational" | "administrative" | "others">;
  min_date: string;  // "YYYY-MM-DD"
  max_date: string;  // "YYYY-MM-DD"
}
```

**Request — `GET /api/metrics`**

| Param | Type | Required | Default | Source | Backend validation |
|---|---|---|---|---|---|
| `start_date` | `string` (YYYY-MM-DD) | No | `null` | `<input type="date">` value | Must be ≤ `end_date` when both present |
| `end_date` | `string` (YYYY-MM-DD) | No | `null` | `<input type="date">` value | Must be ≥ `start_date` when both present |

Type: `DateRangeFilter` from `frontend/specs/param-types.ts`.

**Response — `FinancialMovement[]`** (from `frontend/src/lib/financial-types.ts`)
```typescript
interface FinancialMovement {
  create_date: string;       // "YYYY-MM-DD"
  amount: number;
  operation_type: "income" | "outcome";
  category: "suppliers" | "sales" | "operational" | "administrative" | "others";
  business_type: "B2B" | "B2C";
}
```

Empty array `[]` means no data for the selected range.

**Error 422** — when `start_date > end_date`:
```typescript
{ detail: [{ loc: ["query", "start_date"], msg: string, type: "value_error" }] }
```

### Edge Cases

| Case | Condition | UI Behavior |
|---|---|---|
| Empty dataset after filter | API returns `[]` | KPI cards and charts show "No data for selected range" |
| Inverted dates (422) | `start_date > end_date` | Display inline error "Start date must be before end date". Previous data remains unchanged |
| Single date filled | Only `start_date` or only `end_date` provided | API applies unilateral bound. Both inputs remain optional |
| `start_date === end_date` | Same date in both fields | API returns data for that single day. Valid |
| Facets fetch fails | Network error | Show "Could not load available date range". Date inputs remain usable |
| Metrics fetch fails | Network error | Show error banner. Previous data remains unchanged |
| Rapid consecutive Apply clicks | Multiple clicks before first fetch resolves | No queuing. Each click triggers a new fetch; latest response wins |

---

## Feature 2 — Anomaly Alerts Table

Highlights periods where spending (outcome) spiked unexpectedly. Rendered below charts on the home dashboard.

### Consumed Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/metrics/alerts` | GET | Retrieve anomaly alerts with threshold & date range |

### Types

**Request — `GET /api/metrics/alerts`**

| Param | Type | Required | Default | Valid values | Backend validation |
|---|---|---|---|---|---|
| `threshold` | `number` | No | `0.3` | `≥ 0` (frontend constrains to `0.01`–`1.0`) | Any `≥ 0`. Zero returns every period as an alert |
| `group_by` | `string` | No | `"month"` | `"day"` \| `"week"` \| `"month"` | Must match one of the 3 values |
| `start_date` | `string` (YYYY-MM-DD) | No | `null` | Any valid date | Must be ≤ `end_date` when both present |
| `end_date` | `string` (YYYY-MM-DD) | No | `null` | Any valid date | Must be ≥ `start_date` when both present |
| `business_type` | `string` | No | `null` | `"B2B"` \| `"B2C"` | Must match one of the 2 values |

Type: `AlertsParams` from `frontend/specs/param-types.ts`.

**Response — `AlertResponse`** (`frontend/specs/api-types.ts`)
```typescript
interface AlertEntry {
  period: string;           // e.g. "2024-07" for month grouping
  outcome_total: number;    // Total outcome (spending) in that period
  baseline_average: number; // Cumulative average of ALL prior periods' outcomes
  increase_ratio: number;   // Raw decimal: (outcome_total - baseline_average) / baseline_average
}

type AlertResponse = AlertEntry[];
```

Empty array `[]` means no anomalies for the current threshold.

### Display Rules

| Field | Source | Frontend transformation |
|---|---|---|
| Period | `period` | `"2024-07"` → `"Jul 2024"` (via `toLocaleDateString`) |
| Recorded Outcome | `outcome_total` | `formatCurrency(outcome_total)` |
| Rolling Average | `baseline_average` | `formatCurrency(baseline_average)` — displayed as-is (cumulative average, NOT a 3-period window) |
| % Increase | `increase_ratio` | `(increase_ratio * 100).toFixed(1) + "%"` — raw decimal, multiply by 100 |

### Edge Cases

| Case | Condition | UI Behavior |
|---|---|---|
| No anomalies | API returns `[]` | Show "No anomalies detected for the current threshold" empty state |
| Very low threshold | `threshold: 0` (or near 0) | Every period qualifies as an alert. Table shows all periods |
| Very high threshold | `threshold: 1.0` | Likely no alerts. Empty state shown |
| Alerts fetch fails | Network error | Show error banner. Previous alerts data remains if available |
| Threshold + date change race | User changes both threshold and date filter quickly | Each Apply triggers a fetch. Latest response replaces previous |

---

## Feature 3 — B2B vs B2C Comparison View

A dedicated page (`/comparison`) comparing B2B and B2C revenue performance with side-by-side category tables and a comparison bar chart.

### Consumed Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/metrics/categories/top` | GET | Top 5 income categories per business type (called twice: B2B + B2C) |
| `GET /api/metrics` | GET | All income movements for computing per-business-line totals |
| `GET /api/metrics/facets` | GET | Reference data — date range label and category list |

### Types

**Request — `GET /api/metrics/categories/top`**

| Param | Type | Required | Default | Valid values | Backend validation |
|---|---|---|---|---|---|
| `operation_type` | `string` | No | `"outcome"` | `"income"` \| `"outcome"` | Must match one of the 2 values |
| `limit` | `integer` | No | `5` | `1`–`20` | `ge=1, le=20`. Returns exactly N items in desc order |
| `start_date` | `string` (YYYY-MM-DD) | No | `null` | Any valid date | Must be ≤ `end_date` when both present |
| `end_date` | `string` (YYYY-MM-DD) | No | `null` | Any valid date | Must be ≥ `start_date` when both present |
| `business_type` | `string` | No | `null` | `"B2B"` \| `"B2C"` | Must match one of the 2 values |

Type: `TopCategoriesParams` from `frontend/specs/param-types.ts`.

**Response — `TopCategoriesResponse`** (`frontend/specs/api-types.ts`)
```typescript
interface CategoryEntry {
  category: "suppliers" | "sales" | "operational" | "administrative" | "others";
  operation_type: "income" | "outcome";
  total_amount: number;  // Monetary amount aggregated for this category
}

type TopCategoriesResponse = CategoryEntry[];
```

**Request — `GET /api/metrics`**

Same as Feature 1 but with `operation_type=income` filter. See `DateRangeFilter` in `param-types.ts`.

**Response — `FinancialMovement[]`** (same as Feature 1, filtered to income only).

**Request — `GET /api/metrics/facets`**

No parameters. Same `FacetsResponse` as Feature 1.

### Client-Side Computations

| Computed value | Formula | Used for |
|---|---|---|
| B2B total income | `incomeMovements.filter(m => m.business_type === "B2B").reduce(amounts)` | Comparison chart bar + % denominator |
| B2C total income | `incomeMovements.filter(m => m.business_type === "B2C").reduce(amounts)` | Comparison chart bar + % denominator |
| % of group total | `(entry.total_amount / businessLineTotal) * 100` | 3rd column in each `CategoryTable` |

### Edge Cases

| Case | Condition | UI Behavior |
|---|---|---|
| No B2B data | Categories response for B2B is `[]` | Show "No income data for B2B" in the B2B section |
| No B2C data | Categories response for B2C is `[]` | Show "No income data for B2C" in the B2C section |
| Both empty | Both categories responses empty | Show "No data for the selected date range" on the entire page |
| Inverted dates (422) | `start_date > end_date` | Show validation error "Start date must be before end date". Previous data remains unchanged |
| Facets fetch fails | Network error | Show "Could not load available date range". Date inputs remain functional |
| Single date filled | Only `start_date` or only `end_date` provided | API applies unilateral bound. Both inputs remain optional |
| `limit` exceeds available categories | Fewer categories exist than `limit=5` | API returns what's available (< 5 items). Table shows however many returned |

---

## Parameter Summary

All parameters are sent as query parameters (HTTP GET). Every parameter is optional at the API level (has a server-side default or `null`).

| Feature | Endpoint | Required params | Optional params |
|---|---|---|---|
| 1 | `GET /api/metrics/facets` | None | None |
| 1 | `GET /api/metrics` | None | `start_date`, `end_date` |
| 2 | `GET /api/metrics/alerts` | None | `threshold`, `group_by`, `start_date`, `end_date`, `business_type` |
| 3 | `GET /api/metrics/categories/top` | None | `operation_type`, `limit`, `start_date`, `end_date`, `business_type` |
| 3 | `GET /api/metrics` | None | `operation_type`, `start_date`, `end_date` |
| 3 | `GET /api/metrics/facets` | None | None |

### Common constraint across all endpoints

- **Date format:** Always `YYYY-MM-DD` (matching `<input type="date">` natively).
- **Date inversion** (`start_date > end_date`): HTTP 422 with error detail. Frontend must preserve previous data.
- **Date equality** (`start_date === end_date`): Valid — returns data for that single day.
- **Error payload shape (422):** `{ detail: Array<{ loc: string[], msg: string, type: string }> }`