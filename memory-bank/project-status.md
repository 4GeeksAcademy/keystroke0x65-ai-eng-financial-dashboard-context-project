# Project Status — Financial Dashboard

> Date: 2026-09-09

> Branch: `feature/agent-skills` (latest commit `edab7fd`)

> All 37 frontend tests passing across 6 test files.

---

## What Works

### Core Functionality
- **Backend API** is fully operational with **9 endpoints**: `/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`.
- **Frontend Dashboard** renders 4 KPI cards (Income, Outcome, Profit, Profit Margin), an income-vs-outcome line chart, and a profit-percentage line chart, all with loading skeletons via `shadcn/ui`.
- **Docker Compose** properly orchestrates both services with volume mounts for hot-reload and internal networking.
- **Backend date validation** rejects inverted date ranges (`start_date > end_date`) with HTTP 422.
- **Period derivation** on frontend is now data-driven (not hardcoded) — `derivePeriod()` in `App.tsx` infers the year range from actual movements.

### Testing
- **Backend**: 18 integration-style tests in `backend/tests/test_routes.py` covering all endpoints, date filtering, category/operation/business_type filters, alerts with multiple threshold scenarios, and date-range validation. All rely on `seed=42` for deterministic mock data.
- **Frontend utilities**: 4 tests in `frontend/src/lib/financial-utils.test.ts` for `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent`.
- **Frontend component tests (NEW)**: **33 tests** across **5 component test files** — all passing. Covers `DashboardHeader`, `KPICard`, `KPIRow`, `IncomeOutcomeChart`, and `ProfitPercentChart`:
  - Render verification, props-driven output, loading skeleton states, empty-data edge cases, screen-reader accessible tables, and variant styling.
- **Total frontend**: **37 tests** across **6 test files** — all passing.
- **Test infrastructure**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `jsdom` added to dev dependencies. Vitest configured with `jsdom` environment, global APIs, and setup file via `vite.config.ts`.

### Documentation & Agent Infrastructure
- **Memory bank**: `project-summary.md`, `project-structure.md`, `project-status.md`, `verification.md`, `project-accessibility-audit.md` (Phase 2), `project-react-best-practices.md` (Phase 3).
- **Agent guidance**: `AGENTS.md` directs agents to check `.agents/rules/`, `.agents/skills/`, and `memory-bank/` before acting.
- **Rule files**: 6 categorized rule files in `.agents/rules/` (`api-rules.md`, `container-rules.md`, `frontend-rules.md`, `naming-rules.md`, `project-rules.md`, `testing-rules.md`).
- **Skills directory**: `.agents/skills/README.md` exists for reusable agent procedures.
- **Skills loaded** (4): `accessibility`, `find-skills`, `react-testing`, `vercel-react-best-practices`.

### Skill-Applied Improvements

#### Accessibility (Phase 2 — skill: `addyosmani/web-quality-skills`)
- Added `lang="en"` to `<html>` element, viewport meta tag for zoom support, theme-color meta tag.
- Added `sr-only` CSS utility class for screen-reader-only content.
- Added `role="img"` and `aria-label` to chart container elements for screen reader identification.
- Added `aria-hidden="true"` to decorative icons in `DashboardHeader` and `KPICard`.
- Added screen-reader accessible data tables (`role="table"`, `aria-label`) inside chart components (`IncomeOutcomeChart`, `ProfitPercentChart`) so screen readers can read tabular data alongside the visual chart.
- Applied `prefers-reduced-motion` media query to disable animations for vestibular motion disorders.
- Audit documented in `memory-bank/project-accessibility-audit.md`.

