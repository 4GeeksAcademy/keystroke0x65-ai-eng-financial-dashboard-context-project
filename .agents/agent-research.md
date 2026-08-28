# Agent Research — Financial Dashboard

> Concrete findings tied to specific files, folders, or behaviors — for developing project rules.

---

## Architecture

### Service topology & container orchestration
- **`docker-compose.yml`** defines two services (`frontend`, `backend`) on an internal Docker network, each with its own `Dockerfile`.
- **`docker-compose.yml`** mounts `./frontend:/app` and `./backend:/app` as volumes for hot-reload. Frontend has anonymous volume `- /app/node_modules` to mask local deps.
- **`docker-compose.yml`** has no `healthcheck` — `depends_on: backend` only waits for container start, not service readiness.
- **`vite.config.ts`** proxies `/api` requests to `http://backend:8000` (Vite proxy config).
- A fallback `VITE_API_BASE_URL` env var exists in `App.tsx` for non-Docker setups.

### Data layer
- **`backend/app/routes.py`** — no database/ORM. `generate_mock_movements(seed=42)` generates 360 in-memory mock movements deterministically.
- `generate_mock_movements(seed=42)` is called on **every request** (8+ endpoints × 360 objects re-created each time). No caching.
- **`frontend/src/lib/mock-data.ts`** exists with 48 hardcoded movements but `App.tsx` fetches from the API — appears unused.

### API endpoints (all in `backend/app/routes.py`)
- All responses use Pydantic `BaseModel` subclasses: `FinancialMovement`, `MetricsFacets`, `MetricsSummaryItem`, `TopCategoryItem`, `MetricsComparison`, `MetricsAlert`. No raw dict returns.
- No auth middleware or dependency injection — all endpoints public.
- No date validation — endpoints accept `start_date`/`end_date` without checking `start_date <= end_date`.

---

## Naming

### Type aliases & literals
- **`backend/app/routes.py`** uses `Literal` types for constrained values: `OperationType = Literal["income", "outcome"]`, `Category`, `BusinessType`, `GroupBy`.
- **`frontend/src/lib/financial-types.ts`** mirrors the backend types exactly: `OperationType`, `Category`, `BusinessType`, `FinancialMovement`, `KPIMetrics`, `MonthlyDataPoint`. All `type`/`interface` exports.

### File & folder naming
- **`components/dashboard/`** vs **`components/ui/`** — domain-specific vs reusable primitives, named by purpose.
- Dashboard components use PascalCase files: `kpi-card.tsx`, `income-outcome-chart.tsx`, `dashboard-header.tsx`.
- UI primitives use lowercase: `card.tsx`, `skeleton.tsx`.

### Function naming
- **`backend/app/routes.py`** — verb-prefixed pure functions: `filter_movements`, `summarize_movements`, `build_top_categories`, `calculate_net_value`, `detect_outcome_alerts`.
- **`frontend/src/lib/financial-utils.ts`** — camelCase: `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent`.

---

## Testing

### Backend
- **`backend/tests/test_routes.py`** uses `TestClient(app)` — integration-style tests that hit real endpoints and assert JSON responses.
- **`backend/tests/conftest.py`** adds `backend/` to `sys.path` so `from app.main import app` resolves.
- All backend tests rely on `seed=42` determinism.
- `/api/metrics/alerts` endpoint and `detect_outcome_alerts` function have no dedicated test.

