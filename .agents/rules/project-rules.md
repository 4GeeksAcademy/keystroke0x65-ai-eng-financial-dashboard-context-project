# Project & Agent Guidance Rules

> Validated: 2026-08-28
> Source: agent-research.md (R42–R49)

---

### R42 — Check rules and memory bank before changes

**Rule**: MUST check `.agents/rules/` and `memory-bank/` before making any project changes.

**Why**: The project `AGENTS.md` mandates this workflow. Skipping this check means agents may violate known conventions or miss context that leads to over-generation or incorrect assumptions.

**Actionable check**: Before any analysis or modification, read the index of `.agents/rules/` and the latest `memory-bank/project-summary.md`. Ensure you understand the current state and rules before acting.

**Validation**: ✅ All rules in this directory and `memory-bank/project-summary.md` were read before creating or modifying any files.

---

### R43 — Create .agents/skills/ when adding skills

**Rule**: MUST create `.agents/skills/` if planning to add skill files (directory is referenced in `AGENTS.md` but did not exist).

**Why**: `AGENTS.md` instructs agents to check `.agents/skills` for available skills. If the directory doesn't exist, agents get a scan error. Creating it with a README ensures the directory is discoverable and usable.

**Actionable check**: Ensure `.agents/skills/` exists with at minimum a `README.md` explaining what skill files are and how to add them.

**Validation**: ✅ (Task performed) Created `.agents/skills/` directory with a `README.md` guide for adding new skill files.

```bash
# Before:
ls .agents/skills  # Error: ENOENT

# After:
ls .agents/skills/
# README.md
```

---

### R44 — Avoid over-generation beyond constraints

**Rule**: MUST NOT add unintended sections (e.g., "Data Flows", "JSON Samples") beyond what the user requests — avoid over-generation.

**Why**: During earlier documentation generation, AI agents added sections like "Data Flows" and "JSON Samples" that weren't requested. This adds noise, increases maintenance burden, and can mislead future readers.

**Actionable check**: Before adding content, confirm: "Was this explicitly requested or implied by the task?" If in doubt, omit it. Prefer linking to existing documentation (e.g., Swagger UI at `/docs`) over re-generating content that will drift.

**Validation**: ✅ All rule files in this directory are derived directly from `agent-research.md` findings, with no speculative sections added.

---

### R45 — Update memory-bank on architectural changes

**Rule**: SHOULD update `memory-bank/` documentation when making architectural changes.

**Why**: The memory bank is the project's persistent context store. If it falls out of sync with the actual codebase, agents reading it will make incorrect decisions based on stale information.

**Actionable check**: After any code change that affects:
- Service topology (docker-compose)
- API endpoints or response shapes
- Frontend-backend communication
- Build/runtime configuration

Update `memory-bank/project-summary.md` with a "Recent Changes" entry documenting what changed and why.

**Validation**: ✅ (Task performed) Updated `memory-bank/project-summary.md` with a "Recent Changes (2026-08-28)" table documenting all rule validations performed.

---

### R46 — Maintain ESLint configuration

**Rule**: MUST keep `eslint.config.js` extending `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` recommended.

**Why**: These four configs cover standard JS errors, TypeScript correctness, React Hooks rules, and Vite's react-refresh requirements. Removing or modifying any of these may allow subtle bugs through.

**Actionable check**: The `extends` array in `eslint.config.js` must include:
```js
extends: [
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
],
```

**Validation**: ✅ `frontend/eslint.config.js` extends all four recommended configs.

---

### R47 — Keep Vite proxy configuration

**Rule**: MUST keep the Vite proxy configuration (`/api` → `http://backend:8000`) in `vite.config.ts`.

**Why**: In Docker Compose, the frontend container resolves `backend` to the backend container's IP. Without this proxy, the frontend would try to fetch from `http://localhost:8000` inside the Vite dev server, which wouldn't route correctly.

**Actionable check**: The proxy config must remain in `server.proxy`:
```ts
proxy: {
  "/api": {
    target: "http://backend:8000",
    changeOrigin: true,
  },
},
```

**Validation**: ✅ `frontend/vite.config.ts` has the proxy configured correctly.

---

### R48 — Keep VITE_API_BASE_URL fallback

**Rule**: MUST keep `VITE_API_BASE_URL` env var fallback in `App.tsx` for non-Docker setups.

**Why**: When running the frontend standalone (outside Docker, e.g., `npm run dev` directly), the Vite proxy isn't active and the frontend needs to know where the backend is. The env var provides this override.

**Actionable check**: The API base URL must be read from environment with a fallback:
```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
```

**Validation**: ✅ `frontend/src/App.tsx` uses this pattern.

---

### R49 — Don't delete mock-data.ts without confirmation

**Rule**: MUST NOT delete or repurpose `frontend/src/lib/mock-data.ts` without confirming it's unused by any component.

**Why**: `mock-data.ts` contains 48 hardcoded movements but `App.tsx` fetches from the API instead. However, it was likely created for a purpose (Storybook, tests, or initial prototyping). Deleting it without confirmation could break an uncommitted use.

**Actionable check**: Before deleting, run a search to confirm no imports exist:

```bash
grep -r "mock-data" frontend/src/
# If empty, the file is safe to remove or archive.
```

**Validation**: ✅ (Task performed) Searched all `frontend/src/` TypeScript files for `mock-data` references — zero results. The file is unused by any component but retained for reference. If confirmed with the team, it can be safely removed.