#### React Best Practices (Phase 3 — skill: `vercel-labs/agent-skills`)
- Extracted inline data-fetching logic from `App.tsx` into a custom `useFinancialMetrics()` hook — separates concerns, improves testability, and follows the Rules of Hooks.
- Memoized `monthlyData` and `metrics` computations with `useMemo` to avoid recalculations on every render.
- Replaced inline `derivePeriod()` with `useMemo`-based derivation inside the custom hook.
- Extracted `derivePeriod()` standalone utility for independent testing.
- Added `displayName` to components (`DashboardHeader`, `KPIRow`) for better debugging in React DevTools.
- Best practices audit documented in `memory-bank/project-react-best-practices.md`.

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
- ~~**Zero React component/render tests** for any dashboard component~~ ✅ **Resolved** — 33 component tests now exist covering all 5 dashboard components.
- ~~Frontend tests are limited to `financial-utils.test.ts`~~ ✅ **Resolved** — 6 test files now exist (5 component + 1 utility).
- No integration tests between frontend and backend — component tests use hardcoded props, not API data.
- Backend tests still lack property-based or fuzz testing.

### Docker & Deployment
- `docker-compose.yml` has no `healthcheck` — `depends_on: backend` only waits for container start, not service readiness.
- Both `Dockerfile`s use `COPY . .` (though `.dockerignore` files have been added to mitigate this).

### Frontend
- Error state is shown to the user but offers no retry action.
- No pagination or data refresh mechanism — static snapshot on mount.

---

## Next Priorities

1. **~~🔴 Commit uncommitted Phase 3 work — 14 files were staged/modified on `dev`.~~ ✅ Done** (`9379174`)
2. **~~🟢 Add React component tests — Minimum render/snapshot tests for dashboard components.~~ ✅ Done** — 33 tests across 5 files on `feature/agent-skills` branch.
3. **🔴 Fix debugpy security** — Make debugpy conditional or use a separate `CMD` for production.
4. **🟢 Refactor `filter_movements()`** to accept `business_type` — eliminate the repeated list comprehensions across 5+ endpoints.
5. **🟡 Add healthcheck** to `docker-compose.yml` so `depends_on` actually waits for readiness.
6. **🟡 Remove dead code** — `frontend/src/lib/mock-data.ts` is unused.
7. **🟡 Add retry/caching** to frontend data fetching for resilience.
8. **🟡 Add auth middleware** for non-development environments.
9. **🟢 Commit outstanding `feature/agent-skills` changes** — `skills-lock.json`, `skills-recommendations.md`, 5 test files, `package.json`, `vite.config.ts`, `memory-bank/` updates are uncommitted.

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
| No component tests — only utility tests existed | Dashboard components could regress silently with no render verification. | ✅ Fixed — 33 component tests added |

---

## Commit History Summary

| Phase | Key Commits | Branch | Description |
|-------|-------------|--------|-------------|
| Initial setup | `bb0a9c1` → `15ce4c2` | `main` | Project scaffolding, `backend/app/routes.py`, `.gitignore` |
| Frontend foundation | `7661fa1`, `29ebca4` | `main` | V0-generated React components, backend + frontend tests |
| Endpoint expansion | `c061621` → `0c07552` | `main` | Filters, facets, summary, top categories, comparison, alerts |
| Docs & research | `291f2db` → `fdb8f0f` | `main` | AGENTS.md, README updates, agent-research.md, project rules |
| Phase 3 (old) | `9379174` | `dev` | `.dockerignore`, `lru_cache`, date validation, derived period, alert tests, 6 rule files |
| Frontend Specs | `46fb60b` → `3658c50` | `feature/frontend-specs` | API exploration, TypeScript types, component specs, data contract specs |
| Skills Phase 1 | `5c30cf2` | `feature/agent-skills` | Discovered and loaded skills (`accessibility`, `find-skills`, spec-kit skills); added spec-kit testing infrastructure |
| Skills Phase 2 | `557f016` | `feature/agent-skills` | Applied `addyosmani/web-quality-skills` (accessibility) — `lang`, `aria-*`, `sr-only`, screen-reader tables, reduced-motion; documented in `project-accessibility-audit.md` |
| Skills Phase 3 | `edab7fd` | `feature/agent-skills` | Applied `vercel-labs/agent-skills` (react-best-practices) — custom hook extraction, `useMemo`, `displayName`; documented in `project-react-best-practices.md` |
| Skills Phase (uncommitted) | — | `feature/agent-skills` (dirty) | Added `react-testing` skill from `affaan-m/ecc`; installed RTL + jsdom; wrote 33 component tests across 5 files; created `skills-recommendations.md` |