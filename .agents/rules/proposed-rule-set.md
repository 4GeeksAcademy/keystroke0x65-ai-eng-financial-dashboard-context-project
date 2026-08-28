# Proposed Rule Set — Financial Dashboard

> Derived from agent-research.md findings. These rules guide AI agents working on this project.
> Each rule is tagged with a priority: **MUST** (hard requirement), **SHOULD** (strong recommendation), **MAY** (optional preference).

---

## 1. Architecture & Infrastructure Rules

### 1.1 Container Orchestration

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R01 | **MUST** keep `docker-compose.yml` as the single source of truth for service topology (frontend + backend on internal Docker network). | MUST | Architecture |
| R02 | **MUST** preserve the volume mounts: `./frontend:/app` and `./backend:/app` for hot-reload. | MUST | Architecture |
| R03 | **MUST** keep the anonymous volume `- /app/node_modules` on the frontend service to mask local node_modules from the container. | MUST | Architecture |
| R04 | **SHOULD** add a `healthcheck` to the backend service so `depends_on` waits for service readiness, not just container start. | SHOULD | Architecture |
| R05 | **SHOULD** add a `.dockerignore` file to both frontend/ and backend/ to exclude tests, config files, and source from Docker images. | SHOULD | DX / Docker bloat |
| R06 | **MUST NOT** include `debugpy` on `--listen 0.0.0.0:5678` in the default `CMD` of `backend/Dockerfile` — this is an RCE vector outside of local dev. | MUST | Security |
| R07 | **SHOULD** restrict `CORSMiddleware(allow_origins=["*"])` to specific origins in production-aware configurations. | SHOULD | Security |

### 1.2 API & Data Layer

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R08 | **MUST** use Pydantic `BaseModel` subclasses for all API responses (`FinancialMovement`, `MetricsFacets`, etc.) — no raw dict returns. | MUST | Architecture |
| R09 | **MUST** use `generate_mock_movements(seed=42)` for deterministic mock data across all endpoints. | MUST | Architecture |
| R10 | **SHOULD** implement a caching layer (e.g., `functools.lru_cache` or `functools.cache`) for `generate_mock_movements` to avoid re-generating 360 movements on every request. | SHOULD | Architecture |
| R11 | **MUST** validate that `start_date <= end_date` in all endpoints that accept date range parameters. | MUST | Architecture |
| R12 | **SHOULD** extract `business_type` filtering into `filter_movements()` instead of manually filtering via list comprehension in each endpoint. | SHOULD | Security / Risk |
| R13 | **MAY** add auth middleware/dependency injection for any public endpoint that is later exposed beyond development. | MAY | Security |

---

## 2. Naming Conventions

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R14 | **MUST** use PascalCase for dashboard component files: `kpi-card.tsx`, `income-outcome-chart.tsx`, `dashboard-header.tsx`. | MUST | Naming |
| R15 | **MUST** use lowercase for reusable UI primitive files: `card.tsx`, `skeleton.tsx`. | MUST | Naming |
| R16 | **MUST** use verb-prefixed pure function names in Python routes: `filter_movements`, `summarize_movements`, `build_top_categories`, `calculate_net_value`, `detect_outcome_alerts`. | MUST | Naming |
| R17 | **MUST** use camelCase for frontend utility functions: `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent`. | MUST | Naming |
| R18 | **MUST** mirror backend types exactly in `frontend/src/lib/financial-types.ts` — keep `OperationType`, `Category`, `BusinessType`, `FinancialMovement`, etc. in sync. | MUST | Naming |

---

## 3. Code Style & Structure

### 3.1 Backend (Python)

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R19 | **MUST** keep business logic as module-level pure functions in `routes.py` — no classes for data operations. | MUST | Code Style |
| R20 | **MUST** keep `from __future__ import annotations` at the top of `routes.py` for PEP 604 forward references. | MUST | Code Style |
| R21 | **MUST** call `random.seed(42)` in every endpoint to ensure reproducible mock data generation. | MUST | Code Style |
| R22 | **MUST** guard against empty lists when accessing `ordered[0].create_date` in `build_metrics_facets`. | MUST | Risk |

