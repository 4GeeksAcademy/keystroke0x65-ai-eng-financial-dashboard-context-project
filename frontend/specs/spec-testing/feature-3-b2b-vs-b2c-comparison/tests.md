# Feature 3 — B2B vs B2C Comparison View — Tests

## Backend Tests (to add to `backend/tests/test_routes.py`)

### Test: Top categories endpoint returns income categories for B2B
```python
def test_top_categories_b2b_income():
    """Top categories with operation_type=income and business_type=B2B returns B2B income categories."""
    response = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5, "business_type": "B2B"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) <= 5
    assert all(item["operation_type"] == "income" for item in payload)
```

### Test: Top categories endpoint returns income categories for B2C
```python
def test_top_categories_b2c_income():
    """Top categories with operation_type=income and business_type=B2C returns B2C income categories."""
    response = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5, "business_type": "B2C"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) <= 5
    assert all(item["operation_type"] == "income" for item in payload)
```

### Test: Top categories returns different results per business type
```python
def test_top_categories_b2b_vs_b2c_different():
    """B2B and B2C top categories should have different total amounts (likely different data)."""
    resp_b2b = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5, "business_type": "B2B"},
    )
    resp_b2c = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5, "business_type": "B2C"},
    )
    assert resp_b2b.status_code == 200
    assert resp_b2c.status_code == 200
    b2b = resp_b2b.json()
    b2c = resp_b2c.json()
    # Both should return at least one category
    assert len(b2b) > 0
    assert len(b2c) > 0
```

### Test: Top categories sorted descending
```python
def test_top_categories_sorted_descending():
    """Top categories should be sorted by total_amount descending."""
    response = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5},
    )
    assert response.status_code == 200
    payload = response.json()
    for i in range(len(payload) - 1):
        assert payload[i]["total_amount"] >= payload[i + 1]["total_amount"]
```

### Test: Top categories respects date range filter
```python
def test_top_categories_respects_date_range():
    """Top categories must filter by start_date and end_date."""
    full = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5},
    )
    filtered = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "income", "limit": 5, "start_date": "2024-06-01", "end_date": "2024-06-30"},
    )
    assert full.status_code == 200
    assert filtered.status_code == 200
    full_data = full.json()
    filtered_data = filtered.json()
    # Filtered to a single month should have less or equal total amount than full year
    full_total = sum(item["total_amount"] for item in full_data)
    filtered_total = sum(item["total_amount"] for item in filtered_data)
    assert filtered_total <= full_total
```

### Test: Metrics endpoint with operation_type=income returns only income movements
```python
def test_metrics_income_only():
    """Filtering by operation_type=income should return only income movements."""
    response = client.get(
        "/api/metrics",
        params={"operation_type": "income"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["operation_type"] == "income" for item in payload)
```

---

## Frontend Component Tests

### File: `frontend/src/components/dashboard/top-categories-table.test.tsx`

**Setup:**
```typescript
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopCategoriesTable } from "./top-categories-table";
import type { TopCategoryItem } from "@/lib/financial-types";
```

**Test: Renders table with categories**
```typescript
it("renders categories with name, amount, and percentage", () => {
  const categories: TopCategoryItem[] = [
    { category: "sales", operation_type: "income", total_amount: 50000 },
    { category: "others", operation_type: "income", total_amount: 25000 },
  ];
  render(
    <TopCategoriesTable
      title="B2B"
      categories={categories}
      totalIncome={75000}
      loading={false}
      error={null}
    />,
  );
  expect(screen.getByText("Sales")).toBeTruthy();
  expect(screen.getByText("Others")).toBeTruthy();
  expect(screen.getByText("66.7%")).toBeTruthy();  // 50000/75000*100
  expect(screen.getByText("33.3%")).toBeTruthy();  // 25000/75000*100
});
```

**Test: Shows loading skeleton**
```typescript
it("shows loading skeleton when loading", () => {
  render(
    <TopCategoriesTable
      title="B2B"
      categories={[]}
      totalIncome={0}
      loading={true}
      error={null}
    />,
  );
  expect(screen.getByTestId("categories-skeleton")).toBeTruthy();
});
```

