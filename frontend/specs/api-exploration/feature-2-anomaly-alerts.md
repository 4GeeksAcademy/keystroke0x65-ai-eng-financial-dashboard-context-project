# Feature 2 — Anomaly Alerts Table

## Overview
Below the existing charts on the home dashboard, add a table that highlights periods where spending (outcome) spiked unexpectedly. The table has four columns: period, recorded outcome, rolling average of the previous 3 periods, and the percentage increase. The spike threshold is configurable via a numeric input (ratio between `0.01` and `1.0`, defaulting to `0.3`). If no anomalies are detected, show an explicit empty state message. The table must respect the date range from Feature 1.

---

## Relevant Endpoint

### `GET /api/metrics/alerts` — Anomaly Detection

**Purpose:** Returns periods where the outcome total exceeds a rolling baseline average by the given threshold ratio.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `threshold` | `number` | No | `0.3` | Minimum increase ratio to trigger an alert. Range: `≥ 0` (though Feature 2 constrains it to `0.01` – `1.0`). |
| `group_by` | `"day" \| "week" \| "month"` | No | `"month"` | Aggregation period for computing outcomes and rolling average. |
| `start_date` | `string` (date, `YYYY-MM-DD`) | No | `null` | Inclusive lower bound — respect Feature 1's date range. |
| `end_date` | `string` (date, `YYYY-MM-DD`) | No | `null` | Inclusive upper bound — respect Feature 1's date range. |
| `business_type` | `"B2B" \| "B2C"` | No | `null` | Filter by business type (not used in this feature, but available). |

**Response (200 OK):** Array of `MetricsAlert`
```typescript
interface MetricsAlert {
  period: string          // Period label, e.g. "2024-01" (for month group_by)
  outcome_total: number   // Total outcome (spending) in that period
  baseline_average: number // Rolling average of outcome for ALL previous periods before this one (not just 3)
  increase_ratio: number  // (outcome_total - baseline_average) / baseline_average
}
```

**Important note from the backend implementation:**  
The backend `detect_outcome_alerts()` computes the baseline as the **average of all historical periods before the current one**, NOT the last 3 periods as stated in Feature 2's description. The rolling average includes every prior period from the earliest in the dataset. The frontend should display the value returned as `baseline_average` without recalculating it.

**Example response (anomalies found):**
```json
[
  {
    "period": "2024-07",
    "outcome_total": 18542.34,
    "baseline_average": 12105.67,
    "increase_ratio": 0.5315
  }
]
```

**Example response (no anomalies):**
```json
[]
```

---

## Table Columns

| Column | Source Field | Format |
|--------|-------------|--------|
| Period | `period` | Display as-is (`"2024-07"` → `"Jul 2024"` with formatting) |
| Recorded Outcome | `outcome_total` | `formatCurrency()` — `"$18,542"` |
| Rolling Average (baseline) | `baseline_average` | `formatCurrency()` — `"$12,106"` |
| % Increase | `increase_ratio` | `formatPercent(increase_ratio)` — `"53.2%"` |

## Threshold Input

| Aspect | Detail |
|--------|--------|
| Type | Numeric `<input type="number">` |
| Min | `0.01` |
| Max | `1.0` |
| Step | `0.01` |
| Default | `0.3` |
| Label | "Spike Threshold" or similar |

- Changing the threshold re-fetches `GET /api/metrics/alerts?threshold=<new_value>&start_date=X&end_date=Y`.
- Since the threshold is a numeric ratio, consider displaying it alongside a description like "A spike is detected when spending exceeds the baseline average by {threshold * 100}% or more."

---

## Data Flow

```
[Date Range from Feature 1]  ─┐
                              ├──→ GET /api/metrics/alerts?threshold={0.01–1.0}&start_date=X&end_date=Y
[Threshold Input {0.01–1.0}] ─┘
                                      │
                                      ├──→ [] (empty array) → Show explicit empty state:
                                      │       "No anomalies detected for the current threshold."
                                      │
                                      └──→ MetricsAlert[] → Render table with 4 columns
```

---

## Empty State

When `GET /api/metrics/alerts` returns an empty array `[]`, the table area **must** render an explicit message:

> **"No anomalies detected for the current threshold."**

Optionally include guidance: "Try lowering the spike threshold to detect smaller deviations."

The table header row should still be rendered or the message should clearly occupy the same visual space so the user knows the feature is present and active.

---

## Error Handling

| Scenario | HTTP Status | Handling |
|----------|-------------|----------|
| No anomalies (threshold too high) | 200 (`[]`) | Show empty state message (not a blank area). |
| Threshold = 0 | 200 (data) | Returns every period as an alert (baseline > 0). Backend allows `≥ 0`, but Feature 2 constrains to `0.01` – `1.0`. |
| Network error | — | Show error state on the alert table section only. |

## Implementation Notes

- The table should be placed **below** the existing charts (`IncomeOutcomeChart` and `ProfitPercentChart`), within the same dashboard layout.
- The threshold input should be placed above the table (could be inline with the date range filter row).
- Re-fetch alerts whenever the date range **or** threshold changes.
- Consider using a `<table>` or a shadcn/ui `<Table>` component for consistent styling with the dashboard.
- The `group_by` parameter should match whatever the dashboard summary uses (default `"month"`) so periods align with the charts.