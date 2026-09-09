# ♿ Accessibility Audit: Financial Dashboard

**Skill used:** `.agents/skills/accessibility/SKILL.md`  
**References:** `references/WCAG.md`, `references/A11Y-PATTERNS.md`  
**Date:** 2026-09-09  
**Scope:** All frontend source files (14 files)

---

## WCAG POUR Principles

| Principle | Description |
|-----------|-------------|
| **P**erceivable | Content can be perceived through different senses |
| **O**perable | Interface can be operated by all users |
| **U**nderstandable | Content and interface are understandable |
| **R**obust | Content works with assistive technologies |

---

## Conformance Target: WCAG 2.2 Level AA

| Level | Requirement | Target |
|-------|-------------|--------|
| **A** | Minimum accessibility | Must pass |
| **AA** | Standard compliance | Should pass (legal requirement in many jurisdictions) |
| **AAA** | Enhanced accessibility | Nice to have |

---

## Critical Issues (Level A — must fix)

### 1. 🔴 Generic page title — WCAG 2.4.2 (A)

**File:** `frontend/index.html` (line 6)  

```html
<title>frontend</title>
```

**Problem:** Screen readers announce "frontend" as the page title — the very first thing a user hears. This provides no context about the application.

**Proposed Fix:** Change to a descriptive title.

```html
<title>Financial Dashboard</title>
```

---

### 2. 🔴 Decorative icon not hidden from screen readers — WCAG 1.1.1 (A)

**File:** `frontend/src/components/dashboard/dashboard-header.tsx` (lines 12–13)

```tsx
<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
  <LayoutDashboard size={18} />
</span>
```

**Problem:** The `LayoutDashboard` icon is purely decorative (the heading "Financial Overview" already conveys the purpose), but it renders as an inline SVG that assistive technology may try to interpret as meaningful content.

**Proposed Fix (per SKILL.md — Text alternatives / Icon buttons):** Add `aria-hidden="true"` to the icon element.

```tsx
<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
  <LayoutDashboard size={18} aria-hidden="true" />
</span>
```

---

### 3. 🔴 Error message not announced to screen readers — WCAG 3.3.1 (A)

**File:** `frontend/src/App.tsx` (lines 57–61)

```tsx
<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
  {error}
</div>
```

**Problem:** The error condition renders dynamically when the API call fails, but the element has no `role="alert"` or `aria-live` region. Screen readers in virtual cursor mode will not automatically announce the error.

**Proposed Fix (per A11Y-PATTERNS.md — Error handling):** Add `role="alert"`.

```tsx
<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
  {error}
</div>
```

---

### 4. 🔴 Chart titles are `<div>` elements, not headings — WCAG 4.1.2 (A), 2.4.6 (AA)

**File:** `frontend/src/components/ui/card.tsx` (lines 30–34)

```tsx
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />
  )
}
```

**File:** Used in `income-outcome-chart.tsx` (line ~60) and `profit-percent-chart.tsx` (line ~52):

```tsx
<CardTitle className="text-base font-semibold">Income vs. Outcome</CardTitle>
<CardTitle className="text-base font-semibold">Profit Margin %</CardTitle>
```

**Problem:** `CardTitle` renders as a plain `<div>`. Screen readers navigating by headings won't find these titles. This breaks the heading outline: there is an `<h1>` ("Financial Overview") in the header, but the chart titles are not headings, leaving users without a way to jump between sections.

**Proposed Fix:** Render `CardTitle` as `<h2>` or `<h3>` to establish a proper heading outline (`H1 → H2`):

```tsx
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <h2 data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />
  )
}
```

(Or use `<h3>` if the card can appear nested within another section heading.)

---

### 5. 🔴 Missing skip link — WCAG 2.4.1 (A)

**File:** `frontend/src/App.tsx`

**Problem:** Keyboard users tabbing through the page must traverse all navigation chrome before reaching the main content. There is no mechanism to bypass blocks of repetitive content.

**Proposed Fix (per A11Y-PATTERNS.md — Skip link):** Add a skip link before `<main>` that targets the main content:

```tsx
<main className="dark min-h-screen bg-background text-foreground">
  <a href="#main-content" className="skip-link">Skip to main content</a>
  <div id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" tabIndex={-1}>
```

