# Feature 2 — Anomaly Alerts Table — Implementation Plan

## Overview
Add an anomaly alerts section below the existing charts on the home dashboard, with a configurable threshold and a table of detected spending spikes.

---

## Files to Create

### 1. `frontend/src/components/dashboard/anomaly-alerts-table.tsx`
**New component.** Displays the anomaly alerts table with:
- A title "Anomaly Alerts".
- A threshold input (numeric, `0.01`–`1.0`, step `0.01`, default `0.3`) with an "Apply" button.
- A 4-column table: Period, Recorded Outcome, Rolling Average, % Increase.
- An empty state message when no anomalies.
- Loading skeleton state.
- Error state.

**Props:**
```typescript
interface AnomalyAlertsTableProps {
  startDate: string | null   // From Feature 1
  endDate: string | null     // From Feature 1
}
```

**Internal state:**
| State | Type | Default | Description |
|-------|------|---------|-------------|
| `threshold` | `string` | `"0.3"` | Input value (string to allow editing). |
| `appliedThreshold` | `number` | `0.3` | Value used in API call. |
| `alerts` | `MetricsAlert[]` | `[]` | Fetched alerts. |
| `loading` | `boolean` | `true` | Loading state. |
| `error` | `string \| null` | `null` | Error message. |

### 2. `frontend/src/components/dashboard/anomaly-alerts-table.test.tsx`
**New test file.** (See tests.md)

---

## Files to Modify

### 1. `frontend/src/lib/financial-types.ts`
Add interface:
```typescript
export interface MetricsAlert {
  period: string
  outcome_total: number
  baseline_average: number
  increase_ratio: number
}
```

### 2. `frontend/src/App.tsx`
- Import and render `AnomalyAlertsTable` after the charts section.
- Pass `appliedStartDate` and `appliedEndDate` as props.
- When Feature 1 dates change, the alerts table re-fetches automatically (since it receives the applied dates).

---

## Implementation Steps

### Step 1: Add `MetricsAlert` type to `financial-types.ts`.

### Step 2: Create `anomaly-alerts-table.tsx`.
- Use `Card`, `CardHeader`, `CardTitle`, `CardContent` from shadcn/ui.
- Internal state: `threshold` (string), `alerts` (array), `loading`, `error`.
- `fetchAlerts(startDate, endDate, threshold)` function:
  - Builds URL: `/api/metrics/alerts?threshold=${threshold}&start_date=${startDate}&end_date=${endDate}`
  - Omits `start_date`/`end_date` params when null.
- `useEffect` calls `fetchAlerts` when `startDate`, `endDate`, or `appliedThreshold` changes.
- Table renders with `formatCurrency()` and percentage display.
- Empty state when `alerts.length === 0 && !loading`.

### Step 3: Modify `App.tsx`.
- Import `AnomalyAlertsTable`.
- Render below `<section aria-label="Financial charts">` closing div.
- Pass `appliedStartDate` and `appliedEndDate` as props.

### Step 4: Create test file.

---

## Dependencies
- `financial-types.ts` — needs `MetricsAlert`.
- `App.tsx` — renders the new component.
- Feature 1's date range state is passed as props.

## Verification
1. Table renders below charts.
2. Threshold input defaults to `0.3`.
3. Changing threshold re-fetches.
4. Empty state message appears when no alerts.
5. Loading skeleton displays during fetch.
6. All new tests pass.