// API response types for the 3 features.
// Derived from specs/api-exploration/api-endpoints-compact.md.
// All fields required unless noted.

/** Response from GET /api/metrics/facets. Used by Feature 1 & 3. */
export interface FacetsResponse {
  operation_types: Array<"income" | "outcome">;
  business_types: Array<"B2B" | "B2C">;
  categories: Array<
    "suppliers" | "sales" | "operational" | "administrative" | "others"
  >;
  /** Earliest date in dataset. Format: "YYYY-MM-DD" */
  min_date: string;
  /** Latest date in dataset. Format: "YYYY-MM-DD" */
  max_date: string;
}

/** Single alert entry from GET /api/metrics/alerts. Used by Feature 2. */
export interface AlertEntry {
  /** Period label, e.g. "2024-07" for month grouping */
  period: string;
  /** Total outcome (spending) in that period */
  outcome_total: number;
  /** Average of all prior periods' outcomes */
  baseline_average: number;
  /** (outcome_total - baseline_average) / baseline_average */
  increase_ratio: number;
}

/** Alerts response. Empty array → no anomalies detected. */
export type AlertResponse = AlertEntry[];

/** Single top-category item from GET /api/metrics/categories/top. Used by Feature 3. */
export interface CategoryEntry {
  category:
    | "suppliers"
    | "sales"
    | "operational"
    | "administrative"
    | "others";
  operation_type: "income" | "outcome";
  /** Total monetary amount for this category */
  total_amount: number;
}

/** Top categories response. Used per business type (B2B / B2C). */
export type TopCategoriesResponse = CategoryEntry[];