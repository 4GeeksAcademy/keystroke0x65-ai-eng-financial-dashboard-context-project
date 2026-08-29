# Container & Infrastructure Rules

> Validated: 2026-08-28
> Source: agent-research.md (R01–R07)

---

### R01 — Single source of truth for service topology

**Rule**: MUST keep `docker-compose.yml` as the single source of truth for service topology (frontend + backend on internal Docker network).

**Why**: The project has exactly two services that must communicate over an internal Docker network. Any divergence between `docker-compose.yml` and ad-hoc Docker commands creates drift that isn't caught until deployment breaks.

**Actionable check**: Before adding a new service or changing network config, update `docker-compose.yml` first. All `docker run` commands should be derived from the compose file, not bypass it.

**Validation**: ✅ `docker-compose.yml` defines frontend (port 5173) and backend (port 8000, 5678) on the default network.

```yaml
# Validated structure:
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]
  backend:
    build: ./backend
    ports: ["8000:8000", "5678:5678"]
```

---

### R02 — Preserve hot-reload volume mounts

**Rule**: MUST preserve the volume mounts `./frontend:/app` and `./backend:/app` for hot-reload.

**Why**: The `--reload` flag in uvicorn and Vite's dev server rely on file change detection via these mounts. Removing them forces a full rebuild on every code change.

**Actionable check**: If you add a new volume mount, never remove or comment out the existing `/app` mounts. Any additional mounts (e.g., for secrets, configs) must be supplementary.

**Validation**: ✅ Both services in `docker-compose.yml` have `./frontend:/app` and `./backend:/app` respectively.

---

### R03 — Mask local node_modules

**Rule**: MUST keep the anonymous volume `- /app/node_modules` on the frontend service to mask local node_modules from the container.

**Why**: Host node_modules (possibly for a different platform/architecture) would shadow the container's node_modules if mounted directly. The anonymous volume ensures the container's own `npm install` results are used.

**Actionable check**: Never replace the anonymous volume with a bind mount to a local `node_modules` directory. If adding volumes, ensure the anonymous `- /app/node_modules` entry remains present.

**Validation**: ✅ `docker-compose.yml` frontend volumes includes `- /app/node_modules`.

---

### R04 — Add healthcheck for service readiness

**Rule**: SHOULD add a `healthcheck` to the backend service so `depends_on` waits for service readiness, not just container start.

**Why**: Docker's `depends_on` only waits for the container to start (status "running"), not for uvicorn to be ready to serve requests. A simple `/health` endpoint exists — the healthcheck should use it.

**Actionable check**: Before deploying or when debugging startup race conditions, verify the backend healthcheck is wired:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**Validation task** (run manually):

```bash
# After adding healthcheck, verify it works:
docker compose exec backend curl -f http://localhost:8000/health
# Expected: {"status":"ok"}
```

---

### R05 — Add .dockerignore to reduce image bloat

**Rule**: SHOULD add a `.dockerignore` file to both `frontend/` and `backend/` to exclude tests, config files, and source from Docker images.

**Why**: Both Dockerfiles use `COPY . .` which copies the entire directory including tests, configs, and node_modules/pycache into the image. A `.dockerignore` reduces image size and prevents cache invalidation from irrelevant changes.

**Actionable check**: The `.dockerignore` should exclude non-runtime files:

```gitignore
.git/
__pycache__/
*.pyc
*.pyo
.pytest_cache/
tests/
node_modules/
.gitignore
*.md
.env
.env.local
```

**Validation**: ✅ (Task performed) Created `.dockerignore` for backend.

```bash
# After creation, verify:
cat backend/.dockerignore
# Should list: __pycache__, *.pyc, tests/, .git/, etc.
```

---

### R06 — Never expose debugpy on 0.0.0.0 in production CMD

**Rule**: MUST NOT include `debugpy` on `--listen 0.0.0.0:5678` in the default `CMD` of `backend/Dockerfile` — this is an RCE vector outside of local dev.

**Why**: `debugpy` listens for arbitrary code execution connections. Binding to `0.0.0.0` makes it accessible from outside the container. Port 5678 is also exposed in `docker-compose.yml`.

**Actionable check**: The production `CMD` should use uvicorn directly without debugpy:

```dockerfile
# For production (not in current Dockerfile — must add alternate stage or override):
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Use debugpy ONLY in dev mode. Consider a multi-stage Dockerfile or docker-compose override.

**Validation**: ✅ Current `backend/Dockerfile` CMD uses debugpy — flagged for production. A production override or multi-stage build should drop it.

---

### R07 — Restrict CORS origins in non-dev environments

**Rule**: SHOULD restrict `CORSMiddleware(allow_origins=["*"])` to specific origins in production-aware configurations.

**Why**: Open CORS (`*`) allows any website to make requests to the API, which is fine for local dev but a security risk if the API is ever exposed beyond `localhost`.

**Actionable check**: CORS should be configurable via environment variable:

```python
# app/main.py — use env var for production
import os
allow_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    ...
)
```

**Validation**: ✅ `backend/app/main.py` currently has `allow_origins=["*"]` — flagged for production hardening.