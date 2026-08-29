# Frontend (React / TypeScript) Rules

> Validated: 2026-08-28
> Source: agent-research.md (R23–R35)

---

### R23 — Use `@/` path alias for all imports

**Rule**: MUST use `@/` path alias for all frontend imports (configured in `vite.config.ts` `resolve.alias` and `tsconfig.app.json` `paths`).

**Why**: The project uses `@/` → `./src` mapping in both Vite and TypeScript configs. Relative imports like `../../lib/utils` are brittle during refactors and inconsistent with the rest of the codebase.

**Actionable check**: Import style MUST be:
```typescript
// ✅ DO:
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ❌ DON'T:
import { Card } from '../../components/ui/card'
```

**Validation**: ✅ All frontend imports in the codebase use `@/`:
- `App.tsx`: `import { DashboardHeader } from "@/components/dashboard/dashboard-header"`
- `kpi-row.tsx`: `import { KPICard } from './kpi-card'` (relative for same-directory is acceptable)
- `card.tsx`: `import { cn } from '@/lib/utils'`

---

### R24 — Maintain strict tsconfig linting flags

**Rule**: MUST keep `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true` in `tsconfig.app.json`.

**Why**: These flags catch dead code (`noUnusedLocals`), unused function params (`noUnusedParameters`), enforce `import type` syntax (verbatimModuleSyntax), and prevent downlevel emit (`erasableSyntaxOnly`). Removing them would allow runtime errors to slip through.

**Actionable check**: Never delete or set these to `false`. When adding new tsconfig options, ensure these remain enabled.

**Validation**: ✅ Present in `tsconfig.app.json`:
```json
"noUnusedLocals": true,
"noUnusedParameters": true,
"verbatimModuleSyntax": true,
"erasableSyntaxOnly": true,
```

---

### R25 — Add noUncheckedIndexedAccess

**Rule**: SHOULD add `"noUncheckedIndexedAccess": true` to `tsconfig.app.json`.

**Why**: Without this flag, TypeScript assumes `arr[0]` is always defined, which can mask `undefined` access. The backend already has an empty-list guard pattern (R22) — frontend should match this rigor.

**Actionable check**: Add to `tsconfig.app.json`:
```json
"noUncheckedIndexedAccess": true
```
This will force handling `undefined` for any array index access and object bracket access.

**Validation**: ✅ Flag is currently absent from `tsconfig.app.json` — marked as a recommended addition.

---

### R26 — Use shadcn/ui New York style

**Rule**: MUST use shadcn/ui New York style conventions (confirmed in `components.json`).

**Why**: The project is configured with `"style": "new-york"` which uses slightly different spacing, border radii, and component anatomy than the default style. Mixing styles creates visual inconsistency.

**Actionable check**: When adding a new shadcn/ui component, use `npx shadcn@latest add <component>` which reads from `components.json` and generates the correct style.

**Validation**: ✅ `components.json` confirms:
```json
"style": "new-york",
"rsc": false,
"tailwind": { "baseColor": "zinc", "cssVariables": false }
```

---

### R27 — data-slot attributes on UI primitives

**Rule**: MUST use `data-slot` attributes on UI primitive components (`card.tsx`, `skeleton.tsx`).

**Why**: `data-slot` attributes are the shadcn/ui New York convention for targeting sub-components in CSS and tests. They replace reliance on fragile class-name selectors.

**Actionable check**: Every UI primitive component should follow this pattern:
```tsx
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card" className={cn(...)} {...props} />
}
```

**Validation**: ✅ `card.tsx` uses `data-slot="card"`, `data-slot="card-header"`, `data-slot="card-title"`, etc. ✅ `skeleton.tsx` uses `data-slot="skeleton"`.

---

### R28 — Define CSS custom properties with light/dark variants

**Rule**: MUST define light + `.dark` CSS custom properties in `index.css` (variables like `--background`, `--chart-income`, etc.)

**Why**: The app uses `class="dark"` on `<main>` in `App.tsx` and CSS theming via custom properties. If a --variable is missing in one mode, that element will fall back to browser defaults (often invisible on dark backgrounds).

**Actionable check**: Every `--variable` defined under `:root` must have a corresponding definition under `.dark`. If adding a new CSS variable, define both variants.

**Validation**: ✅ `index.css` has full light (`:root`) and dark (`.dark`) definitions for: `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--chart-income`, `--chart-outcome`, `--chart-profit`, `--income-badge`, `--outcome-badge`, `--profit-badge`, and more.

---

### R29 — Use Tailwind v4 import syntax

**Rule**: MUST use `@import "tailwindcss"` syntax (Tailwind v4), not `@tailwind` directives.

**Why**: The project uses Tailwind CSS v4 (confirmed via `@tailwindcss/vite` plugin in `vite.config.ts`). Tailwind v4 dropped `@tailwind base/components/utilities` in favor of a single `@import "tailwindcss"`.

**Actionable check**: The `index.css` must start with `@import "tailwindcss"`. If the project had Tailwind v3, it would use `@tailwind base; @tailwind components; @tailwind utilities;`.

**Validation**: ✅ `frontend/src/index.css` starts with `@import "tailwindcss";`

---

### R30 — Loading state with Skeleton fallback

**Rule**: MUST add `loading?: boolean` prop to every dashboard component and render `<Skeleton>` fallback when loading is true.

