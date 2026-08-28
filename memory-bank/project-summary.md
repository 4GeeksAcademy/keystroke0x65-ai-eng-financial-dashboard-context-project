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


