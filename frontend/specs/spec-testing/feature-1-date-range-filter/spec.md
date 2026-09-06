# Feature 1 — Date Range Filter — Specification

## Overview
Add two date inputs (start date / end date) to the top of the home dashboard that filter all data currently displayed on the page. Dates are sent to the API in `YYYY-MM-DD` format. Both inputs are optional; when empty, the dashboard shows all available data. The available date range (earliest and latest dates in the dataset) must be shown near the inputs as a reference.

---

## Behavior

What the system does that can be observed:

1. **On page mount**, the system fetches `GET /api/metrics/facets` to retrieve `min_date` and `max_date` and displays them as "Available range: {min_date} to {max_date}" near the date inputs.
2. **User enters optional start/end dates** in `YYYY-MM-DD` format into two `<input type="date">` fields positioned at the top of the dashboard, below the header and above the KPI cards.
3. **User clicks "Apply"** — the system re-fetches `GET /api/metrics?start_date=X&end_date=Y` with the provided values.
4. **All derived values update** — KPIs (4 cards), charts (income/outcome line chart, profit percentage line chart), and the period badge are recomputed from the filtered data via `computeKPIs()` and `computeMonthlyData()`.
5. **When both inputs are empty**, clicking "Apply" omits the query parameters and fetches the full dataset.
6. **On 422 error** (inverted dates: `start_date > end_date`), the system shows an inline error message "Start date must be before end date" and does **not** update the displayed data.
7. **On network error** fetching facets, the system shows "Could not load available date range" but still allows filtering.
8. **The date range is propagated** to Feature 2 (anomaly alerts) when both features are active — the same `start_date`/`end_date` values are passed to `GET /api/metrics/alerts`.

## Constraints

Rules and limits within which the system operates:

1. **Date format**: All dates must be sent to the API in `YYYY-MM-DD` format.
2. **Both inputs are optional**: When empty, no filter is applied — full dataset is returned.
3. **Date inversion is rejected**: The API returns HTTP 422 if `start_date > end_date`. The frontend must handle this gracefully without replacing existing data.
4. **Date inputs use native browser date picker**: `<input type="date">` — no custom date-picker component.
5. **The `/api/metrics/facets` endpoint has no parameters** — it always returns the global facets for the entire dataset, not scoped to any filter.
6. **Existing data flow is preserved**: The frontend continues to use `computeKPIs()` and `computeMonthlyData()` on the raw `FinancialMovement[]` returned by the API — no server-side aggregation is introduced.
7. **State management must track two date states**: The raw input values (`startDate`/`endDate` as strings) and the applied values (`appliedStartDate`/`appliedEndDate` as `string | null`) to avoid fetching on every keystroke.
8. **Available date range is fetched once** on page mount — it does not re-fetch when the filter changes.

## Verification

How to know the work is complete and correct:

1. ✅ Date inputs appear at the top of the dashboard, below the header and above the KPI cards.
2. ✅ Available range label ("Available range: {min_date} to {max_date}") is shown below the inputs on page load.
3. ✅ Both inputs are optional — leaving them empty and clicking "Apply" shows all data.
4. ✅ Clicking "Apply" triggers a `GET /api/metrics` call with `start_date` and `end_date` query parameters.
5. ✅ All metrics (4 KPI cards, income/outcome chart, profit percentage chart, period badge) update to reflect the filtered data.
6. ✅ Entering an inverted date range (`start_date > end_date`) shows an inline error and does **not** replace the current data.
7. ✅ Available range is fetched exactly once from `/api/metrics/facets` on mount.
8. ✅ Feature 2 (anomaly alerts) respects the same date range when the filter is active.
9. ✅ Loading state is shown while fetching filtered data.
10. ✅ Empty dataset after filtering (API returns `[]`) shows "No data for selected range" on cards/charts.

## Relevant Endpoints

### `GET /api/metrics/facets` — Available Date Range
Retrieves the earliest and latest dates for the reference label.

**Request:** No parameters.

**Response (200 OK):**
```typescript
interface MetricsFacets {
  operation_types: ("income" | "outcome")[]
  business_types: ("B2B" | "B2C")[]
  categories: ("suppliers" | "sales" | "operational" | "administrative" | "others")[]
  min_date: string   // "YYYY-MM-DD"
  max_date: string   // "YYYY-MM-DD"
}
```

### `GET /api/metrics` — Raw Movements (with date filters)
Returns the filtered financial movements. The existing frontend code already calls this endpoint and computes KPIs / chart data.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | `string` (date) | No | `null` | Inclusive lower bound. |
| `end_date` | `string` (date) | No | `null` | Inclusive upper bound. |

**Response (200 OK):** Array of `FinancialMovement`

**Error (422):** Returned when `start_date > end_date`.

## UI Specification

### Date Range Filter Component
Positioned at the top of the dashboard, below the header and above the KPI cards.

```
┌─────────────────────────────────────────────────────────────┐
│  Period: 2024 - Full Year                                  │
│                                                             │
│  [Start Date: ________]  [End Date: ________]  [Apply]     │
│  Available range: 2024-01-01 to 2025-01-15                 │
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│  │ KPI │ │ KPI │ │ KPI │ │ KPI │                          │
│  └─────┘ └─────┘ └─────┘ └─────┘                          │
│                                                             │
│  [Charts...]                                                │
└─────────────────────────────────────────────────────────────┘
```

## State Management
| State | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | `string` | `""` | Start date input value. |
| `endDate` | `string` | `""` | End date input value. |
| `appliedStartDate` | `string \| null` | `null` | Start date used in the current API call. |
| `appliedEndDate` | `string \| null` | `null` | End date used in the current API call. |
| `availableMinDate` | `string \| null` | `null` | From facets endpoint. |
| `availableMaxDate` | `string \| null` | `null` | From facets endpoint. |
| `dateError` | `string \| null` | `null` | Validation error message. |

## Error Handling

| Scenario | Handling |
|----------|----------|
| `start_date > end_date` (422) | Show "Start date must be before end date" inline. |
| Network error on facets | Show "Could not load available date range". Still allow filtering. |
| Network error on metrics | Keep existing error banner. |

## Data Flow
```
Mount → GET /api/metrics/facets → Display "Available range: {min} to {max}"
       │
User fills dates → Clicks Apply → GET /api/metrics?start_date=X&end_date=Y
       │                              ├── 200 → Recompute KPIs, charts, period
       │                              └── 422 → Show inline error, keep old data
       │
User clears dates → Clicks Apply → GET /api/metrics (no params) → Full dataset
```