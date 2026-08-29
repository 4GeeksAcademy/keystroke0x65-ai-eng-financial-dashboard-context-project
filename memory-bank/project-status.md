# Project Status — Financial Dashboard

> Date: 2026-08-29

> Branch: `dev` (Phase 3 committed — `9379174`)

---

## What Works

### Core Functionality
- **Backend API** is fully operational with **9 endpoints**: `/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`.
- **Frontend Dashboard** renders 4 KPI cards (Income, Outcome, Profit, Profit Margin), an income-vs-outcome line chart, and a profit-percentage line chart, all with loading skeletons via `shadcn/ui`.
- **Docker Compose** properly orchestrates both services with volume mounts for hot-reload and internal networking.
- **Backend date validation** rejects inverted date ranges (`start_date > end_date`) with HTTP 422.
- **Period derivation** on frontend is now data-driven (not hardcoded) — `derivePeriod()` in `App.tsx` infers the year range from actual movements.

### Testing
- **Backend**: 18 integration-style tests in `backend/tests/test_routes.py` covering all endpoints, date filtering, category/operation/business_type filters, alerts with multiple threshold scenarios, and date-range validation.
- **Frontend utilities**: 4 tests in `frontend/src/lib/financial-utils.test.ts` for `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent`.
- All backend tests rely on `seed=42` for deterministic mock data.

### Documentation & Agent Infrastructure
- **Memory bank**: `project-summary.md`, `project-structure.md`, `verification.md`, and now `project-status.md`.
- **Agent guidance**: `AGENTS.md` directs agents to check `.agents/rules/`, `.agents/skills/`, and `memory-bank/` before acting.
- **Rule files**: 6 categorized rule files created in `.agents/rules/` (`api-rules.md`, `container-rules.md`, `frontend-rules.md`, `naming-rules.md`, `project-rules.md`, `testing-rules.md`).
- **Skills directory**: `.agents/skills/README.md` exists for reusable agent procedures.

### Improvements Applied (Phase 3)
- `.dockerignore` for both backend and frontend (reduces Docker image bloat).
- `@functools.lru_cache` on `generate_mock_movements()` to avoid full regeneration per request.
- `build_metrics_facets` now guards against empty input (HTTP 404).
- 4 dedicated tests for `/api/metrics/alerts` (high threshold → empty, zero threshold → detects change, business_type filter).
- Date validation test for inverted ranges (R11).
- Derived period from data range instead of hardcoded string.
- Extracted business_type endpoints (`/api/metrics/b2b`, `/api/metrics/b2c`).

---

## Known Gaps & Issues

### Security (Critical)
| Severity | Issue | File |
|----------|-------|------|
| 🔴 CRITICAL | `debugpy` listens on `0.0.0.0:5678` in default `CMD` — remote code execution vector if exposed beyond local dev | `backend/Dockerfile` |
| 🔴 CRITICAL | `CORSMiddleware(allow_origins=["*"])` — accepts requests from any origin | `backend/app/main.py` |
| 🟠 HIGH | No auth middleware or dependency injection — all endpoints are public | `backend/app/routes.py` |

### Code Quality & Maintainability
- `filter_movements()` does **not** accept `business_type` as a parameter, so business type filtering is done via ad-hoc list comprehensions in **5+ endpoints** (`get_metrics_summary`, `get_top_categories`, `get_metrics_comparison`, `get_metrics_alerts`, `get_b2b_metrics`, `get_b2c_metrics`). This is a maintenance risk.
- `frontend/src/lib/mock-data.ts` contains 48 hardcoded movements but is **not used** by `App.tsx` (which fetches from the API). Dead code.
- No caching or retry logic on the frontend — `App.tsx` fetches data once in `useEffect` and shows a static error on failure with no retry mechanism.

### Testing Gaps
- **Zero React component/render tests** for any dashboard component: `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, `DashboardHeader`, `KPICard`. Only utility functions are tested.
- Frontend tests are limited to `financial-utils.test.ts` — no integration tests or component-level tests.

### Docker & Deployment
- `docker-compose.yml` has no `healthcheck` — `depends_on: backend` only waits for container start, not service readiness.
- Both `Dockerfile`s use `COPY . .` (though `.dockerignore` files have been added to mitigate this).

### Frontend
- Error state is shown to the user but offers no retry action.
- No pagination or data refresh mechanism — static snapshot on mount.

---

## Next Priorities

1. **~~🔴 Commit uncommitted Phase 3 work — 14 files are staged/modified on `dev` but not committed.~~ ✅ Done** (`9379174`)
2. **🔴 Fix debugpy security** — Make debugpy conditional or use a separate `CMD` for production.
3. **🟢 Add React component tests** — At minimum render/snapshot tests for `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, `DashboardHeader`.
4. **🟢 Refactor `filter_movements()`** to accept `business_type` — eliminate the repeated list comprehensions across 5+ endpoints.
5. **🟡 Add healthcheck** to `docker-compose.yml` so `depends_on` actually waits for readiness.
6. **🟡 Remove dead code** — `frontend/src/lib/mock-data.ts` is unused.
7. **🟡 Add retry/caching** to frontend data fetching for resilience.
8. **🟡 Add auth middleware** for non-development environments.

---

## Incorrect Steps & Decisions Taken

| Step / Decision | Why It Was Wrong | Fixed? |
|-----------------|------------------|--------|
| `debugpy` on `0.0.0.0:5678` in default production `CMD` | Exposes a remote debugger with arbitrary code execution to any network peer. Should be behind a conditional flag or separate CMD. | ❌ Still present |
| `CORS(allow_origins=["*"])` | Safe for development, but a production deployment would accept cross-origin requests from any site. Should be env-configurable. | ❌ Still present |
| Hardcoded period `"2024 - Full Year"` in `<DashboardHeader>` | Lied about the data range if movements didn't cover a full year. | ✅ Fixed — now derived via `derivePeriod()` |
| `build_metrics_facets` with no empty-list guard | Would crash with `IndexError` on `ordered[0]` if no movements existed. | ✅ Fixed — raises HTTP 404 |
| No date validation (`start_date > end_date`) | Would silently return empty results instead of informing the caller. | ✅ Fixed — returns 422 |
| AI generated unintended sections in memory-bank docs | "Data Flows" in project-summary.md and "JSON Samples" in project-structure.md exceeded the stated constraints. Manually corrected. | ✅ Corrected in verification trail |
| 49 proposed rules from Phase 2 → Phase 3 | Too many overly-specific rules for a small project. Distilled to 6 focused rule files. | ✅ Distilled |

---

## Commit History Summary

| Phase | Key Commits | Description |
|-------|-------------|-------------|
| Initial setup | `bb0a9c1` → `15ce4c2` | Project scaffolding, `backend/app/routes.py`, `.gitignore` |
| Frontend foundation | `7661fa1`, `29ebca4` | V0-generated React components, backend + frontend tests |
| Endpoint expansion | `c061621` → `0c07552` | Filters, facets, summary, top categories, comparison, alerts |
| Docs & research | `291f2db` → `fdb8f0f` | AGENTS.md, README updates, agent-research.md, project rules |
| Phase 3 | `9379174` (HEAD, dev) | `.dockerignore`, `lru_cache`, date validation, derived period, alert tests, 6 rule files |