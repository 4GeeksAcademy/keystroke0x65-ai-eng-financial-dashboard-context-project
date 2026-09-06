# Feature 3 — B2B vs B2C Comparison View — Specification

## Overview
Create a new dedicated page in the dashboard for comparing revenue performance between B2B and B2C business lines. The view has two sections side by side, each showing a table with the top 5 income categories for that business line. Below both sections, a single chart compares the total income of B2B against B2C visually. The user can filter the comparison by a date range. The available categories for each group come from the facets endpoint.

---

## Behavior

What the system does that can be observed:

1. **A new page** at route `/comparison` (or accessible via navigation tab/link) renders the B2B vs B2C comparison view.
2. **On page mount**, the system fetches:
   - `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B&start_date=X&end_date=Y` — top 5 income categories for B2B
   - `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C&start_date=X&end_date=Y` — top 5 income categories for B2C
   - `GET /api/metrics?operation_type=income&start_date=X&end_date=Y` — all income movements for computing per-business-line totals (for % computation and the comparison chart)
   - `GET /api/metrics/facets` — once on mount for reference labels (available date range, category list)
3. **Two side-by-side tables** are displayed, one per business line (B2B on the left, B2C on the right). Each table shows:
   - Category name (capitalized, e.g., "Sales")
   - Total income (formatted via `formatCurrency()`)
   - % of group total (computed client-side: `(category.total_amount / businessLineTotal) * 100`, formatted to one decimal)
4. **Below the tables**, a bar chart compares total B2B income vs total B2C income with distinct colors and currency labels on each bar.
5. **Date range filter** at the top of the page: two `<input type="date">` fields and an "Apply" button. Changing the dates re-fetches all data on the page.
6. **Available range label** (from facets) is shown near the date inputs as a reference.
7. **Empty states per section**:
   - No B2B data → "No income data for B2B" in the B2B section
   - No B2C data → "No income data for B2C" in the B2C section
   - Both empty → "No data for the selected date range" on the entire page
8. **On date inversion** (`start_date > end_date`), the API returns 422 — the system shows a validation error and keeps the previous data.

## Constraints

Rules and limits within which the system operates:

1. **New dedicated page**: This feature lives on its own route (`/comparison`), separate from the home dashboard. The date range filter is independent of Feature 1's filter.
2. **No single comparison endpoint exists**: There is no API endpoint that directly returns `{ b2b_total, b2c_total }`. The comparison chart totals must be computed client-side from `GET /api/metrics?operation_type=income` by filtering on `business_type`.
3. **`% of Group Total` is not returned by the API**: `TopCategoryItem` only has `category`, `operation_type`, and `total_amount`. The percentage must be computed client-side using the business line's total income from the `/api/metrics` endpoint.
4. **The `/api/metrics/facets` endpoint returns a single global category list** — it does not distinguish which categories are available per business type. The actual categories per group come from the per-business-type `categories/top` calls.
5. **Default `operation_type` is `"outcome"`**: The `categories/top` endpoint defaults to `"outcome"` — this feature **must** explicitly pass `operation_type=income`.
6. **`limit` is constrained to 1–20**: The feature uses `limit=5`. If this changes in the future, it must stay within `1`–`20`.
7. **Formatting must be consistent**: Use `formatCurrency()` and `formatPercent()` from `financial-utils.ts` for all monetary and percentage display.

## Verification

How to know the work is complete and correct:

1. ✅ A new page exists at route `/comparison` (or equivalent) accessible via navigation from the home dashboard.
2. ✅ Two side-by-side tables show the top 5 income categories for B2B (left) and B2C (right).
3. ✅ Each table displays category name, total income in currency format, and % of group total to one decimal.
4. ✅ A bar chart below the tables compares total B2B income vs total B2C income with distinct colors and value labels.
5. ✅ Date range filter at the top of the page controls all data displayed.
6. ✅ Available date range label is shown near the inputs.
7. ✅ Empty states are displayed per section when data is missing.
8. ✅ Inverted date range shows validation error and keeps previous data.
9. ✅ All monetary values use `formatCurrency()` formatting.
10. ✅ All percentages use `formatPercent()` formatting (one decimal place).
11. ✅ The `% of Group Total` column correctly sums to approximately 100% for each business line.