### Frontend
- Only **`frontend/src/lib/financial-utils.test.ts`** exists (Vitest). Tests `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent`.
- Zero React component/render tests exist for any dashboard component (`KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, etc.) in `components/dashboard/`.

---

## Documentation

### Agent guidance
- **`AGENTS.md`** mandates agents check `.agents/rules`, `.agents/skills`, and `memory-bank/` before acting.
- **`.agents/rules/`** directory exists for rule files (currently contains `agent-research.md`).
- **`.agents/skills/`** directory referenced in `AGENTS.md` but does not exist (scandir fails).

### Memory bank
- **`memory-bank/`** contains `project-summary.md`, `project-structure.md`, `README.md` documenting the project.
- **`memory-bank/verification.md`** records that AI agents added unintended sections ("Data Flows", "JSON Samples") during generation — risk of over-generation beyond constraints.

---

## Developer Experience (DX)

### Path aliases & imports
- **`vite.config.ts`** (`resolve.alias`) and **`tsconfig.app.json`** (`paths`) both map `@/` → `./src`. All frontend imports use this shorthand.

### Tooling configuration
- **`tsconfig.app.json`**: `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`. Missing `noUncheckedIndexedAccess`.
- **`eslint.config.js`**: extends `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` vite config.

### Docker image bloat
- Both `backend/Dockerfile` and `frontend/Dockerfile` use `COPY . .` — includes tests, configs, and all source in the image. No `.dockerignore`.

---

## Code Style & Conventions

### Backend (Python)
- Business logic is module-level pure functions in **`backend/app/routes.py`** — no classes for data operations.
- `from __future__ import annotations` at top of **`backend/app/routes.py`** for PEP 604 forward references.
- `random.seed(42)` called in every endpoint for reproducible mock data.

### Frontend (React/TypeScript)
- **shadcn/ui new-york style**: confirmed in `components.json` (`"style": "new-york"`). Primitives (`card.tsx`, `skeleton.tsx`) use `data-slot` attributes.
- **CSS theming**: `frontend/src/index.css` defines light + `.dark` CSS custom properties (`--background`, `--chart-income`, etc.). Recharts references them via `stroke="var(--chart-...)"`.
- **Tailwind v4**: `index.css` uses `@import "tailwindcss"` (not `@tailwind` directives).
- **Loading skeletons**: Every component in `components/dashboard/` accepts `loading?: boolean` and renders `<Skeleton>` fallback (`kpi-card.tsx`, `income-outcome-chart.tsx`, `profit-percent-chart.tsx`).
- **Custom tooltips**: `IncomeOutcomeChart.tsx` and `ProfitPercentChart.tsx` define inline `CustomTooltip` components instead of Recharts' built-in.
- **Lucide icons**: Used in `kpi-row.tsx`, `dashboard-header.tsx`, `kpi-card.tsx` for consistent iconography.
- **Formatters**: `formatCurrency()` and `formatPercent()` isolated in `financial-utils.ts`, not embedded in components.

---

## Security & Risk

| Severity | Finding | File(s) |
|----------|---------|---------|
| 🔴 CRITICAL | `debugpy` runs on `--listen 0.0.0.0:5678` in default `CMD` (RCE vector if exposed beyond dev) | `backend/Dockerfile` |
| 🔴 CRITICAL | `CORSMiddleware(allow_origins=["*"])` — open to any origin | `backend/app/main.py` |
| 🟠 HIGH | No auth middleware or dependency injection — all endpoints public | `backend/app/routes.py` |
| 🟠 HIGH | `filter_movements()` doesn't accept `business_type`, so it's manually filtered via list comprehension in **5+ endpoints** (`get_metrics_summary`, `get_top_categories`, `get_metrics_comparison`, `get_metrics_alerts`, `get_b2b_metrics`, `get_b2c_metrics`) — maintenance risk | `backend/app/routes.py` |
| 🟡 MEDIUM | `App.tsx` fetches data once in `useEffect` — no retry, no cache, re-fetches on re-mount | `frontend/src/App.tsx` |
| 🟡 MEDIUM | `period="2024 - Full Year"` hardcoded in `<DashboardHeader>`, not derived from actual data range | `frontend/src/App.tsx` |
| 🟡 MEDIUM | `ordered[0].create_date` in `build_metrics_facets` — no guard on empty list. No `noUncheckedIndexedAccess` in tsconfig | `backend/app/routes.py`, `tsconfig.app.json` |

---