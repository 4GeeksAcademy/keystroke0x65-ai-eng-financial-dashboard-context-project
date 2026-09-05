# Feature 3 — B2B vs B2C Comparison View

## Overview
Create a new dedicated page in the dashboard for comparing revenue (income) performance between B2B and B2C business lines. The view has two sections side by side, each showing a table with the top 5 income categories for that business line. Below both sections, a single chart compares total income of B2B against B2C visually. A date range filter applies to all data on the page.

---

## Relevant Endpoints

### 1. `GET /api/metrics/categories/top` — Top Income Categories per Business Line

**Purpose:** Returns the top N categories by total amount for a given operation type. Used here with `operation_type=income` to get the top income categories for each business type.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation_type` | `"income" \| "outcome"` | No | `"outcome"` | **Must be `"income"` for this feature.** |
| `limit` | `integer` | No | `5` | Number of top categories (1–20 max). Default 5 suffices. |
| `start_date` | `string` (date, `YYYY-MM-DD`) | No | `null` | Inclusive lower bound — from date filter. |
| `end_date` | `string` (date, `YYYY-MM-DD`) | No | `null` | Inclusive upper bound — from date filter. |
| `business_type` | `"B2B" \| "B2C"` | No | `null` | **Filter to get per-business-line top categories.** |

**Response (200 OK):** Array of `TopCategoryItem`
```typescript
interface TopCategoryItem {
  category: "suppliers" | "sales" | "operational" | "administrative" | "others"
  operation_type: "income" | "outcome"
  total_amount: number
}
```

**Usage in Feature 3:**
- Call this endpoint **twice**:
  1. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B&start_date=X&end_date=Y`
  2. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C&start_date=X&end_date=Y`
- Display the results in two side-by-side tables with computed percentages (see below).

---

### 2. `GET /api/metrics/facets` — Available Categories (reference)

**Purpose:** Retrieve all possible categories and business types. Optional — mainly useful for knowing valid category values, or for displaying category labels.

**Request:** No parameters.

**Response (200 OK):** `MetricsFacets`
```typescript
interface MetricsFacets {
  operation_types: ("income" | "outcome")[]
  business_types: ("B2B" | "B2C")[]
  categories: ("suppliers" | "sales" | "operational" | "administrative" | "others")[]
  min_date: string   // ISO date "YYYY-MM-DD"
  max_date: string   // ISO date "YYYY-MM-DD"
}
```

**Usage in Feature 3:**
- `categories` tells the implementer what category names to expect.
- `business_types` confirms B2B and B2C exist.
- `min_date` / `max_date` can be used for the date range filter reference label.

---

### 3. `GET /api/metrics` — Raw Movements (for comparison chart)

**Purpose:** Fetch raw financial movements filtered to income only, then aggregate totals by business type client-side.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation_type` | `"income" \| "outcome"` | No | `null` | **Set to `"income"` to get only income movements.** |
| `start_date` | `string` (date) | No | `null` | From date filter. |
| `end_date` | `string` (date) | No | `null` | From date filter. |

**Response (200 OK):** Array of `FinancialMovement`
```typescript
interface FinancialMovement {
  create_date: string
  amount: number
  operation_type: "income" | "outcome"
  category: "suppliers" | "sales" | "operational" | "administrative" | "others"
  business_type: "B2B" | "B2C"
}
```

**Usage in Feature 3 — Comparison Chart:**
- Fetch `GET /api/metrics?operation_type=income&start_date=X&end_date=Y`.
- Filter the returned movements by `business_type` client-side.
- Compute total income for B2B: `movements.filter(m => m.business_type === "B2B").reduce(sum, m.amount)`.
- Compute total income for B2C: `movements.filter(m => m.business_type === "B2C").reduce(sum, m.amount)`.
- Render a chart with these two values.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Date Range Filter: start_date ── end_date]  [Apply]       │
│  Available: 2024-01-15 to 2025-01-15                         │
├──────────────────────────┬───────────────────────────────────┤
│      ▲ B2B               │      ▲ B2C                        │
│  ┌──────────────────┐    │  ┌──────────────────┐             │
│  │ Top Income Cats  │    │  │ Top Income Cats  │             │
│  ├──────┬──────┬────┤    │  ├──────┬──────┬────┤             │
│  │ Cat  │$Tot  │ %  │    │  │ Cat  │$Tot  │ %  │             │
│  ├──────┼──────┼────┤    │  ├──────┼──────┼────┤             │
│  │ sales│$50K  │65% │    │  │ sales│$30K  │55% │             │
│  │ ...  │ ...  │... │    │  │ ...  │ ...  │... │             │
│  └──────┴──────┴────┘    │  └──────┴──────┴────┘             │
├──────────────────────────┴───────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │  B2B vs B2C — Total Income Comparison Chart          │    │
│  │                                                     │    │
│  │  ████ B2B: $78,000                                  │    │
│  │  ████ B2C: $55,000                                  │    │
│  │                                                     │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## Table Columns

