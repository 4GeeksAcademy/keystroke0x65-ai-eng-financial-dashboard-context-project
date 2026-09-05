// Query parameter types for the 3 features.
// Derived from specs/api-exploration/api-endpoints-compact.md.
// All fields optional unless noted.

/** Query params for GET /api/metrics. Used by Feature 1 & 3. */
export interface DateRangeFilter {
  /** Inclusive lower bound. Format: "YYYY-MM-DD" */
  start_date?: string;
  /** Inclusive upper bound. Format: "YYYY-MM-DD" */
  end_date?: string;
}

/** Query params for GET /api/metrics/alerts. Used by Feature 2. */
export interface AlertsParams extends DateRangeFilter {
  /** Min increase ratio to trigger alert. Range: ≥ 0. Default: 0.3 */
  threshold?: number;
  /** Aggregation period. Default: "month" */
  group_by?: "day" | "week" | "month";
  /** Filter by business line */
  business_type?: "B2B" | "B2C";
}

/** Query params for GET /api/metrics/categories/top. Used by Feature 3. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Default: "outcome". Must be "income" for Feature 3. */
  operation_type?: "income" | "outcome";
  /** Top N categories. Range: 1–20. Default: 5. */
  limit?: number;
  /** Filter by business line */
  business_type?: "B2B" | "B2C";
}