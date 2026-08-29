# Testing Rules

> Validated: 2026-08-28
> Source: agent-research.md (R36–R41)

---

### R36 — Integration-style backend tests with TestClient

**Rule**: MUST use `TestClient(app)` for integration-style tests that hit real endpoints and assert JSON responses.

**Why**: Unit-testing individual pure functions (like `filter_movements`) misses middleware, route parameter parsing, HTTP error handling, and response serialization. `TestClient` runs the full FastAPI stack, catching issues that pure-function tests won't.

**Actionable check**: Every endpoint should have at least one `TestClient` test that validates:
1. HTTP status code (200, 422, 404, etc.)
2. JSON response shape (keys match expected Pydantic model)
3. At least one data assertion (length, values, sorted order)

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_some_endpoint():
    response = client.get("/api/some/endpoint", params={"key": "value"})
    assert response.status_code == 200
    payload = response.json()
    assert "expected_field" in payload[0]
```

**Validation**: ✅ All backend tests use `TestClient(app)`. Tests hit real endpoints and assert JSON responses:
- `test_health_endpoint_returns_ok()`
- `test_metrics_endpoint_respects_date_filters()`
- `test_metrics_endpoint_filters_by_category()`
- 16 total endpoint tests

---

### R37 — Add backend/ to sys.path in conftest.py

**Rule**: MUST add `backend/` to `sys.path` in `conftest.py` so `from app.main import app` resolves.

**Why**: The test files are in `backend/tests/` and need to import from `backend/app/`. The `conftest.py` adds the parent directory (`backend/`) to `sys.path`, making `app.main` resolvable regardless of where `pytest` is invoked from.

**Actionable check**: The `conftest.py` must exist at `backend/tests/conftest.py` with this content:

```python
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
```

If moving tests or adding a new test module, ensure this path setup is maintained.

**Validation**: ✅ `backend/tests/conftest.py` adds `backend/` to `sys.path` using `Path(__file__).resolve().parents[1]`.

---

### R38 — Deterministic seed for all backend tests

**Rule**: MUST rely on `seed=42` determinism for all backend tests.

**Why**: `generate_mock_movements(seed=42)` always produces the exact same 360 movements. Tests that call this function (directly or via API) can assert exact counts, sorted orders, and relationships. Changing the seed or not passing it makes tests non-deterministic.

**Actionable check**: Never use `seed=None` or omit `seed=42` in test setups. If a test needs different data, use a different fixed seed (e.g., `seed=99`) rather than random.

**Validation**: ✅ Every endpoint test implicitly uses `seed=42` via the API endpoints. Direct function tests also pass `seed=42`:
```python
movements = generate_mock_movements(seed=42)
assert len(movements) == 360  # Always passes
```

---

### R39 — Dedicated test for /api/metrics/alerts

**Rule**: MUST add a dedicated test for `/api/metrics/alerts` endpoint and `detect_outcome_alerts` function.

**Why**: The alerts endpoint was the only endpoint without any test coverage. It's also the most logic-heavy endpoint, making it the most likely to have edge-case bugs.

**Actionable check**: Test at minimum:
1. Normal threshold returns expected shape
2. High threshold (e.g., 10.0) returns empty list (no anomalies)
3. Zero threshold detects any increase
4. Business_type filter works

**Validation**: ✅ (Task performed) Added 4 tests for `/api/metrics/alerts`:

```python
def test_metrics_alerts_returns_anomaly_candidates():
    """Basic shape + keys test."""

def test_metrics_alerts_high_threshold_returns_no_alerts():
    """threshold=10.0 → empty list"""

def test_metrics_alerts_zero_threshold_detects_change():
    """threshold=0.0 → all positives detected"""

def test_metrics_alerts_filters_by_business_type():
    """business_type filter respected"""
```

All 4 pass.

---

### R40 — React component render tests for dashboard

**Rule**: MUST add React component render tests for all dashboard components: `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, `DashboardHeader`, `KPICard`.

**Why**: Currently only `financial-utils.test.ts` exists (unit tests for pure functions). Zero tests exist for React components. Even a basic render test (component mounts without crashing, loading state renders correctly, empty state displays message) catches common bugs.

**Actionable check**: Use Vitest + React Testing Library:

```tsx
import { render, screen } from '@testing-library/react'
import { KPIRow } from './kpi-row'

describe('KPIRow', () => {
  it('renders loading skeletons when loading', () => {
    render(<KPIRow metrics={null} loading={true} />)
    // Should show skeleton placeholders, not values
    expect(screen.getByText('Total Income')).toBeInTheDocument()
  })

  it('renders metric values when loaded', () => {
    const metrics = { totalIncome: 100000, totalOutcome: 50000, profit: 50000, profitPercent: 50 }
    render(<KPIRow metrics={metrics} loading={false} />)
    expect(screen.getByText('$100,000')).toBeInTheDocument()
  })
})
```

**Validation**: ❌ No component render tests exist yet. This is a gap that needs filling. Each dashboard component needs at minimum:
- Loading state test
- Data state test
- Empty/null data test

---

### R41 — Maintain existing Vitest tests

**Rule**: MUST keep existing Vitest tests for `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent` in `financial-utils.test.ts`.

**Why**: These tests validate the core data-transformation logic shared by all components. If the formatting or computation logic changes, these tests catch regressions.

**Actionable check**: Never delete or disable these tests. When adding a new utility function, add its tests alongside in the same file.

**Validation**: ✅ `frontend/src/lib/financial-utils.test.ts` contains tests for:
- `computeKPIs` (2 tests: normal income/profit, zero income edge case)
- `computeMonthlyData` (grouping correctness)
- `formatCurrency`
- `formatPercent`