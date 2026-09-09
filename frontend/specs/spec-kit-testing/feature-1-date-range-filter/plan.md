# Implementation Plan: Date Range Filter on Home Dashboard

**Branch**: `feature-1-date-range-filter` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `feature-1-date-range-filter/spec.md`

## Summary

Add two date inputs (start date, end date) to the top of the home dashboard to filter all displayed data by date range. The implementation requires:
- A new `DateRangeFilter` UI component with two `<input type="date">` fields, an "Apply" button, an available-range reference label, and an inline error area.
- Frontend state management distinguishing raw input values (updated on keystroke) from applied values (updated on Apply click).
- Fetch `GET /api/metrics/facets` once on mount for `min_date`/`max_date` reference.
- Reuse existing `GET /api/metrics` with optional `start_date`/`end_date` query params, processing the response through the existing `computeKPIs()` and `computeMonthlyData()` functions.
- No backend changes required — API already supports date filtering.

## Technical Context

**Language/Version**: TypeScript 6.0, React 19.2, Vite 8, Python 3.11+, FastAPI

**Primary Dependencies**:
- Frontend: React, Recharts (charts), Lucide React (icons), Tailwind CSS 4, class-variance-authority
- Backend: FastAPI, Pydantic, Uvicorn (no changes needed for this feature)

**Storage**: N/A — mock data generated in-memory via `generate_mock_movements(seed=42)`

**Testing**: Vitest 4 (frontend unit/integration), pytest + httpx (backend)

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (React SPA frontend + FastAPI REST backend)

**Performance Goals**: N/A — feature operates on already-loaded data; single API call per Apply click with client-side aggregation. Target: <3s for filter response + re-render.

**Constraints**:
- Must use native `<input type="date">` — no third-party date-picker libraries
- No server-side aggregation; all filtering is client-side via existing `computeKPIs()` and `computeMonthlyData()`
- Filter state must NOT persist across page reloads
- Date values sent in `YYYY-MM-DD` format matching `<input type="date">` native output
- Empty date inputs → omit corresponding query parameter(s) from API call
- Applied state must propagate to Feature 2 (anomaly alerts) — same `start_date`/`end_date` values

**Scale/Scope**: Single-dashboard page; ~360 mock movements across 12 months. Feature scoped to frontend only; the backend `GET /api/metrics` endpoint already accepts `start_date`/`end_date` params.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Result: PASS — No gates to enforce.**

The constitution file (`.specify/memory/constitution.md`) is a template with placeholder content (`[PRINCIPLE_1_NAME]`, `[SECTION_2_NAME]`, etc.) and contains no actual principles, constraints, or governance rules. All principle descriptions are template comments (`<!-- Example: ... -->`) with no enforceable requirements. There are no gates, quality checks, or constraints defined that could be violated.

**No complexity justification is needed** (Complexity Tracking section below is omitted as there are no violations).

## Project Structure

### Documentation (this feature)

```text
feature-1-date-range-filter/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)
backend/
├── Dockerfile
├── requirements.txt
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── routes.py          # Existing API routes (NO changes for this feature)
└── tests/
    ├── conftest.py
    └── test_routes.py

frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── App.tsx               # Main dashboard — add DateRangeFilter integration
│   ├── main.tsx
│   ├── index.css
│   ├── lib/
│   │   ├── financial-types.ts    # Add MetricsFacets interface
│   │   ├── financial-utils.ts    # Existing computeKPIs/computeMonthlyData (unchanged)
│   │   ├── financial-utils.test.ts
│   │   ├── mock-data.ts
│   │   └── utils.ts
│   └── components/
│       ├── dashboard/
│       │   ├── dashboard-header.tsx
│       │   ├── kpi-card.tsx
│       │   ├── kpi-row.tsx
│       │   ├── income-outcome-chart.tsx
│       │   ├── profit-percent-chart.tsx
│       │   └── date-range-filter.tsx     # NEW component
│       └── ui/
│           ├── card.tsx
│           └── skeleton.tsx
```

**Structure Decision**: The project follows Option 2 (Web application) structure with `backend/` and `frontend/` as the two main projects. This feature is scoped entirely within `frontend/src/` — adding one new component `date-range-filter.tsx` under `components/dashboard/` and modifying `App.tsx` for state management and API integration. The `financial-types.ts` gets a new `MetricsFacets` interface.

## Phase 0: Research

**Prerequisites**: Technical context established (above). No NEEDS CLARIFICATION items exist — all technical details are fully resolved from the feature spec and existing codebase analysis.

**Research output**: See [research.md](./research.md) — documents confirmed technical approach, API contract verification, and UI interaction patterns.

## Phase 1: Design & Contracts

**Prerequisites**: Research complete. Phase 1 artifacts:

- [data-model.md](./data-model.md) — Entity definitions: `DateRangeFilter` component contract, `MetricsFacets` data entity, `AppliedFilter` state entity
- [contracts/](./contracts/) — Interface contracts: `DateRangeFilterProps`, API response types, state management interface
- [quickstart.md](./quickstart.md) — Validation scenarios: manual testing steps, unit test guidance, integration test scenarios

## Post-Execution Hooks

**Extension hooks check**: No `.specify/extensions.yml` found — skipping post-execution hooks.

## Completion Report

| Artifact | Path |
|----------|------|
| Plan | `feature-1-date-range-filter/plan.md` |
| Research | `feature-1-date-range-filter/research.md` |
| Data Model | `feature-1-date-range-filter/data-model.md` |
| Contracts | `feature-1-date-range-filter/contracts/` |
| Quickstart | `feature-1-date-range-filter/quickstart.md` |

**Branch**: `feature-1-date-range-filter`
