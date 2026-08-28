# Project Structure — Financial Dashboard

## Directory Tree

```
financial-dashboard/
├── docker-compose.yml              # Orchestrates frontend + backend containers
├── README.md                       # Project overview & setup instructions
│
├── backend/                        # FastAPI Python backend
│   ├── Dockerfile                  # Python 3.13-slim image, debugpy, uvicorn
│   ├── requirements.txt            # fastapi, uvicorn, debugpy, pytest, httpx
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app with CORS middleware
│   │   └── routes.py               # All API endpoints & mock data generator
│   └── tests/
│       ├── conftest.py
│       └── test_routes.py          # Tests for endpoints & filtering logic
│
├── frontend/                       # React + TypeScript (Vite) frontend
│   ├── Dockerfile                  # Node 24-alpine image
│   ├── package.json                # React 19, Recharts, Lucide, Tailwind
│   ├── vite.config.ts              # Vite config with /api proxy → backend
│   ├── index.html
│   ├── components.json             # shadcn/ui components config
│   ├── eslint.config.js
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   └── src/
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # Root component, fetches /api/metrics
│       ├── index.css               # Tailwind imports + CSS variables
│       ├── assets/                 # Static assets
│       ├── lib/
│       │   ├── utils.ts            # cn() helper (clsx + tailwind-merge)
│       │   ├── financial-types.ts  # TypeScript interfaces (FinancialMovement, KPIMetrics, etc.)
│       │   ├── financial-utils.ts  # computeKPIs(), computeMonthlyData(), formatCurrency()
│       │   └── mock-data.ts
│       ├── components/
│       │   ├── ui/                 # Reusable UI primitives
│       │   │   ├── card.tsx        # Card, CardHeader, CardTitle, CardDescription, CardContent
│       │   │   └── skeleton.tsx    # Loading skeleton placeholder
│       │   └── dashboard/          # Dashboard-specific components
│       │       ├── dashboard-header.tsx        # Header with title & period badge
│       │       ├── kpi-card.tsx                # Single KPI metric card
│       │       ├── kpi-row.tsx                 # Row of 4 KPI cards (Income, Outcome, Profit, Margin)
│       │       ├── income-outcome-chart.tsx    # Line chart: income vs outcome by month
│       │       └── profit-percent-chart.tsx    # Line chart: profit margin % by month
│       └── (component tests)
│
└── memory-bank/                    # Project memory & documentation
    ├── README.md
    ├── project-summary.md
    ├── project-structure.md        # ← You are here
    └── (other memory files)
```

---

## Services

### 1. Backend — FastAPI (Python 3.13)

- **File**: [backend/app/main.py](../backend/app/main.py)
  - Creates the `FastAPI` app instance.
  - Registers CORS middleware (`allow_origins=["*"]`).
  - Includes the router from `routes.py`.

- **File**: [backend/app/routes.py](../backend/app/routes.py)
  - Defines all API endpoints on an `APIRouter`.
  - Contains the mock data generator (`generate_mock_movements(seed=42)`) that produces 360 financial movements (30 per month × 12 months).
  - Utility functions: `filter_movements()`, `summarize_movements()`, `build_top_categories()`, `calculate_net_value()`, `detect_outcome_alerts()`.

- **Dependencies** (from [backend/requirements.txt](../backend/requirements.txt)):
  - `fastapi`, `uvicorn[standard]`, `debugpy` (debugging), `pytest`, `pytest-cov`, `httpx`.

- **Tests**: [backend/tests/test_routes.py](../backend/tests/test_routes.py)

### 2. Frontend — React + TypeScript (Vite)

- **Entry point**: [frontend/src/main.tsx](../frontend/src/main.tsx)
- **Root component**: [frontend/src/App.tsx](../frontend/src/App.tsx)
  - Fetches `GET /api/metrics` on mount.
  - Processes data with `computeKPIs()` and `computeMonthlyData()`.
  - Renders `DashboardHeader`, `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`.

- **Library modules**:
  - [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts) — TypeScript interfaces (`FinancialMovement`, `KPIMetrics`, `MonthlyDataPoint`).
  - [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts) — Computation and formatting utilities.
  - [frontend/src/lib/utils.ts](../frontend/src/lib/utils.ts) — `cn()` class merge helper.

- **Dashboard components**:
  - [frontend/src/components/dashboard/dashboard-header.tsx](../frontend/src/components/dashboard/dashboard-header.tsx)
  - [frontend/src/components/dashboard/kpi-card.tsx](../frontend/src/components/dashboard/kpi-card.tsx)
  - [frontend/src/components/dashboard/kpi-row.tsx](../frontend/src/components/dashboard/kpi-row.tsx)
  - [frontend/src/components/dashboard/income-outcome-chart.tsx](../frontend/src/components/dashboard/income-outcome-chart.tsx)
  - [frontend/src/components/dashboard/profit-percent-chart.tsx](../frontend/src/components/dashboard/profit-percent-chart.tsx)

- **UI primitives**:
  - [frontend/src/components/ui/card.tsx](../frontend/src/components/ui/card.tsx)
  - [frontend/src/components/ui/skeleton.tsx](../frontend/src/components/ui/skeleton.tsx)

### 3. Docker Compose

- **File**: [docker-compose.yml](../docker-compose.yml)
  - Defines two services: `frontend` (port 5173) and `backend` (port 8000).
  - Frontend has `depends_on: backend`.
  - Both share a Docker network; frontend proxies `/api` to `http://backend:8000` via Vite config.

---

## API Endpoints

All endpoints are defined in [backend/app/routes.py](../backend/app/routes.py).

| Method | Endpoint | Description | Query Parameters | Response Model |
|--------|----------|-------------|-----------------|----------------|
| `GET` | [`/health`](../backend/app/routes.py#L233) | Health check | — | `{"status": "ok"}` |
| `GET` | [`/api/metrics`](../backend/app/routes.py#L239) | List all financial movements (filterable) | `start_date`, `end_date`, `category`, `operation_type` | `list[FinancialMovement]` |
| `GET` | [`/api/metrics/facets`](../backend/app/routes.py#L252) | Get available filter facets | — | `MetricsFacets` |
| `GET` | [`/api/metrics/summary`](../backend/app/routes.py#L257) | Aggregated income/outcome/net by period | `group_by` (day/week/month), `start_date`, `end_date`, `category`, `operation_type`, `business_type` | `list[MetricsSummaryItem]` |
| `GET` | [`/api/metrics/categories/top`](../backend/app/routes.py#L276) | Top categories by operation type | `operation_type`, `limit`, `start_date`, `end_date`, `business_type` | `list[TopCategoryItem]` |
| `GET` | [`/api/metrics/comparison`](../backend/app/routes.py#L293) | Net value comparison between two periods | `start_date`, `end_date`, `business_type` | `MetricsComparison` |

