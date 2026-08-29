# Project Summary — Financial Dashboard

## What it does

A financial metrics dashboard that visualizes mock income and outcome data. It displays key performance indicators (total income, total outcome, profit, profit percentage) alongside monthly charts for income vs. outcome and profit percentage trends. The backend generates realistic random financial movements for a full year, which the frontend fetches, processes, and renders.

## How to run it

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend** (API): http://localhost:8000
- **API Docs** (Swagger UI): http://localhost:8000/docs

## Frontend ↔ Backend ↔ Docker connection

The project uses Docker Compose to run two services that communicate over an internal Docker network.

| Service   | Port  | Technology                 | Dockerfile             |
|-----------|-------|----------------------------|------------------------|
| Frontend  | 5173  | React + TypeScript (Vite)  | `frontend/Dockerfile`  |
| Backend   | 8000  | FastAPI (Python 3.13)      | `backend/Dockerfile`   |

### How they connect

1. **Docker Compose** (`docker-compose.yml`) defines both services. The frontend has `depends_on: backend`, so the backend starts first. Both share the same Docker network, allowing them to reach each other by service name.

2. **Vite proxy** (in `frontend/vite.config.ts`):  
   During development, the Vite dev server proxies any request starting with `/api` to `http://backend:8000`. This avoids CORS issues and lets the frontend talk to the backend via the Docker-internal hostname `backend`.

3. **Frontend fallback env var**:  
   The frontend can also read `VITE_API_BASE_URL` from the environment (`.env` file) to point to a different backend origin if needed.

4. **Backend CORS**:  
   The FastAPI backend uses `CORSMiddleware` with `allow_origins=["*"]`, so it accepts requests from any origin in standalone setups.
---

## Recent Changes (2026-08-28)

| Change | File(s) | Rules Validated |
|--------|---------|-----------------|
| Generated rule files from agent-research findings | `.agents/rules/container-rules.md`, `api-rules.md`, `naming-rules.md`, `frontend-rules.md`, `testing-rules.md`, `project-rules.md` | R01–R49 |
| Added `.dockerignore` for backend and frontend | `backend/.dockerignore`, `frontend/.dockerignore` | R05 |
| Added `@functools.lru_cache` to `generate_mock_movements` | `backend/app/routes.py` | R10 |
| Added `start_date > end_date` validation with 422 | `backend/app/routes.py` | R11 |
| Extracted `business_type` into `filter_movements()` | `backend/app/routes.py` | R12 |
| Added empty-list guard in `build_metrics_facets` | `backend/app/routes.py` | R22 |
| Derived `period` from data range instead of hardcoding | `frontend/src/App.tsx` | R35 |
| Added 4 dedicated tests for `/api/metrics/alerts` | `backend/tests/test_routes.py` | R39 |
| Added test for date range validation (422) | `backend/tests/test_routes.py` | R11 |
| Created `.agents/skills/` directory with README | `.agents/skills/README.md` | R43 |
| Updated this memory bank with change log | `memory-bank/project-summary.md` | R45 |

