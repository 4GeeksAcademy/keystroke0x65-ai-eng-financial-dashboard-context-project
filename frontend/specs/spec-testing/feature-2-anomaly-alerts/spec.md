# Feature 2 — Anomaly Alerts Table — Specification

## Overview
Below the existing charts on the home dashboard, add a table that highlights periods where spending (outcome) spiked unexpectedly. The table has four columns: period, recorded outcome, rolling average of the previous 3 periods, and the percentage increase. The spike threshold is configurable via a numeric input (a ratio between `0.01` and `1.0`, defaulting to `0.3`). If no anomalies are detected, the table must show an explicit empty state message. The table must also respect the date range set in Feature 1 if active.

---

## Behavior

What the system does that can be observed:

1. **Anomaly alerts table is rendered** below the existing charts (IncomeOutcomeChart and ProfitPercentChart) on the home dashboard.
2. **Four columns are displayed**: Period, Recorded Outcome, Rolling Average (baseline), and % Increase.
3. **Threshold input** (a numeric `<input type="number">` with min `0.01`, max `1.0`, step `0.01`, default `0.3`) is shown above the table with a "Spike Threshold" label and an "Apply" button.
4. **On page load / date change / threshold change**, the system fetches `GET /api/metrics/alerts?threshold={val}&group_by=month&start_date=X&end_date=Y`.
5. **When the API returns `[]`** (no anomalies), the system displays an explicit empty state message: "No anomalies detected for the current threshold."
6. **When the API returns data**, the system renders the table with formatted values:
   - Period formatted from `"2024-07"` to `"Jul 2024"`
   - Outcome and baseline formatted via `formatCurrency()`
   - Increase ratio displayed as `(increase_ratio * 100).toFixed(1) + "%"`
7. **The date range from Feature 1** is passed as `start_date` and `end_date` query parameters, so the alerts table respects the dashboard-wide date filter.
8. **Loading state** shows a skeleton while fetching alerts.
9. **Error state** shows an error message if the API call fails.

## Constraints

Rules and limits within which the system operates:

1. **Threshold range**: The frontend input constrains values to `0.01`–`1.0`, though the backend accepts `≥ 0` with no upper bound.
2. **Baseline computation is backend-defined**: The backend computes `baseline_average` as the average of **ALL** prior periods (not just the last 3 as stated in the feature description). The frontend must display the returned value as-is — it cannot recalculate it.
3. **`increase_ratio` is a decimal, not a percentage**: The API returns a raw ratio (e.g., `0.5315`), not a pre-formatted percentage. The frontend must multiply by 100 for `% Increase` display.
4. **The table must always be visible in the layout** — when there are no anomalies, it must show an explicit empty state rather than disappearing.
5. **The table respects Feature 1's date range**: `start_date` and `end_date` from the dashboard filter are forwarded to the alerts endpoint.
6. **`group_by` should match the dashboard's period granularity**: Defaults to `"month"` to align with the charts.
7. **The threshold input is independent of the date filter**: Changing the threshold does not affect the date range, and vice versa. Both trigger a re-fetch.

## Verification

How to know the work is complete and correct:

1. ✅ Anomaly alerts table appears below the existing charts on the home dashboard.
2. ✅ Table has exactly 4 columns: Period, Recorded Outcome, Rolling Average, % Increase.
3. ✅ Threshold input defaults to `0.3` with range `0.01`–`1.0` and step `0.01`.
4. ✅ Changing the threshold value and clicking "Apply" re-fetches the alerts API.
5. ✅ When the API returns an empty array `[]`, the table area shows "No anomalies detected for the current threshold." — not a blank area.
6. ✅ The `start_date` and `end_date` from Feature 1 are passed to the alerts endpoint.
7. ✅ Loading state shows a skeleton while the alerts API call is in flight.
8. ✅ Error state shows an error message if the alerts API call fails.
9. ✅ `increase_ratio` values are displayed as percentages (e.g., `0.5315` → `"53.2%"`).
10. ✅ `baseline_average` is displayed as returned by the API (cumulative average, not sliding window of 3).

## Relevant Endpoint

### `GET /api/metrics/alerts` — Anomaly Detection

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `threshold` | `number` | No | `0.3` | Minimum increase ratio to trigger. Range: `≥ 0`. |
| `group_by` | `"day" \| "week" \| "month"` | No | `"month"` | Aggregation period. |
| `start_date` | `string` (date) | No | `null` | Inclusive lower bound. |
| `end_date` | `string` (date) | No | `null` | Inclusive upper bound. |
| `business_type` | `"B2B" \| "B2C"` | No | `null` | Not used in this feature. |

**Response (200 OK):** Array of `MetricsAlert`
```typescript
interface MetricsAlert {
  period: string
  outcome_total: number
  baseline_average: number
  increase_ratio: number
}
```

**Backend note:** The baseline is computed as the average of ALL prior periods, not just the last 3. The frontend should display the value as returned.

## UI Specification

```
┌──────────────────────────────────────────────────────────────┐
│  Anomaly Alerts                    [Threshold: 0.30] [Apply] │
│                                                              │
│  ┌──────────┬───────────────────┬───────────────────┬──────┐ │
│  │ Period   │ Recorded Outcome  │ Rolling Avg       │ % Inc│ │
│  ├──────────┼───────────────────┼───────────────────┼──────┤ │
│  │ Jul 2024 │ $18,542           │ $12,106           │ 53.2%│ │
│  │ Aug 2024 │ $16,231           │ $13,245           │ 22.5%│ │
│  └──────────┴───────────────────┴───────────────────┴──────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Table Columns
| Column | Source | Format |
|--------|--------|--------|
| Period | `period` | `"2024-07"` → `"Jul 2024"` |
| Recorded Outcome | `outcome_total` | `formatCurrency()` |
| Rolling Average | `baseline_average` | `formatCurrency()` |
| % Increase | `increase_ratio` | `(increase_ratio * 100).toFixed(1) + "%"` |

### Threshold Input
| Aspect | Detail |
|--------|--------|
| Type | `<input type="number">` |
| Min | `0.01` |
| Max | `1.0` |
| Step | `0.01` |
| Default | `0.3` |

### Empty State
When the API returns `[]`, show:
> **"No anomalies detected for the current threshold."**

## Data Flow
```
[Date Range from Feature 1] ─┐
                              ├──→ GET /api/metrics/alerts?threshold={val}&start_date=X&end_date=Y
[Threshold Input {0.01–1.0}] ─┘
                                      │
                                      ├──→ [] → Empty state message
                                      └──→ MetricsAlert[] → Render table
```