### Top 5 Income Categories (per business line)

| Column | Source | Format |
|--------|--------|--------|
| Category | `TopCategoryItem.category` | Category name (Capitalized, e.g. "Sales") |
| Total Income | `TopCategoryItem.total_amount` | `formatCurrency()` — `"$50,234"` |
| % of Group Total | **Computed client-side** | `(item.total_amount / totalGroupIncome) * 100` → `"65.2%"` |

**Computing "% of Group Total":**
The API does not directly return the percentage. The frontend must compute it:
1. Get the total income for the business line from the `/api/metrics` endpoint (filtered to that `business_type` and `operation_type=income`).
2. OR sum the `total_amount` values from the top categories response (approximate — may not equal true total if there are more than 5 categories).
3. Better approach: Use `GET /api/metrics?operation_type=income&business_type=B2B` (and B2C) to get the true total per business line.
4. Then compute: `percentage = (category.total_amount / businessLineTotal) * 100`.

---

## Comparison Chart

| Aspect | Detail |
|--------|--------|
| Type | Bar chart with 2 bars (B2B vs B2C) |
| B2B value | Total income from B2B movements |
| B2C value | Total income from B2C movements |
| Colors | Distinct colors for B2B and B2C consistent with the dashboard theme |
| Labels | Show currency value on each bar |

### Approach A — Simple total comparison (recommended)
- Fetch `GET /api/metrics?operation_type=income&start_date=X&end_date=Y`.
- Split by `business_type` client-side, sum amounts.
- Render a two-bar chart.

### Approach B — Monthly breakdown (richer comparison)
- Fetch `GET /api/metrics/summary?operation_type=income&group_by=month&business_type=B2B&start_date=X&end_date=Y` and `...B2C...`.
- Overlay two lines in a line chart, one per business type.
- The `MetricsSummaryItem.income` field gives the income per period.

The spec recommends **Approach A** for simplicity, but either is valid.

---

## Data Flow

```
[Date Range: start_date, end_date]
        │
        ├──→ GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B&start_date=X&end_date=Y
        │       → TopCategoryItem[] for B2B
        │
        ├──→ GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C&start_date=X&end_date=Y
        │       → TopCategoryItem[] for B2C
        │
        ├──→ GET /api/metrics?operation_type=income&start_date=X&end_date=Y
        │       → FinancialMovement[] (filtered client-side by business_type for totals)
        │
        └──→ GET /api/metrics/facets (optional, once on page load)
                → MetricsFacets (for reference labels)
```

---

## Empty States

| Scenario | Handling |
|----------|----------|
| No income data for B2B | Show "No income data for B2B" in the B2B section. |
| No income data for B2C | Show "No income data for B2C" in the B2C section. |
| Both empty | Show "No data for the selected date range" on the entire page. |
| Empty date range (no matching data) | Show empty state on tables and chart. |

## Error Handling

| Scenario | HTTP Status | Handling |
|----------|-------------|----------|
| `start_date > end_date` | 422 | Show validation error inline on the page. |
| Network error on one endpoint | — | Show error on the affected section only (graceful degradation). |

## Implementation Notes

- This is a **new page/route** — it should have its own URL (e.g. `/comparison` or `/b2b-vs-b2c`).
- Add navigation from the home dashboard to this page (e.g. a tab or link).
- The date range filter on this page is independent of Feature 1's filter (separate page).
- Use `formatCurrency()` and `formatPercent()` from `financial-utils.ts` for consistent formatting.
- The comparison chart can reuse the same charting library as the existing `IncomeOutcomeChart` (likely Recharts).
- Fetch the `facets` endpoint once when the page loads to display the available date range reference.
- Add TypeScript types for new data structures in `financial-types.ts` (or a new types file for the comparison page):
  ```typescript
  interface BusinessLineCategory {
    category: string
    totalAmount: number
    percentageOfGroup: number
  }

  interface BusinessLineComparison {
    businessType: "B2B" | "B2C"
    totalIncome: number
    topCategories: BusinessLineCategory[]
  }
  ```