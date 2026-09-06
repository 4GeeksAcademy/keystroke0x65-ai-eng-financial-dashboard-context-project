# Feature 3 — B2B vs B2C Comparison View — Implementation Plan

## Overview
Create a new dedicated page (`/comparison`) that displays top income categories for B2B and B2C side by side, with a comparison chart below. The page has its own date range filter.

---

## Files to Create

### 1. `frontend/src/components/dashboard/b2b-b2c-comparison.tsx`
**New page component.** Full page rendering:
- Page title "B2B vs B2C Comparison".
- Date range filter with Apply button and available range label.
- Two side-by-side Card sections, each with a `TopCategoriesTable`.
- Comparison chart (Recharts `BarChart`).

**State:**
| State | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | `string` | `""` | Start date input. |
| `endDate` | `string` | `""` | End date input. |
| `appliedStartDate` | `string \| null` | `null` | Applied start date. |
| `appliedEndDate` | `string \| null` | `null` | Applied end date. |
| `b2bCategories` | `TopCategoryItem[]` | `[]` | B2B top categories. |
| `b2cCategories` | `TopCategoryItem[]` | `[]` | B2C top categories. |
| `b2bTotalIncome` | `number` | `0` | Total B2B income. |
| `b2cTotalIncome` | `number` | `0` | Total B2C income. |
| `availableMinDate` | `string \| null` | `null` | From facets. |
| `availableMaxDate` | `string \| null` | `null` | From facets. |
| `loading` | `boolean` | `true` | Loading state. |
| `error` | `string \| null` | `null` | Error message. |

**Data fetching:**
- `fetchComparisonData(startDate, endDate)`:
  1. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B&start_date=X&end_date=Y`
  2. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C&start_date=X&end_date=Y`
  3. `GET /api/metrics?operation_type=income&start_date=X&end_date=Y` → compute totals client-side

### 2. `frontend/src/components/dashboard/top-categories-table.tsx`
**Reusable table component** for displaying top categories.

**Props:**
```typescript
interface TopCategoriesTableProps {
  title: string                    // "B2B" or "B2C"
  categories: TopCategoryItem[]
  totalIncome: number              // For computing percentages
  loading?: boolean
  error?: string | null
}
```

### 3. `frontend/src/components/dashboard/b2b-b2c-chart.tsx`
**Reusable chart component** for the comparison bar chart.

**Props:**
```typescript
interface B2bB2cChartProps {
  b2bTotal: number
  b2cTotal: number
  loading?: boolean
}
```

### 4. Test files (see tests.md)

---

## Files to Modify

### 1. `frontend/src/lib/financial-types.ts`
Add:
```typescript
export interface TopCategoryItem {
  category: string
  operation_type: OperationType
  total_amount: number
}
```

### 2. `frontend/src/App.tsx`
- Add a navigation link or route to the comparison page.
- Import and conditionally render `B2bB2cComparison` (e.g., at a new route or via a tab).

---

## Implementation Steps

### Step 1: Add `TopCategoryItem` type to `financial-types.ts`.

### Step 2: Create `top-categories-table.tsx`.
- Shows a table with 3 columns: Category, Total Income, % of Group Total.
- Handle loading (skeleton), empty ("No income data for {title}"), and error states.

### Step 3: Create `b2b-b2c-chart.tsx`.
- Recharts `BarChart` with 2 bars (B2B, B2C).
- Format values with `formatCurrency`.
- Handle loading skeleton and empty state.

### Step 4: Create `b2b-b2c-comparison.tsx`.
- Main page component that orchestrates fetching and rendering.
- Date range filter at the top.
- Two `TopCategoriesTable` components side by side.
- `B2bB2cChart` below.

### Step 5: Modify `App.tsx` to add routing to the comparison page.
- Add a navigation bar with a link to `/comparison`.
- Use React Router or conditional rendering based on state.

### Step 6: Create test files.

---

## Dependencies
- `financial-types.ts` — needs `TopCategoryItem`.
- Recharts — already used in the project (`BarChart`, `Bar`).
- `formatCurrency` — already exists.

## Verification
1. Navigation to `/comparison` works.
2. Two tables render side by side with correct data.
3. Percentages are computed correctly.
4. Bar chart shows B2B vs B2C total income.
5. Date range filter works and re-fetches data.
6. Empty states show for each section when applicable.
7. All new tests pass.