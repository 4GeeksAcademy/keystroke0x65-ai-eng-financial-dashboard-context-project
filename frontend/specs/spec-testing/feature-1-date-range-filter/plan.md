# Feature 1 — Date Range Filter — Implementation Plan

## Overview
Add a date range filter UI to the home dashboard that filters all displayed data via the existing API's `start_date` and `end_date` query parameters.

---

## Files to Create

### 1. `frontend/src/components/dashboard/date-range-filter.tsx`
**New component.** A self-contained filter bar with:
- Two `<input type="date">` elements for start and end dates.
- A "Available range: {min} to {max}" reference label.
- An "Apply" button.
- An inline error message div for invalid date ranges.

**Props:**
```typescript
interface DateRangeFilterProps {
  availableMinDate: string | null
  availableMaxDate: string | null
  onApply: (startDate: string | null, endDate: string | null) => void
  dateError: string | null
}
```

**States to handle:**
| State | UI |
|-------|-----|
| Default | Two empty date inputs, Apply button, available range label |
| Error (inverted dates) | Red border on inputs, error text below |
| Loading facets | "Loading available range..." text |
| Disabled Apply | N/A — Apply always clickable |

### 2. `frontend/src/components/dashboard/date-range-filter.test.tsx`
**New test file.** Tests for the DateRangeFilter component (see test file).

---

## Files to Modify

### 1. `frontend/src/App.tsx`
**Changes:**
1. Add state for `startDate`, `endDate`, `appliedStartDate`, `appliedEndDate`, `availableMinDate`, `availableMaxDate`, `dateError`.
2. On mount: fetch `/api/metrics/facets` to populate `availableMinDate` / `availableMaxDate`.
3. Modify `fetchFinancialData` to accept optional `start_date` and `end_date` parameters.
4. Pass `onApply` callback to `DateRangeFilter` that updates `appliedStartDate`/`appliedEndDate` and re-fetches.
5. Pass `dateError` state to `DateRangeFilter`.
6. Display `DateRangeFilter` between `DashboardHeader` and the error banner.

### 2. `frontend/src/lib/financial-types.ts`
Add interface:
```typescript
export interface MetricsFacets {
  operation_types: OperationType[]
  business_types: BusinessType[]
  categories: Category[]
  min_date: string
  max_date: string
}
```

---

## Implementation Steps

### Step 1: Update `financial-types.ts`
Add the `MetricsFacets` interface.

### Step 2: Create `date-range-filter.tsx`
Build the filter component with two `<input type="date">` fields, an Apply button, available range label, and error display.

### Step 3: Modify `App.tsx`
- Add facets fetch on mount.
- Wire date range state into the existing data-fetching flow.
- Pass `start_date` / `end_date` to the API call.
- Handle the 422 error from the API.

### Step 4: Create `date-range-filter.test.tsx`
Write tests covering all component states.

### Step 5: Update backend tests
Add tests for the facets endpoint and date-filtered metrics endpoint (see test file).

---

## Dependencies
- `financial-types.ts` — needs `MetricsFacets` interface.
- `App.tsx` — already calls `/api/metrics`; just add query params.
- Backend endpoints already support `start_date` and `end_date`.

## Verification
1. `docker compose up --build` runs without errors.
2. Date inputs render at the top of the dashboard.
3. Available range label shows correct dates from facets endpoint.
4. Filtering updates KPI cards and charts.
5. Inverted dates show error message.
6. Empty inputs show all data.
7. All new tests pass.