## Relevant Endpoints

### `GET /api/metrics/categories/top` — Top Income Categories per Business Line
Called twice (once per business line) with `operation_type=income`.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation_type` | `"income" \| "outcome"` | No | `"outcome"` | **Must be `"income"`.** |
| `limit` | `integer` | No | `5` | Top N categories (1–20). |
| `start_date` | `string` (date) | No | `null` | From date filter. |
| `end_date` | `string` (date) | No | `null` | From date filter. |
| `business_type` | `"B2B" \| "B2C"` | No | `null` | Filter by business line. |

**Response (200 OK):** Array of `TopCategoryItem`
```typescript
interface TopCategoryItem {
  category: string
  operation_type: "income" | "outcome"
  total_amount: number
}
```

### `GET /api/metrics` — Raw Movements (for comparison chart)
Fetched with `operation_type=income`, then split by `business_type` client-side to compute totals.

**Request:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation_type` | `"income" \| "outcome"` | No | `null` | Set to `"income"`. |
| `start_date` | `string` (date) | No | `null` | From date filter. |
| `end_date` | `string` (date) | No | `null` | From date filter. |

**Response (200 OK):** Array of `FinancialMovement`

### `GET /api/metrics/facets` — Reference data (optional)
Used to get available categories and business types for reference labels.

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  B2B vs B2C Comparison                                      │
│  [Date Range: start_date ── end_date]  [Apply]             │
│  Available range: 2024-01-01 to 2025-01-15                 │
├──────────────────────────┬───────────────────────────────────┤
│  ▲ B2B                   │  ▲ B2C                            │
│  ┌──────────┬──────┬───┐ │  ┌──────────┬──────┬───┐        │
│  │ Category │ Amt  │ % │ │  │ Category │ Amt  │ % │        │
│  ├──────────┼──────┼───┤ │  ├──────────┼──────┼───┤        │
│  │ Sales    │$50K  │65%│ │  │ Sales    │$30K  │55%│        │
│  │ Others   │$27K  │35%│ │  │ Others   │$25K  │45%│        │
│  └──────────┴──────┴───┘ │  └──────────┴──────┴───┘        │
├──────────────────────────┴───────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  B2B vs B2C — Total Income Comparison                │   │
│  │                                                      │   │
│  │  ████████████████████████ B2B: $78,000              │   │
│  │  ██████████████████ B2C: $55,000                    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Table Columns (per business line)

| Column | Source | Format |
|--------|--------|--------|
| Category | `TopCategoryItem.category` | Capitalized (e.g., "Sales") |
| Total Income | `TopCategoryItem.total_amount` | `formatCurrency()` |
| % of Group Total | Computed client-side | `(cat.total / groupTotal) * 100 → "65.2%"` |

**Computing % of Group Total:**
- Sum all `total_amount` values from the top categories for the business line.
- For each category: `percentage = (category.total_amount / sumOfAllCategories) * 100`.

## Comparison Chart
| Aspect | Detail |
|--------|--------|
| Type | Bar chart with 2 bars (B2B vs B2C) |
| B2B value | Total income from B2B movements |
| B2C value | Total income from B2C movements |
| Colors | Distinct colors (e.g., blue for B2B, green for B2C) |
| Labels | Show currency value on each bar |

## Empty States

| Scenario | Handling |
|----------|----------|
| No income data for B2B | Show "No income data for B2B" in the B2B section. |
| No income data for B2C | Show "No income data for B2C" in the B2C section. |
| Both empty | Show "No data for the selected date range" on the entire page. |
| `start_date > end_date` (422) | Show validation error, keep old data. |

## Data Flow
```
Page Load / Date Apply
        │
        ├──→ GET /api/metrics/categories/top?op=income&limit=5&business_type=B2B&start=X&end=Y
        ├──→ GET /api/metrics/categories/top?op=income&limit=5&business_type=B2C&start=X&end=Y
        ├──→ GET /api/metrics?operation_type=income&start_date=X&end_date=Y
        └──→ GET /api/metrics/facets (once on mount)
```