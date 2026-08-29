# API & Data Layer Rules

> Validated: 2026-08-28
> Source: agent-research.md (R08–R13, R22)

---

### R08 — Pydantic responses only, no raw dicts

**Rule**: MUST use Pydantic `BaseModel` subclasses for all API responses (`FinancialMovement`, `MetricsFacets`, `MetricsSummaryItem`, `TopCategoryItem`, `MetricsComparison`, `MetricsAlert`) — no raw `dict` returns from endpoints.

**Why**: Raw dicts skip FastAPI's response model validation and auto-documentation (OpenAPI/Swagger). If an endpoint returns a dict, its schema won't appear in `/docs` and consumers can't rely on typed responses.

**Actionable check**: Every `@router.get(...)` should have `response_model=SomePydanticModel`. If you see a bare `-> dict[str, str]` return type like the `/health` endpoint, that's acceptable only for trivial status responses. All data endpoints MUST use a `BaseModel`.

**Validation**: ✅ All 8 data endpoints in `routes.py` use `response_model=` with `BaseModel` subclasses. The only exception is `/health` returning `dict[str, str]`, which is acceptable for a health check.

```python
# DO:
@router.get("/api/metrics", response_model=list[FinancialMovement])

# DON'T:
@router.get("/api/metrics")
def get_metrics() -> list[dict]:  # No schema in Swagger
```

---

### R09 — Deterministic seed for mock data

**Rule**: MUST use `generate_mock_movements(seed=42)` for deterministic mock data across all endpoints.

**Why**: Every endpoint calls `random.seed(42)` internally to produce reproducible movements. This is essential for tests — assertions rely on known data shapes. Changing the seed or calling without it will make tests flaky.

**Actionable check**: Each endpoint function must call `generate_mock_movements(seed=42)` at the top (not `seed=None`, not `seed=random.randint(...)`).

**Validation**: ✅ All 8 endpoints in `routes.py` call `generate_mock_movements(seed=42)` on every request.

---

### R10 — Cache mock data generation

**Rule**: SHOULD implement a caching layer (e.g., `functools.lru_cache` or `functools.cache`) for `generate_mock_movements` to avoid re-generating 360 movements on every request.

**Why**: Every API call regenerates all 360 movements from scratch — this is wasteful for endpoints that just filter or aggregate the same data. Caching per-seed (e.g., `@functools.lru_cache(maxsize=1)`) eliminates redundant computation.

**Actionable check**: Wrap `generate_mock_movements` with `@functools.lru_cache(maxsize=1)` so the result of `seed=42` is memoized after the first call:

```python
import functools

@functools.lru_cache(maxsize=1)
def generate_mock_movements(seed: int | None = None) -> list[FinancialMovement]:
```

**Note**: This works because `list[FinancialMovement]` is hashable when using Pydantic. If serialization issues arise, use a simple module-level cache dict.

**Validation**: ✅ (Task performed) The `generate_mock_movements` function was cached with `@functools.lru_cache(maxsize=1)`.

---

### R11 — Validate date ranges

**Rule**: MUST validate that `start_date <= end_date` in all endpoints that accept date range parameters.

**Why**: Currently, passing `start_date=2024-06-01&end_date=2024-01-01` returns 0 results silently instead of an error. A clear 422 response tells the caller their request is invalid.

**Actionable check**: Add validation at the top of `filter_movements_by_date`:

```python
if start_date is not None and end_date is not None and start_date > end_date:
    raise HTTPException(
        status_code=422,
        detail=f"start_date ({start_date}) must be before or equal to end_date ({end_date})",
    )
```

**Validation**: ✅ (Task performed) Added date validation to `filter_movements_by_date()` in `routes.py`. Test added verifying both function-level 422 raise and API-level 422 response for inverted dates.

```python
# Test validates:
def test_filter_movements_rejects_invalid_date_range():
    with pytest.raises(HTTPException) as exc_info:
        filter_movements_by_date(movements, start, end)
    assert exc_info.value.status_code == 422

def test_filter_movements_by_date_api_rejects_inverted_dates():
    response = client.get("/api/metrics", params={"start_date": "2024-06-01", "end_date": "2024-01-01"})
    assert response.status_code == 422
```

---

### R12 — Extract business_type into filter_movements

**Rule**: SHOULD extract `business_type` filtering into `filter_movements()` instead of manually filtering via list comprehension in 6+ endpoints.

**Why**: Currently, every endpoint that supports `business_type` filtering does it with ad-hoc list comprehensions before calling `filter_movements()`:

```python
# Current pattern (repeated in 6 endpoints):
if business_type is not None:
    movements = [item for item in movements if item.business_type == business_type]
```

This is a maintenance risk — adding `business_type` support to a new endpoint requires remembering this pattern. Instead, add `business_type` as a parameter to `filter_movements()`.

**Actionable check**: Refactor `filter_movements()` to accept `business_type`:

```python
def filter_movements(
    movements: list[FinancialMovement],
    start_date: date | None,
    end_date: date | None,
    category: Category | None,
    operation_type: OperationType | None,
    business_type: BusinessType | None = None,
) -> list[FinancialMovement]:
    filtered = filter_movements_by_date(movements, start_date, end_date)
    # ... existing filters ...
    if business_type is not None:
        filtered = [m for m in filtered if m.business_type == business_type]
    return filtered
```

**Validation**: ✅ Identified 6 endpoints that manually filter by `business_type`: `get_metrics_summary`, `get_top_categories`, `get_metrics_comparison`, `get_metrics_alerts`, `get_b2b_metrics`, `get_b2c_metrics`. This is flagged for a future refactor.

---

### R13 — Auth middleware for non-dev exposure

**Rule**: MAY add auth middleware or dependency injection for any public endpoint that is later exposed beyond development.

**Why**: All endpoints are currently public with no auth. If the API is ever deployed (even to a staging environment), it should be behind at minimum an API key or bearer token.

**Actionable check**: When deploying, add a FastAPI dependency:

```python
from fastapi import Depends, HTTPException, Header

async def verify_token(x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_KEY"):
        raise HTTPException(status_code=403)

# Then per-router:
router = APIRouter(dependencies=[Depends(verify_token)])
```

**Validation**: ✅ No auth exists yet — tagged as future improvement (MAY).

---

### R22 — Guard against empty list in build_metrics_facets

**Rule**: MUST guard against empty lists when accessing `ordered[0].create_date` in `build_metrics_facets`.

**Why**: `ordered[0]` will raise `IndexError` if the movements list is empty. Since external endpoints can pass filters that produce empty results, this guard prevents a 500 error.

**Actionable check**: Add an early return or HTTPException when `ordered` is empty:

```python
def build_metrics_facets(movements: list[FinancialMovement]) -> MetricsFacets:
    ordered = ensure_chronological_order(movements)
    if not ordered:
        raise HTTPException(
            status_code=404,
            detail="No movements available to build facets",
        )
```

**Validation**: ✅ (Task performed) Added empty-list guard to `build_metrics_facets()`. If the movements list is empty, a 404 is raised instead of `IndexError`.