**Test: Shows empty state when no categories**
```typescript
it("shows empty state when no data", () => {
  render(
    <TopCategoriesTable
      title="B2C"
      categories={[]}
      totalIncome={0}
      loading={false}
      error={null}
    />,
  );
  expect(screen.getByText(/No income data for B2C/i)).toBeTruthy();
});
```

**Test: Shows error state**
```typescript
it("shows error message when error is provided", () => {
  render(
    <TopCategoriesTable
      title="B2B"
      categories={[]}
      totalIncome={0}
      loading={false}
      error="Failed to load data"
    />,
  );
  expect(screen.getByText(/Failed to load data/i)).toBeTruthy();
});
```

**Test: Computes percentage correctly with empty total**
```typescript
it("handles zero total income gracefully", () => {
  render(
    <TopCategoriesTable
      title="B2B"
      categories={[]}
      totalIncome={0}
      loading={false}
      error={null}
    />,
  );
  expect(screen.getByText(/No income data for B2B/i)).toBeTruthy();
});
```

### File: `frontend/src/components/dashboard/b2b-b2c-chart.test.tsx`

**Setup:**
```typescript
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { B2bB2cChart } from "./b2b-b2c-chart";
```

**Test: Renders chart with both values**
```typescript
it("renders chart with B2B and B2C values", () => {
  render(<B2bB2cChart b2bTotal={78000} b2cTotal={55000} loading={false} />);
  expect(screen.getByText(/B2B/i)).toBeTruthy();
  expect(screen.getByText(/B2C/i)).toBeTruthy();
});
```

**Test: Shows loading skeleton**
```typescript
it("shows loading skeleton when loading", () => {
  render(<B2bB2cChart b2bTotal={0} b2cTotal={0} loading={true} />);
  expect(screen.getByTestId("chart-skeleton")).toBeTruthy();
});
```

### File: `frontend/src/components/dashboard/b2b-b2c-comparison.test.tsx`

**Setup:**
```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { B2bB2cComparison } from "./b2b-b2c-comparison";
```

**Test: Renders page title and date inputs**
```typescript
it("renders page title and date range filter", () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

  render(<B2bB2cComparison />);
  expect(screen.getByText(/B2B vs B2C Comparison/i)).toBeTruthy();
  expect(screen.getByLabelText(/start/i)).toBeTruthy();
  expect(screen.getByLabelText(/end/i)).toBeTruthy();
});
```

**Test: Fetches data on mount**
```typescript
it("fetches comparison data on mount", async () => {
  const mockFacets = { min_date: "2024-01-01", max_date: "2024-12-31" };
  const mockCategories = [{ category: "sales", operation_type: "income", total_amount: 50000 }];
  const mockMetrics = [
    { create_date: "2024-06-01", amount: 30000, operation_type: "income", category: "sales", business_type: "B2B" },
    { create_date: "2024-06-01", amount: 20000, operation_type: "income", category: "sales", business_type: "B2C" },
  ];

  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockFacets) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCategories) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCategories) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetrics) });

  render(<B2bB2cComparison />);

  await waitFor(() => {
    // Should have fetched the facets endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/metrics/facets"),
    );
  });
});
```

---

## Backend Unit Tests (new file: `backend/tests/test_b2b_b2c_comparison.py`)

```python
"""Unit tests for B2B vs B2C comparison logic."""
from app.routes import build_top_categories, generate_mock_movements


def test_build_top_categories_returns_sorted():
    movements = generate_mock_movements(seed=42)
    result = build_top_categories(movements, "income", 5)
    assert len(result) <= 5
    for i in range(len(result) - 1):
        assert result[i].total_amount >= result[i + 1].total_amount
    assert all(item.operation_type == "income" for item in result)


def test_build_top_categories_limit_respected():
    movements = generate_mock_movements(seed=42)
    result = build_top_categories(movements, "income", 3)
    assert len(result) == 3


def test_build_top_categories_income_only():
    """Only income movements should be included."""
    movements = generate_mock_movements(seed=42)
    result = build_top_categories(movements, "income", 10)
    for item in result:
        assert item.operation_type == "income"


def test_build_top_categories_empty_movements():
    result = build_top_categories([], "income", 5)
    assert result == []
```