### 3.2 Frontend (React / TypeScript)

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R23 | **MUST** use `@/` path alias for all imports (configured in `vite.config.ts` and `tsconfig.app.json`). | MUST | DX |
| R24 | **MUST** keep `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true` in `tsconfig.app.json`. | MUST | DX |
| R25 | **SHOULD** add `noUncheckedIndexedAccess: true` to `tsconfig.app.json`. | SHOULD | Risk |
| R26 | **MUST** use shadcn/ui New York style conventions (confirmed in `components.json`). | MUST | Code Style |
| R27 | **MUST** use `data-slot` attributes on UI primitive components (`card.tsx`, `skeleton.tsx`). | MUST | Code Style |
| R28 | **MUST** define light + `.dark` CSS custom properties in `index.css` (variables like `--background`, `--chart-income`, etc.) | MUST | Code Style |
| R29 | **MUST** use `@import "tailwindcss"` syntax (Tailwind v4), not `@tailwind` directives. | MUST | Code Style |
| R30 | **MUST** add `loading?: boolean` prop to every dashboard component and render `<Skeleton>` fallback when loading is true. | MUST | Code Style |
| R31 | **SHOULD** keep `formatCurrency()` and `formatPercent()` isolated in `financial-utils.ts`, not embedded in components. | SHOULD | Code Style |
| R32 | **SHOULD** use Recharts' built-in tooltip instead of inline `CustomTooltip` components unless custom behavior is required. | SHOULD | Code Style |
| R33 | **MUST** use Lucide icons for consistent iconography (as used in `kpi-row.tsx`, `dashboard-header.tsx`, `kpi-card.tsx`). | MUST | Code Style |
| R34 | **SHOULD** add retry logic and/or caching to the `useEffect` data fetching in `App.tsx` — no re-fetch on every re-mount. | SHOULD | Risk |
| R35 | **SHOULD** derive `period` from actual data range instead of hardcoding `"2024 - Full Year"` in `<DashboardHeader>`. | SHOULD | Risk |

---

## 4. Testing Rules

### 4.1 Backend Testing

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R36 | **MUST** use `TestClient(app)` for integration-style tests that hit real endpoints and assert JSON responses. | MUST | Testing |
| R37 | **MUST** add `backend/` to `sys.path` in `conftest.py` so `from app.main import app` resolves. | MUST | Testing |
| R38 | **MUST** rely on `seed=42` determinism for all backend tests. | MUST | Testing |
| R39 | **MUST** add a dedicated test for `/api/metrics/alerts` endpoint and `detect_outcome_alerts` function (currently missing). | MUST | Testing |

### 4.2 Frontend Testing

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R40 | **MUST** add React component render tests for all dashboard components: `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, `DashboardHeader`, `KPICard`. | MUST | Testing |
| R41 | **MUST** keep existing Vitest tests for `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent` in `financial-utils.test.ts`. | MUST | Testing |

---

## 5. Documentation & Agent Guidance

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R42 | **MUST** check `.agents/rules/` and `memory-bank/` before making any project changes. | MUST | Agent Guidance |
| R43 | **MUST** create `.agents/skills/` if planning to add skill files (directory is referenced in `AGENTS.md` but does not exist). | MUST | Agent Guidance |
| R44 | **MUST NOT** add unintended sections (e.g., "Data Flows", "JSON Samples") beyond what the user requests — avoid over-generation. | MUST | Memory Bank |
| R45 | **SHOULD** update `memory-bank/` documentation when making architectural changes. | SHOULD | Memory Bank |

---

## 6. Dependency & Configuration Rules

| # | Rule | Priority | Source |
|---|------|----------|--------|
| R46 | **MUST** keep `eslint.config.js` extending `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` recommended. | MUST | DX |
| R47 | **MUST** keep the Vite proxy configuration (`/api` → `http://backend:8000`) in `vite.config.ts`. | MUST | Architecture |
| R48 | **MUST** keep `VITE_API_BASE_URL` env var fallback in `App.tsx` for non-Docker setups. | MUST | Architecture |
| R49 | **MUST NOT** delete or repurpose `frontend/src/lib/mock-data.ts` without confirming it's unused by any component. | MUST | Architecture |

---

## Rule Summary by Priority

| Priority | Count | Meaning |
|----------|-------|---------|
| **MUST** | 36 | Breaking these rules will likely cause bugs, security issues, or inconsistencies. |
| **SHOULD** | 11 | Strongly recommended for quality, maintainability, or risk reduction. |
| **MAY** | 2 | Optional improvements — apply when relevant. |

**Total: 49 rules derived from agent-research.md findings.**