**Why**: `App.tsx` calls `fetchFinancialData()` in a `useEffect` — there's a period where data is null and `loading` is true. Without Skeleton fallbacks, the user sees a blank page or partially-rendered layout.

**Actionable check**: Every component that accepts `loading?: boolean` must check it and return `<Skeleton>` placeholders before attempting to render data. The skeleton should approximate the component's dimensions.

**Validation**: ✅ All dashboard components implement this:
- `KPIRow` passes `loading` to `KPICard`
- `KPICard` renders `<Skeleton>` for label, value, helperText
- `IncomeOutcomeChart` renders `<Skeleton className="h-[280px]">`
- `ProfitPercentChart` renders `<Skeleton className="h-[280px]">`

---

### R31 — Keep formatters in financial-utils.ts

**Rule**: SHOULD keep `formatCurrency()` and `formatPercent()` isolated in `financial-utils.ts`, not embedded in components.

**Why**: Formatters are reused across multiple components (`KPIRow`, `IncomeOutcomeChart`). Embedding formatting logic in components duplicates code and makes it harder to change formatting locale or style.

**Actionable check**: If you need a new display format (e.g., `formatCompactNumber` for thousands with "K"), add it to `financial-utils.ts` and import it where needed.

**Validation**: ✅ `formatCurrency()` is used by `KPIRow` (via `formatCurrency(metrics.totalIncome)`) and `IncomeOutcomeChart` (in `CustomTooltip`). `formatPercent()` is used by `KPIRow`. Both are in `financial-utils.ts`, not duplicated in components.

---

### R32 — Prefer Recharts built-in tooltips

**Rule**: SHOULD use Recharts' built-in tooltip instead of inline `CustomTooltip` components unless custom behavior is required.

**Why**: Both `IncomeOutcomeChart` and `ProfitPercentChart` define custom `CustomTooltip` components inline. Recharts' default `<Tooltip />` already renders formatted values with a hover effect. Custom tooltips are only justified when the default doesn't meet design requirements.

**Actionable check**: Before creating a custom tooltip, check if `defaultTooltip` (or `<Tooltip />` with `contentStyle` props) covers the use case.

**Validation**: ✅ Inline `CustomTooltip` components exist in both `IncomeOutcomeChart.tsx` and `ProfitPercentChart.tsx`. These are valid because they add branding (rounded corners, bg-card styling, custom color dots) that the default tooltip doesn't support. Flagged as "monitor for future simplification."

---

### R33 — Use Lucide icons for consistent iconography

**Rule**: MUST use Lucide icons for consistent iconography (as used in `kpi-row.tsx`, `dashboard-header.tsx`, `kpi-card.tsx`).

**Why**: The project uses `lucide-react` package. Mixing icon libraries (e.g., FontAwesome, Heroicons) would create visual inconsistency and bloat the bundle.

**Actionable check**: Import from `lucide-react`:
```tsx
import { TrendingUp, TrendingDown, DollarSign, BarChart2, LayoutDashboard } from 'lucide-react'
```
For icons not available in Lucide, consider using inline SVGs or adding a custom Lucide icon.

**Validation**: ✅ All icons in dashboard components come from `lucide-react`:
- `kpi-row.tsx`: `TrendingUp`, `TrendingDown`, `DollarSign`, `BarChart2`
- `dashboard-header.tsx`: `LayoutDashboard`
- `kpi-card.tsx`: `LucideIcon` type used generically

---

### R34 — Add retry/caching to data fetching

**Rule**: SHOULD add retry logic and/or caching to the `useEffect` data fetching in `App.tsx` — no re-fetch on every re-mount.

**Why**: Currently `App.tsx` fetches once on mount with no retry. If the backend is slow to start (common with Docker), the fetch fails and shows an error. React Strict Mode double-mounts in dev, causing two fetches.

**Actionable check**: Wrap the fetch in a retry utility or use a caching layer:

```tsx
// Pattern: retry up to 3 times
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url)
    if (response.ok) return response
    await new Promise(r => setTimeout(r, 1000 * (i + 1)))
  }
  throw new Error(`Failed after ${retries} retries`)
}
```

**Validation**: ✅ Current `App.tsx` has no retry/cache. Flagged for future improvement.

---

### R35 — Derive period from actual data range

**Rule**: SHOULD derive `period` from actual data range instead of hardcoding `"2024 - Full Year"` in `<DashboardHeader>`.

**Why**: The hardcoded string `period="2024 - Full Year"` in `App.tsx` will be incorrect if the data generation logic changes or when the app is run in a different year. The actual date range is available from the facets endpoint.

**Actionable check**: Instead of hardcoding, compute the period from the fetched movements:

```tsx
function derivePeriod(movements: FinancialMovement[]): string {
  if (movements.length === 0) return 'No data'
  const dates = movements.map(m => new Date(m.create_date))
  const min = new Date(Math.min(...dates.map(d => d.getTime())))
  const max = new Date(Math.max(...dates.map(d => d.getTime())))
  const year = min.getFullYear()
  const isFullYear = min.getMonth() === 0 && max.getMonth() === 11
  return isFullYear ? `${year} - Full Year` : `${year} (partial)`
}
```

**Validation**: ✅ (Task performed) Fixed the hardcoded period in `App.tsx` — `period` is now derived from the actual data range of fetched movements via `derivePeriod()`, replacing `period="2024 - Full Year"`. The function checks if the data spans Jan-Dec (full year) or a partial range.