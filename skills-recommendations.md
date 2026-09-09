# Skills Recommendations — Financial Dashboard

> Generated: 2026-09-09
> Use: `find-skills` analysis of project structure, code, tests, docs, and known gaps

Based on a full project audit, here are **10 recommended skills** for this Financial Dashboard project, ordered by priority (highest impact first).

---

## 1. 🥇 Security Audit Skill

**Why this project needs it:**
- **CRITICAL:** `debugpy` listens on `0.0.0.0:5678` in the default Docker `CMD` — a remote code execution vector
- **CRITICAL:** `CORSMiddleware(allow_origins=["*"])` — accepts requests from any origin
- **HIGH:** No authentication middleware — all 9 API endpoints are public
- No secrets management, no environment-based security configuration

**What it would cover:** Backend security hardening, Docker security, CORS configuration patterns, auth middleware patterns (API keys, JWT), conditional debugger activation.

**Files to target:** `backend/Dockerfile`, `backend/app/main.py`, `backend/app/routes.py`, `docker-compose.yml`

---

## 2. 🥇 React Component Testing Skill  ✅ Installed (2026-09-09)

**Why this project needs it:**
- **Zero component/render tests** exist — only 4 utility function tests
- 5 dashboard components (`KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, `DashboardHeader`, `KPICard`) and 2 UI primitives are completely untested
- No integration tests between components and data fetching
- React 19 + Vite + Vitest already set up — only testing infrastructure missing

**What it would cover:** Component render testing with React Testing Library, snapshot testing, mocking fetch/SWR, testing loading/error states, testing chart components.

**Files to target:** All files in `frontend/src/components/`

> **Status:** Installed from `affaan-m/ecc` (skill path: `skills/react-testing/SKILL.md`). Skill is now available in `.agents/skills/` for agent-guided React component render verification.

---

## 3. 🥇 Python Backend Testing Skill (Advanced)

**Why this project needs it:**
- 18 backend tests exist but coverage gaps remain: `filter_movements()` doesn't accept `business_type` as a parameter — duplicated business-type filtering logic across 5+ endpoints is a maintenance risk
- No property-based testing or fuzz testing for the mock data generator
- No performance/load tests for the 9 endpoints

**What it would cover:** Parametrized testing patterns, refactoring toward testable code (injecting `business_type` into `filter_movements()`), property-based testing with Hypothesis, endpoint contract testing.

**Files to target:** `backend/tests/test_routes.py`, `backend/app/routes.py`

---

## 4. 🥈 Data Fetching & Caching Skill

**Why this project needs it:**
- Raw `fetch` in `useEffect` with no retry, no caching, no deduplication
- Error state is shown to user but offers **no retry mechanism**
- No stale-while-revalidate pattern — re-mount triggers a full fresh request
- No request deduplication (StrictMode in dev fires duplicate requests)

**What it would cover:** SWR/React Query integration, request deduplication, retry logic with exponential backoff, error boundary patterns, optimistic updates for future mutations.

**Files to target:** `frontend/src/App.tsx`

---

## 5. 🥈 Docker Production Readiness Skill

**Why this project needs it:**
- No `healthcheck` in `docker-compose.yml` — `depends_on` only waits for container start, not service readiness
- Both Dockerfiles use `COPY . .` (even with `.dockerignore`, this is a layers anti-pattern)
- `debugpy` in the default production CMD
- Multi-stage build not used — production images include dev dependencies and source files

**What it would cover:** Healthcheck patterns, multi-stage Dockerfiles, production vs development Docker configurations, Docker layer caching optimization, Docker Compose production overrides.

**Files to target:** `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`

---

## 6. 🥈 Bundle Performance Optimization Skill

**Why this project needs it:**
- `lucide-react` imported from barrel (loads ~1,583 modules, ~2.8s extra dev time)
- Recharts (~200KB) imported eagerly — not deferred with dynamic imports
- No bundle analysis has been performed
- The accessibility audit's React best practices audit identified these as critical findings

**What it would cover:** Barrel import elimination patterns (direct imports, `optimizePackageImports` equivalents for Vite), dynamic imports with `React.lazy()` + `Suspense`, bundle analysis with `vite-bundle-visualizer`, code splitting strategies.

**Files to target:** `frontend/src/components/dashboard/kpi-row.tsx`, `frontend/src/components/dashboard/dashboard-header.tsx`, `frontend/src/components/dashboard/income-outcome-chart.tsx`, `frontend/src/components/dashboard/profit-percent-chart.tsx`, `frontend/src/App.tsx`

---

## 7. 🥈 API Contract & Type Safety Skill

**Why this project needs it:**
- Frontend TypeScript types in `financial-types.ts` and `specs/api-types.ts` must be kept in sync with the 9 FastAPI endpoints manually
- No OpenAPI/Swagger code generation is used — types can drift from the actual API
- 3 features being spec'd (date range filter, anomaly alerts, B2B vs B2C comparison) will add more endpoints

**What it would cover:** OpenAPI client generation (openapi-typescript, orval), auto-generating TypeScript types from the FastAPI schema, end-to-end type safety patterns, contract testing between frontend and backend.

**Files to target:** `frontend/src/lib/financial-types.ts`, `frontend/specs/api-types.ts`, `frontend/specs/`, `backend/app/routes.py`

---

## 8. 🥉 Accessibility Audit Skill (Enhance Existing)

**Why this project needs it:**
- A11y audit was already run using the accessibility skill, finding **4 critical issues** (generic page title, decorative icons not hidden, error not announced, chart titles as `<div>`)
- The accessibility skill exists but the project hasn't been fully remediated
- WCAG 2.2 Level AA compliance is the target

**What it would cover:** Automated follow-up remediation based on the existing audit results, keyboard navigation testing, contrast ratio verification, screen reader testing patterns, ARIA live region patterns.

**Files to target:** `frontend/index.html`, `frontend/src/components/dashboard/dashboard-header.tsx`, `frontend/src/App.tsx`, `frontend/src/components/ui/card.tsx`

---

## 9. 🥉 Feature Specification & TDD Skill

**Why this project needs it:**
- 3 features are spec'd in `frontend/specs/spec-testing/` with plans, specs, and tests documents — but they're **not yet implemented**
- Feature 1: Date range filter
- Feature 2: Anomaly alerts
- Feature 3: B2B vs B2C comparison
- The specs exist but no implementation has begun

**What it would cover:** Spec-driven development workflow, converting spec docs to tests first (TDD), implementing features from test specifications, acceptance criteria validation, feature flag patterns.

**Files to target:** `frontend/specs/spec-testing/feature-1-date-range-filter/`, `frontend/specs/spec-testing/feature-2-anomaly-alerts/`, `frontend/specs/spec-testing/feature-3-b2b-vs-b2c-comparison/`

---

## 10. 🥉 FastAPI Code Quality & Refactoring Skill

**Why this project needs it:**
- `filter_movements()` doesn't accept `business_type` — business type filtering is duplicated as ad-hoc list comprehensions across **6 endpoints**
- `frontend/src/lib/mock-data.ts` is **dead code** (48 hardcoded movements, never used)
- Magic numbers scattered (seed=42, 30 movements/month, income probability 0.45-0.7)
- No dependency injection — endpoints call `generate_mock_movements(seed=42)` directly

**What it would cover:** Code smells detection, dependency injection patterns for FastAPI, eliminating code duplication, configurable parameters, removing dead code, `Depends()` usage for shared logic.

**Files to target:** `backend/app/routes.py`, `frontend/src/lib/mock-data.ts`

---

## 11. 🥉 Memory Bank Updater Skill ✅ Installed (2026-09-09)

**Why this project needs it:**
- The memory bank (`project-status.md`, `project-structure.md`, `project-summary.md`) is manually kept in sync — it drifts when commits happen without updating docs
- 37 frontend tests and 18 backend tests exist, but the memory-bank test counts can become stale after new commits
- 9 API endpoints exist and could change without docs reflecting it
- Agents rely on the memory bank for context — stale docs lead to bad agent decisions
- No automation exists to refresh project status on git events

**What it would cover:** Detecting git commits and explicit user requests, analyzing file changes (`git diff --stat`), updating `project-status.md` (date, branch, commit hash, test counts, new features, resolved gaps), and conditionally updating `project-structure.md` and `project-summary.md` when architecture changes occur.

**Files to target:** `memory-bank/project-status.md`, `memory-bank/project-structure.md`, `memory-bank/project-summary.md`

> **Status:** Installed locally in `.agents/skills/memory-bank-updater/SKILL.md`. The skill is now available for agent use.

---

## Summary Table

| # | Skill | Priority | Category | Urgency |
|---|-------|----------|----------|---------|
| 1 | Security Audit | 🔴 Critical | Backend/DevOps | Immediate |
| 2 | React Component Testing | 🔴 Critical | Frontend/QA | Immediate |
| 3 | Python Backend Testing (Advanced) | 🔴 Critical | Backend/QA | This sprint |
| 4 | Data Fetching & Caching | 🟠 High | Frontend | This sprint |
| 5 | Docker Production Readiness | 🟠 High | DevOps | Next sprint |
| 6 | Bundle Performance Optimization | 🟠 High | Frontend | Next sprint |
| 7 | API Contract & Type Safety | 🟡 Medium | Cross-stack | Next sprint |
| 8 | Accessibility Audit (Enhance) | 🟡 Medium | Frontend | Backlog |
| 9 | Feature Specification & TDD | 🟢 Low/Planning | Process | Before features |
| 10 | FastAPI Code Quality & Refactoring | 🟢 Low | Backend | Backlog |
| 11 | **Memory Bank Updater** | 🟢 Low/Process | Documentation | Installed |