With accompanying CSS in `index.css`:

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
```

---

## Serious Issues (Level AA — should fix)

### 6. 🟠 Color contrast: muted-foreground may fail — WCAG 1.4.3 (AA), 1.4.11 (AA)

**File:** `frontend/src/index.css`

```css
--muted-foreground: oklch(0.5 0.01 240);     /* Light mode */
```

**Problem:** `muted-foreground` (L=0.5) on `background` (L=0.97) is used for:
- Header subtitle: "Executive metrics dashboard" (12px)
- KPI card labels: "Total Income", "Total Outcome", "Profit", "Profit Margin" (small, uppercase)
- KPI helper text: "Cumulative revenue from all income movements", etc. (12px)
- Chart axis tick labels (11–12px)

All of these are **normal-size text** (<18px / <14px bold), requiring **4.5:1 minimum** contrast ratio (WCAG 1.4.3 AA). An OKLCH L of 0.5 on L 0.97 may produce a contrast ratio near 4:1, which is below the threshold. The exact ratio depends on the OKLCH→sRGB conversion.

Additionally, chart lines (`--chart-income: oklch(0.55 0.2 255)`) against `--card: oklch(1 0 0)` need **3:1 minimum** for non-text contrast (WCAG 1.4.11 AA). Light chart lines on a white card background may be borderline.

**Proposed Fix:** Tune OKLCH values against verified contrast checkers. Darken `muted-foreground` to at least `oklch(0.42 0.01 240)` and verify chart stroke colors produce ≥3:1.

---

### 7. 🟠 Chart tooltips are mouse-only — WCAG 2.1.1 (A)

**Files:** `frontend/src/components/dashboard/income-outcome-chart.tsx`, `profit-percent-chart.tsx`

**Problem:** Recharts tooltips (`<Tooltip content={<CustomTooltip />} />`) activate on mouse hover only. Keyboard users cannot access individual data point values. Assistive technology users receive only a visual-only interaction.

**Proposed Fix (per SKILL.md — Keyboard accessible):** Provide a **screen-reader-only data table** alongside each chart containing the full monthly data. This gives all users access to the underlying data.

```tsx
<div className="sr-only" role="table" aria-label="Monthly financial data">
  <div role="rowgroup">
    {data.map((d) => (
      <div role="row" key={d.month}>
        <span role="cell">{d.month}</span>
        <span role="cell">{formatCurrency(d.income)} income</span>
        <span role="cell">{formatCurrency(d.outcome)} outcome</span>
      </div>
    ))}
  </div>
</div>
```

The `sr-only` utility class (from Tailwind) visually hides the table while keeping it accessible to screen readers.

---

### 8. 🟠 Loading state not announced to screen readers — WCAG 4.1.3 (AA)

**Files:** `kpi-row.tsx`, `income-outcome-chart.tsx`, `profit-percent-chart.tsx`

**Problem:** All components show `Skeleton` loaders during the data fetch phase, but screen readers receive no notification that content is loading or has finished loading. A silent spinner is invisible to assistive technology.

**Proposed Fix (per WCAG.md — Live regions):** Add an `aria-live="polite"` region in `App.tsx` that announces state transitions:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {loading ? "Loading dashboard data…" : "Dashboard loaded"}
</div>
```

---

### 9. 🟠 "No data" empty states not announced — WCAG 4.1.3 (AA)

**Files:** `income-outcome-chart.tsx` (line ~74), `profit-percent-chart.tsx` (line ~65)

```tsx
<div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
  No data available to display
</div>
```

**Problem:** This message is rendered as a plain `<div>`. Screen readers in virtual cursor mode may skip it, leaving the user unaware that the chart area is empty.

**Proposed Fix (per WCAG.md — Live regions / Status):** Add `role="status"` to make it a live region:

```tsx
<div role="status" className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
  No data available to display
</div>
```

---

### 10. 🟠 Focus indicator may be insufficient — WCAG 2.4.7 (AA)

**File:** `frontend/src/index.css`

```css
* {
  @apply border-border outline-ring/50;
}
```

**Problem:** The `outline-ring/50` applies a ring at 50% opacity. On many backgrounds this results in a faint, hard-to-see focus ring. Keyboard-only users rely on a strong visible focus indicator to navigate.

**Proposed Fix (per SKILL.md — Focus visible):** Add explicit `:focus-visible` rule:

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

---

### 11. 🟠 No scroll-margin for focused elements — WCAG 2.4.11 (AA)

**File:** `frontend/src/App.tsx` / `index.css`

**Problem:** If the dashboard viewport scrolls and no sticky header exists, this is low risk. However, if future changes add a sticky navigation bar, focused elements could become obscured behind it — violating WCAG 2.4.11 (Focus Not Obscured).

**Proposed Fix (per SKILL.md — Focus not obscured):** Add scroll-margin to sections:

```css
section:focus {
  scroll-margin-top: 80px;
}
```

---

## Moderate Issues (AAA / nice to have)

### 12. 🟡 Charts lack data text alternatives — WCAG 1.1.1 (A, enhanced)

**Files:** `income-outcome-chart.tsx`, `profit-percent-chart.tsx`

**Problem:** The SVG charts rendered by Recharts are non-text content without meaningful text alternatives. A screen reader user perceives only "graphic" without understanding what it represents.

**Proposed Fix:** Add `role="img"` and `aria-label` to the chart container, plus a screen-reader-only data table (see issue #7):

```tsx
<ResponsiveContainer width="100%" height={280} role="img" aria-label="Line chart showing income versus outcome by month">
```

---

### 13. 🟡 Icon-only badge icons need aria-hidden — WCAG 1.1.1 (A)

**File:** `frontend/src/components/dashboard/kpi-card.tsx` (line ~49)

```tsx
<span className={cn('p-1.5 rounded-lg', styles.badge)}>
  <Icon size={16} className={styles.icon} />
</span>
```

**Problem:** The `TrendingUp`, `TrendingDown`, `DollarSign`, and `BarChart2` icons in KPI cards are decorative embellishments next to already descriptive text labels ("Total Income", "Total Outcome", etc.). They should not be exposed to assistive technology.

**Proposed Fix:** Add `aria-hidden="true"` to the icon:

```tsx
<Icon size={16} className={styles.icon} aria-hidden="true" />
```

---

### 14. 🟡 Reduced motion preference not respected — WCAG 2.3.3 (AAA)

**File:** `frontend/src/index.css`

**Problem:** The `Skeleton` component uses `animate-pulse` (a CSS animation). No `prefers-reduced-motion` media query exists, so users who experience motion sensitivity or have `prefers-reduced-motion: reduce` set in their OS will still see the pulsing animation.

**Proposed Fix (per SKILL.md — Motion):**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Checklist

For each fix, verify with:

- [ ] **Keyboard navigation:** Tab through entire page, use Enter/Space to activate
- [ ] **Screen reader:** Test with VoiceOver (Mac) or NVDA (Windows)
- [ ] **Zoom:** Content usable at 200% zoom
- [ ] **High contrast:** Test with browser high-contrast mode
- [ ] **Reduced motion:** Test with `prefers-reduced-motion: reduce`
- [ ] **Focus order:** Logical and follows visual order
- [ ] **Target size:** Interactive elements meet 24×24px minimum (WCAG 2.5.8)

---

## Summary

| # | Priority | WCAG Criterion | Level | Issue | File(s) |
|---|----------|----------------|-------|-------|---------|
| 1 | 🔴 Critical | 2.4.2 (A) | A | Generic `<title>` | `index.html` |
| 2 | 🔴 Critical | 1.1.1 (A) | A | Decorative icon not hidden | `dashboard-header.tsx` |
| 3 | 🔴 Critical | 3.3.1 (A) | A | Error not announced | `App.tsx` |
| 4 | 🔴 Critical | 4.1.2 (A) | A | Chart titles as `<div>` | `card.tsx` |
| 5 | 🔴 Critical | 2.4.1 (A) | A | No skip link | `App.tsx`, `index.css` |
| 6 | 🟠 Serious | 1.4.3 (AA) | AA | Contrast: muted-foreground | `index.css` |
| 7 | 🟠 Serious | 2.1.1 (A) | A | Tooltips mouse-only | Both chart files |
| 8 | 🟠 Serious | 4.1.3 (AA) | AA | Loading not announced | All components |
| 9 | 🟠 Serious | 4.1.3 (AA) | AA | "No data" not announced | Both chart files |
| 10 | 🟠 Serious | 2.4.7 (AA) | AA | Weak focus indicator | `index.css` |
| 11 | 🟠 Serious | 2.4.11 (AA) | AA | No scroll-margin | `App.tsx` / `index.css` |
| 12 | 🟡 Moderate | 1.1.1 (A) | A | Chart data alt text | Both chart files |
| 13 | 🟡 Moderate | 1.1.1 (A) | A | KPI icon decorations not hidden | `kpi-card.tsx` |
| 14 | 🟡 Moderate | 2.3.3 (AAA) | AAA | No prefers-reduced-motion | `index.css` |

---

## References

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Deque axe Rules](https://dequeuniversity.com/rules/axe/)
- [Accessibility code patterns](.agents/skills/accessibility/references/A11Y-PATTERNS.md)
- [WCAG criteria reference](.agents/skills/accessibility/references/WCAG.md)