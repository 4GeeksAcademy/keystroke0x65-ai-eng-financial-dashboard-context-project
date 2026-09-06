# Feature 1 — Date Range Filter — Tests

## Backend Tests (to add to `backend/tests/test_routes.py`)

### Test: `GET /api/metrics/facets` returns correct date range
```python
def test_metrics_facets_returns_correct_date_range():
    """The facets endpoint must return min_date and max_date as valid ISO dates."""
    response = client.get("/api/metrics/facets")
    assert response.status_code == 200
    payload = response.json()
    assert "min_date" in payload
    assert "max_date" in payload
    # Verify they are valid date strings
    from datetime import date
    min_date = date.fromisoformat(payload["min_date"])
    max_date = date.fromisoformat(payload["max_date"])
    assert min_date <= max_date
```

### Test: `GET /api/metrics` with both date params returns filtered data
```python
def test_metrics_with_both_date_params_returns_filtered():
    """Passing start_date and end_date should return only movements in that range."""
    response = client.get(
        "/api/metrics",
        params={"start_date": "2024-06-01", "end_date": "2024-06-30"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload
    for item in payload:
        assert item["create_date"] >= "2024-06-01"
        assert item["create_date"] <= "2024-06-30"
```

### Test: `GET /api/metrics` without date params returns all data
```python
def test_metrics_without_date_params_returns_full_dataset():
    """Omitting date params should return the full 360 movements."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert len(response.json()) == 360
```

### Test: `GET /api/metrics` with only start_date returns data from that date onward
```python
def test_metrics_with_only_start_date_returns_from_date():
    """Only start_date should filter from that date inclusive."""
    response = client.get(
        "/api/metrics",
        params={"start_date": "2024-07-01"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload
    for item in payload:
        assert item["create_date"] >= "2024-07-01"
```

### Test: `GET /api/metrics` with only end_date returns data up to that date
```python
def test_metrics_with_only_end_date_returns_up_to_date():
    """Only end_date should filter up to that date inclusive."""
    response = client.get(
        "/api/metrics",
        params={"end_date": "2024-03-31"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload
    for item in payload:
        assert item["create_date"] <= "2024-03-31"
```

### Test: `GET /api/metrics` with inverted dates returns 422
```python
def test_metrics_inverted_dates_returns_422():
    """start_date > end_date must return HTTP 422."""
    response = client.get(
        "/api/metrics",
        params={"start_date": "2024-12-01", "end_date": "2024-01-01"},
    )
    assert response.status_code == 422
    assert "start_date" in response.text.lower() or "before" in response.text.lower()
```

### Test: `GET /api/metrics/facets` date range matches data
```python
def test_metrics_facets_min_max_match_actual_data():
    """The min_date and max_date from facets must equal the earliest and latest dates in the full dataset."""
    facets_resp = client.get("/api/metrics/facets")
    assert facets_resp.status_code == 200
    facets = facets_resp.json()

    metrics_resp = client.get("/api/metrics")
    assert metrics_resp.status_code == 200
    movements = metrics_resp.json()

    actual_min = min(m["create_date"] for m in movements)
    actual_max = max(m["create_date"] for m in movements)

    assert facets["min_date"] == actual_min
    assert facets["max_date"] == actual_max
```

---

## Frontend Component Tests (new file: `frontend/src/components/dashboard/date-range-filter.test.tsx`)

### Setup
```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangeFilter } from "./date-range-filter";
```

### Test: Renders inputs and available range label
```typescript
it("renders two date inputs and an available range label", () => {
  render(
    <DateRangeFilter
      availableMinDate="2024-01-01"
      availableMaxDate="2024-12-31"
      onApply={vi.fn()}
      dateError={null}
    />,
  );
  expect(screen.getByDisplayValue("")).toBeTruthy();  // empty date inputs
  expect(screen.getByText(/Available range/i)).toBeTruthy();
  expect(screen.getByText(/2024-01-01/)).toBeTruthy();
  expect(screen.getByText(/2024-12-31/)).toBeTruthy();
});
```

### Test: Apply button calls onApply with entered dates
```typescript
it("calls onApply with start and end dates when Apply is clicked", () => {
  const onApply = vi.fn();
  render(
    <DateRangeFilter
      availableMinDate="2024-01-01"
      availableMaxDate="2024-12-31"
      onApply={onApply}
      dateError={null}
    />,
  );
  const startInput = screen.getByLabelText(/start/i);
  const endInput = screen.getByLabelText(/end/i);
  fireEvent.change(startInput, { target: { value: "2024-06-01" } });
  fireEvent.change(endInput, { target: { value: "2024-06-30" } });
  fireEvent.click(screen.getByRole("button", { name: /apply/i }));
  expect(onApply).toHaveBeenCalledWith("2024-06-01", "2024-06-30");
});
```

### Test: Apply with empty values calls onApply with null
```typescript
it("calls onApply with null values when inputs are empty", () => {
  const onApply = vi.fn();
  render(
    <DateRangeFilter
      availableMinDate="2024-01-01"
      availableMaxDate="2024-12-31"
      onApply={onApply}
      dateError={null}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /apply/i }));
  expect(onApply).toHaveBeenCalledWith(null, null);
});
```

### Test: Shows error message when dateError is provided
```typescript
it("displays an error message when dateError is set", () => {
  render(
    <DateRangeFilter
      availableMinDate="2024-01-01"
      availableMaxDate="2024-12-31"
      onApply={vi.fn()}
      dateError="Start date must be before end date"
    />,
  );
  expect(screen.getByText(/Start date must be before end date/i)).toBeTruthy();
});
```

### Test: Shows loading state when no range data
```typescript
it("shows loading text when availableMinDate is null", () => {
  render(
    <DateRangeFilter
      availableMinDate={null}
      availableMaxDate={null}
      onApply={vi.fn()}
      dateError={null}
    />,
  );
  expect(screen.getByText(/loading available range/i)).toBeTruthy();
});
```

---

## Backend Unit Tests (new file: `backend/tests/test_date_range_filter.py`)

```python
"""Unit tests for date range filter logic."""
from datetime import date
import pytest
from fastapi import HTTPException
from app.routes import filter_movements_by_date, generate_mock_movements


def test_filter_by_date_with_none_returns_all():
    movements = generate_mock_movements(seed=42)
    result = filter_movements_by_date(movements, None, None)
    assert len(result) == len(movements)


def test_filter_by_date_start_only():
    movements = generate_mock_movements(seed=42)
    result = filter_movements_by_date(movements, date(2024, 7, 1), None)
    for m in result:
        assert m.create_date >= date(2024, 7, 1)


def test_filter_by_date_end_only():
    movements = generate_mock_movements(seed=42)
    result = filter_movements_by_date(movements, None, date(2024, 3, 31))
    for m in result:
        assert m.create_date <= date(2024, 3, 31)


def test_filter_by_date_inverted_raises_422():
    movements = generate_mock_movements(seed=42)
    with pytest.raises(HTTPException) as exc:
        filter_movements_by_date(movements, date(2024, 6, 1), date(2024, 5, 1))
    assert exc.value.status_code == 422
```