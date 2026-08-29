# Naming Conventions

> Validated: 2026-08-28
> Source: agent-research.md (R14–R18)

---

### R14 — PascalCase for dashboard components

**Rule**: MUST use PascalCase (kebab-case file names) for dashboard component files: `kpi-card.tsx`, `income-outcome-chart.tsx`, `dashboard-header.tsx`.

**Why**: This distinguishes domain-specific dashboard components from reusable UI primitives by file naming convention. kebab-case with hyphens is standard for shadcn/ui projects.

**Actionable check**: Before creating a new dashboard component, name the file using kebab-case (e.g., `revenue-trend-chart.tsx`). Ensure the exported function uses PascalCase (`RevenueTrendChart`).

**Validation**: ✅ Files in `components/dashboard/` follow convention:
- `kpi-card.tsx` → exports `KPICard`
- `income-outcome-chart.tsx` → exports `IncomeOutcomeChart`
- `profit-percent-chart.tsx` → exports `ProfitPercentChart`
- `dashboard-header.tsx` → exports `DashboardHeader`
- `kpi-row.tsx` → exports `KPIRow`

---

### R15 — Lowercase for UI primitives

**Rule**: MUST use lowercase for reusable UI primitive files: `card.tsx`, `skeleton.tsx`.

**Why**: UI primitives (from shadcn/ui) use short, lowercase filenames to signal they are generic building blocks, not domain-specific components.

**Actionable check**: For any new shadcn/ui component, use a lowercase filename matching the component name (e.g., `button.tsx`, `input.tsx`, `badge.tsx`). Place in `components/ui/`.

**Validation**: ✅ Files in `components/ui/` follow convention:
- `card.tsx` — exports `Card`, `CardHeader`, `CardContent`, etc.
- `skeleton.tsx` — exports `Skeleton`

---

### R16 — Verb-prefixed pure functions in Python

**Rule**: MUST use verb-prefixed pure function names in Python routes: `filter_movements`, `summarize_movements`, `build_top_categories`, `calculate_net_value`, `detect_outcome_alerts`.

**Why**: Verb-first naming makes the function's action clear at the call site. It distinguishes pure data-transformation functions from endpoint handlers (which start with `get_`).

**Actionable check**: When adding a new data transformation in `routes.py`, prefix it with an action verb: `compute_*`, `build_*`, `filter_*`, `summarize_*`, `calculate_*`, `detect_*`. Internal helpers use underscore prefix: `_build_movement`, `_year_for_month`.

**Validation**: ✅ All data functions in `routes.py` follow verb-first naming:
- `filter_movements_by_date()`, `filter_movements()`
- `summarize_movements()`
- `build_metrics_facets()`, `build_top_categories()`
- `calculate_net_value()`
- `detect_outcome_alerts()`
- `ensure_chronological_order()`
- `generate_mock_movements()`
- Internal helpers: `_build_movement()`, `_year_for_month()`

---

### R17 — camelCase for frontend utilities

**Rule**: MUST use camelCase for frontend utility functions: `computeKPIs`, `computeMonthlyData`, `formatCurrency`, `formatPercent`.

**Why**: Standard JavaScript/TypeScript convention. Using snake_case or PascalCase for plain utility functions would break consistency with the rest of the frontend codebase.

**Actionable check**: When adding a new utility in `financial-utils.ts`, name it in camelCase. Import it using the `@/lib/financial-utils` alias path.

**Validation**: ✅ All utilities in `frontend/src/lib/financial-utils.ts` use camelCase:
- `computeKPIs()`, `computeMonthlyData()`
- `formatCurrency()`, `formatPercent()`
- Internal helpers: `toYearMonthKey()`, `formatMonthYearLabel()`

---

### R18 — Mirror backend types exactly in financial-types.ts

**Rule**: MUST mirror backend types exactly in `frontend/src/lib/financial-types.ts` — keep `OperationType`, `Category`, `BusinessType`, `FinancialMovement`, `KPIMetrics`, `MonthlyDataPoint` in sync with Pydantic models in `routes.py`.

**Why**: The frontend serializes backend API responses into these types. Any mismatch (e.g., backend adds a field, frontend doesn't) can cause silent undefined values or TypeScript compilation errors. Keeping them in sync prevents data-loss bugs.

**Actionable check**: When adding a field to a Pydantic model in `routes.py`, update the corresponding TypeScript `type` or `interface` in `financial-types.ts` in the same PR/commit. The frontend types MUST match the JSON shape of the API responses.

**Current type mapping**:

| Backend (Pydantic) | Frontend (TypeScript) | Status |
|---|---|---|
| `OperationType = Literal["income", "outcome"]` | `type OperationType = 'income' \| 'outcome'` | ✅ Synced |
| `Category = Literal["suppliers", "sales", ...]` | `type Category = 'suppliers' \| 'sales' \| ...` | ✅ Synced |
| `BusinessType = Literal["B2B", "B2C"]` | `type BusinessType = 'B2B' \| 'B2C'` | ✅ Synced |
| `FinancialMovement` (create_date, amount, operation_type, category, business_type) | `interface FinancialMovement` (create_date, amount, operation_type, category, business_type) | ✅ Synced |
| — | `interface KPIMetrics` (computed, not from API) | Frontend-only |
| — | `interface MonthlyDataPoint` (computed, not from API) | Frontend-only |

**Note**: `KPIMetrics` and `MonthlyDataPoint` are frontend-computed types from `financial-utils.ts` — they don't correspond to any single API endpoint and are exempt from this rule.

**Validation**: ✅ (Task performed) Verified that `OperationType`, `Category`, `BusinessType`, and `FinancialMovement` field names and types match between `routes.py` and `financial-types.ts`. Added this table as a living reference — it should be updated whenever types change.