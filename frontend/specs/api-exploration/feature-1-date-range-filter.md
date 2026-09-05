# Feature 1 — Date Range Filter

## Overview
Add two date inputs (start date / end date) to the home dashboard header that filter all displayed data. Dates are sent to the API in `YYYY-MM-DD` format. Both inputs are optional; when empty, the dashboard shows all available data. Show the available date range (earliest and latest dates in the dataset) near the inputs as a reference.

---

## Relevant Endpoints

### 1. `GET /api/metrics/facets` — Available Date Range

**Purpose:** Retrieve the earliest and latest dates in the dataset for display as a reference range.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)*  | —    | —        | —       | No query parameters. |

**Response (200 OK):** `MetricsFacets` object
```typescript
interface MetricsFacets {
  operation_types: ("income" | "outcome")[]
  business_types: ("B2B" | "B2C")[]
  categories: ("suppliers" | "sales" | "operational" | "administrative" | "others")[]
  min_date: string   // ISO date "YYYY-MM-DD" — earliest date in the dataset
  max_date: string   // ISO date "YYYY-MM-DD" — latest date in the dataset
}
```

**Usage in Feature 1:**
- Read `min_date` and `max_date` from the response.
- Display "Available range: {min_date} – {max_date}" near the date inputs as a reference.
- This endpoint has **no filtering parameters** — it always returns the global facets.

---

### 2. `GET /api/metrics` — Raw Movements (with date filters)

**Purpose:** Returns the raw financial movements used by the existing KPI cards, charts, and dashboard logic.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | `string` (date, `YYYY-MM-DD`) | No | `null` | Inclusive lower bound. |
| `end_date` | `string` (date, `YYYY-MM-DD`) | No | `null` | Inclusive upper bound. |
| `category` | `"suppliers" \| "sales" \| "operational" \| "administrative" \| "others"` | No | `null` | Filter by category. |
| `operation_type` | `"income" \| "outcome"` | No | `null` | Filter by operation type. |

**Response (200 OK):** Array of `FinancialMovement`
```typescript
interface FinancialMovement {
  create_date: string       // ISO date "YYYY-MM-DD"
  amount: number
  operation_type: "income" | "outcome"
  category: "suppliers" | "sales" | "operational" | "administrative" | "others"
  business_type: "B2B" | "B2C"
}
```

**Error (422):**
```typescript
{
  "detail": [
    {
      "loc": ["query", "start_date"],
      "msg": "start_date (2025-01-01) must be before or equal to end_date (2024-01-01)",
      "type": "value_error"
    }
  ]
}
```

**Usage in Feature 1:**
- Pass `start_date` and `end_date` (both optional, `YYYY-MM-DD`) to filter movements.
- The existing frontend code in `App.tsx` already calls this endpoint and computes KPIs / chart data via `computeKPIs()` and `computeMonthlyData()`.
- When date inputs are empty, omit both parameters → full dataset returned.
- Handle the 422 error gracefully (show a user-friendly message on inverted ranges).

---

### 3. `GET /api/metrics/summary` — Aggregated Summary (supplementary)

**Purpose:** Returns aggregated income/outcome/net grouped by day/week/month. Supports the same date filters. *May be useful if the dashboard switches from client-side aggregation to server-side aggregation.*

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `group_by` | `"day" \| "week" \| "month"` | No | `"month"` | Aggregation period. |
| `start_date` | `string` (date) | No | `null` | Inclusive lower bound. |
| `end_date` | `string` (date) | No | `null` | Inclusive upper bound. |
| `category` | *(same enum)* | No | `null` | Filter by category. |
| `operation_type` | `"income" \| "outcome"` | No | `null` | Filter by operation type. |
| `business_type` | `"B2B" \| "B2C"` | No | `null` | Filter by business type. |

**Response (200 OK):** Array of `MetricsSummaryItem`
```typescript
interface MetricsSummaryItem {
  period: string         // "YYYY-MM" (month), "YYYY-WW" (week), "YYYY-MM-DD" (day)
  income: number
  outcome: number
  net: number
}
```

---

## Data Flow

```
[Date Inputs: start_date, end_date]
        │
        ├──→ GET /api/metrics/facets       → min_date, max_date (display as reference)
        │
        └──→ GET /api/metrics?start_date=X&end_date=Y   → FinancialMovement[]
                    │
                    ├──→ computeKPIs()           → KPIMetrics (4 KPI cards)
                    └──→ computeMonthlyData()    → MonthlyDataPoint[] (2 charts)
```

## Error Handling

| Scenario | HTTP Status | Handling |
|----------|-------------|----------|
| `start_date > end_date` | 422 | Show "Start date must be before end date" inline warning. |
| Empty dataset after filtering | 200 (empty array) | Show "No data for selected range" empty state on each card/chart. |
| Both inputs empty | 200 (full data) | Show full dashboard as normal. |
| Network error | — | Show error banner with retry button (future enhancement — currently static error). |

## Implementation Notes

- Date inputs should use `<input type="date">` for native date picker support.
- Debounce filter changes or use a explicit "Apply" button to avoid excessive API calls.
- The existing `App.tsx` fetches data once in a `useEffect` — refactor to re-fetch on filter change.
- Show reference label: "Available data: {min_date} to {max_date}" formatted with readable locale.