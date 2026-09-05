# Spec-to-API Mismatches

## Feature 2 — Anomaly Alerts

| Aspect | Feature Wording | Actual API | Severity |
|--------|----------------|------------|----------|
| Baseline window | "Rolling average of the **previous 3 periods**" | Average of **ALL** historical periods — cumulative, not sliding | 🔴 High |
| Threshold range | `0.01` to `1.0` | `≥ 0` (no upper bound, zero returns everything as alert) | 🟡 Medium |
| Column label | "Percentage increase" | `increase_ratio` is a raw decimal — multiply by 100 for display | 🟡 Low |

## Feature 3 — B2B vs B2C Comparison

| Aspect | Feature Wording | Actual API | Severity |
|--------|----------------|------------|----------|
| Facet categories | "Available categories for each group come from facets endpoint" | `GET /api/metrics/facets` returns **one global list** — not per-group | 🟡 Medium |
| Comparison endpoint | Chart implies a single B2B-vs-B2C endpoint | No such endpoint exists. Must aggregate from `GET /api/metrics` client-side. Note: `GET /api/metrics/comparison` compares **periods**, not business types | 🟡 Medium |
| Percentage field | "Percentage of group total" as a column | `TopCategoryItem` lacks this field — must be computed client-side | 🟡 Low |

## Feature 1 — Date Range Filter

✅ No mismatches — all wording matches the actual API behavior.