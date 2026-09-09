# Feature Specification: Date Range Filter on Home Dashboard

**Feature Branch**: `01-date-range-filter`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Add two date inputs to the top of the home dashboard — a start date and an end date — that filter all the data currently displayed on the page. Dates are sent to the API in `YYYY-MM-DD` format. Both inputs are optional; when empty, the dashboard shows all available data. The available date range (earliest and latest dates in the dataset) must be shown near the inputs as a reference so the user knows what range is valid."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Apply a date range and see filtered dashboard data (Priority: P1)

A finance user wants to focus on a specific period (e.g., Q1 of a year) so they can analyze performance without distraction from data outside that period. They enter a start and end date, click "Apply", and all visible metrics update to reflect only the selected range.

**Why this priority**: This is the primary value of the feature — filtering the dashboard by date range is the core capability requested.

**Independent Test**: Can be fully tested by entering a valid start/end date, clicking Apply, and verifying that the KPI cards and charts reflect only movements within that range. The available range label confirms the global dataset boundaries.

**Acceptance Scenarios**:

1. **Given** the dashboard has loaded with full data, **When** the user enters `start_date=2024-01-01` and `end_date=2024-06-30` and clicks "Apply", **Then** the system fetches `GET /api/metrics?start_date=2024-01-01&end_date=2024-06-30` and all four KPI cards and both charts show values computed only from movements within that date range.
2. **Given** a date-filtered view is active, **When** the user changes the dates and clicks "Apply" again, **Then** the system re-fetches with the new parameters and the dashboard updates accordingly.
3. **Given** the user has applied a date filter, **When** the page is reloaded, **Then** the filter resets to empty (no persistence) and the full dataset is loaded.

---

### User Story 2 — See the available reference date range (Priority: P2)

A finance user needs to know what dates are available in the dataset so they can choose a valid filter range. A label near the date inputs shows the earliest and latest dates available.

**Why this priority**: This is a supporting feature — it helps users make informed choices but is not required for filtering to work.

**Independent Test**: Can be tested by loading the dashboard and verifying that a label reading "Available range: {min_date} to {max_date}" appears below the date inputs, populated from the `/api/metrics/facets` response.

**Acceptance Scenarios**:

1. **Given** the dashboard is loading for the first time, **When** the facets request completes, **Then** the label "Available range: {min_date} to {max_date}" is displayed beneath the date inputs using values from `GET /api/metrics/facets`.
2. **Given** the facets request fails (network error), **When** the dashboard finishes loading, **Then** the label reads "Could not load available date range" and the date inputs remain usable for filtering.

---

### User Story 3 — Inverted date range shows error without losing existing data (Priority: P3)

A finance user accidentally enters a start date after the end date. The system must prevent this invalid state from replacing the current view, showing a clear error message instead.

**Why this priority**: This is error-handling — important for usability but not part of the happy path.

**Independent Test**: Can be tested by entering `start_date=2024-12-01` and `end_date=2024-01-01`, clicking Apply, and verifying that the existing dashboard data is preserved and an inline error message is displayed.

**Acceptance Scenarios**:

1. **Given** the dashboard shows data for a valid range, **When** the user enters an inverted range (`start_date > end_date`) and clicks "Apply", **Then** the system shows an inline error "Start date must be before end date" and the displayed data remains unchanged from the previous valid state.
2. **Given** an inverted date error is displayed, **When** the user corrects the dates to a valid range and clicks "Apply", **Then** the error clears and the dashboard updates to reflect the corrected filter.

---

### User Story 4 — Clear the date filter to see all data (Priority: P3)

A finance user wants to return to the full unfiltered view after exploring a specific period. They clear both date inputs and click "Apply", and the full dataset is restored.

**Why this priority**: While essential for UX flow, the feature already works without this — clearing inputs defaults to the full dataset via the same mechanism as initial load.

**Independent Test**: Can be tested by applying a filter, then clearing both date inputs, clicking Apply, and verifying that `GET /api/metrics` is called without `start_date`/`end_date` params and the dashboard shows the full dataset.

**Acceptance Scenarios**:

1. **Given** a date filter is active, **When** the user clears both date inputs and clicks "Apply", **Then** the system fetches `GET /api/metrics` (no date params) and the dashboard returns to the full unfiltered state.

---

### Edge Cases

- What happens when the filtered dataset is empty (API returns `[]`)? — Each KPI card shows "No data for selected range" and charts show an empty state.
- What happens when only one date input is filled? — The system sends only the filled parameter; the API applies a unilateral bound (all data from `start_date` onward, or all data up to `end_date`).
- What happens when `start_date` equals `end_date`? — The API returns data for that single day. This is a valid filter.
- What happens on network error during a filter fetch? — The existing error banner is shown; the previous data remains displayed.
- What happens on rapid consecutive "Apply" clicks? — Each click triggers a new fetch; the most recent response replaces earlier ones (no queuing required).

## Requirements *(mandatory)*

Requirements are expressed using three statement types:

- **Behavior (B)** — An observable action or outcome the system performs.
- **Contract (C)** — Defines expected inputs, outputs, interactions, and error handling between actors or system interfaces.
- **Invariant (I)** — A condition that must always remain true, regardless of which operation or execution path occurs.

### Functional Requirements

- **B-001**: System MUST fetch `GET /api/metrics/facets` on page mount to retrieve `min_date` and `max_date` and display them as "Available range: {min_date} to {max_date}" near the date inputs.
- **B-002**: System MUST render two `<input type="date">` fields labeled "Start Date" and "End Date" at the top of the dashboard, positioned below the dashboard header and above the KPI cards row.
- **B-003**: System MUST render an "Apply" button adjacent to the date inputs that, when clicked, triggers a fetch of `GET /api/metrics` with the current `start_date` and `end_date` values as query parameters.
- **B-004**: System MUST recompute all four KPI cards (totalIncome, totalOutcome, profit, profitPercent) and both charts (income/outcome line, profit percentage line) via `computeKPIs()` and `computeMonthlyData()` from the filtered `FinancialMovement[]` returned by the API.
- **B-005**: System MUST compute and display the period badge (e.g., "2024 - Full Year" or "2024 - 2025") from the filtered movements after each successful fetch.
- **B-006**: On HTTP 422 from the API (inverted dates: `start_date > end_date`), system MUST display an inline error message "Start date must be before end date" and MUST NOT replace the currently displayed data.
- **B-007**: On network error during a facets fetch, system MUST display "Could not load available date range" but MUST keep the date inputs functional for filtering.
- **B-008**: On network error during a metrics fetch, system MUST display the existing error banner and MUST NOT replace the currently displayed data.
- **B-009**: When the API returns an empty array `[]` after filtering, system MUST display "No data for selected range" on the affected KPI cards and charts.

- **C-001**: `GET /api/metrics/facets` (no query parameters) → HTTP 200 returns `MetricsFacets` with fields: `operation_types: string[]`, `business_types: string[]`, `categories: string[]`, `min_date: string (YYYY-MM-DD)`, `max_date: string (YYYY-MM-DD)`. This endpoint has no parameters and always returns global facets.
- **C-002**: `GET /api/metrics?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}` → HTTP 200 returns `FinancialMovement[]`. Both `start_date` and `end_date` are optional query parameters. When omitted, the full dataset is returned.
- **C-003**: `GET /api/metrics?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}` → HTTP 422 returns `{"detail": [{"loc": ["query", "start_date"], "msg": "start_date (...) must be before or equal to end_date (...)", "type": "value_error"}]}` when `start_date > end_date`.
- **C-004**: Frontend MUST send all date values to the API in `YYYY-MM-DD` format, matching the `<input type="date">` value format natively.
- **C-005**: Frontend state MUST distinguish between raw input values (`startDate: string`, `endDate: string`) and applied values (`appliedStartDate: string | null`, `appliedEndDate: string | null`). Raw inputs update on keystroke; applied values update only on "Apply" click and are used in the API call.

- **I-001**: Both date inputs MUST always be optional. When either or both are empty, the corresponding query parameter(s) MUST be omitted from the API call.
- **I-002**: When an HTTP 422 error occurs (inverted dates), the currently displayed dashboard data MUST remain unchanged.
- **I-003**: The available date range (`min_date`, `max_date`) MUST be fetched exactly once on page mount. It MUST NOT be re-fetched when the date filter is applied or changed.
- **I-004**: The `GET /api/metrics` endpoint response MUST continue to be processed by the existing client-side aggregation functions `computeKPIs()` and `computeMonthlyData()`. No server-side aggregation is introduced for Feature 1.
- **I-005**: The date range filter is scoped to the current page session only. Filter state MUST NOT persist across page reloads or navigation.
- **I-006**: The date range filter values MUST be propagated to Feature 2 (anomaly alerts) — the same `start_date`/`end_date` values used for `/api/metrics` MUST be passed to `GET /api/metrics/alerts` when both features are active.

### Key Entities

- **DateRangeFilter**: A UI component containing two `<input type="date">` elements, an "Apply" button, an available-range reference label, and an inline error message area. Receives `availableMinDate`, `availableMaxDate`, `onApply(startDate, endDate)`, and `dateError` as props. Does not own the API-fetching logic — delegates that to the parent via the `onApply` callback.
- **MetricsFacets**: A data entity representing the global facets of the financial dataset. Contains `min_date` and `max_date` which define the full temporal extent of the data. Fetched once on mount from `GET /api/metrics/facets`.
- **AppliedFilter**: A state entity representing the currently active date range filter. Contains `appliedStartDate: string | null` and `appliedEndDate: string | null`. Updated only when the user clicks "Apply" and the request succeeds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two `<input type="date">` fields and an "Apply" button are rendered between the dashboard header and the KPI cards row on page load.
- **SC-002**: An available-range reference label appears below the date inputs within 2 seconds of page load, populated from `GET /api/metrics/facets`.
- **SC-003**: Entering a valid date range and clicking "Apply" results in updated KPI values and chart data within 3 seconds (over API + client-side computation).
- **SC-004**: Entering an inverted date range (`start_date > end_date`) and clicking "Apply" shows the inline error message "Start date must be before end date" and does not modify the currently displayed data.
- **SC-005**: Clearing both date inputs and clicking "Apply" restores the full unfiltered dashboard dataset.
- **SC-006**: Filtering to a date range with no matching data results in all KPI cards and charts displaying an empty-state message ("No data for selected range").
- **SC-007**: The facets endpoint is called exactly once per page load; the metrics endpoint is called once on mount and once per valid "Apply" click.
- **SC-008**: Filter state is not persisted — reloading the page resets to the full unfiltered view.

## Assumptions

- The frontend uses `<input type="date">` native browser date pickers — no third-party date-picker library is required.
- The existing `computeKPIs()` and `computeMonthlyData()` functions in `frontend/src/lib/financial-utils.ts` handle empty arrays gracefully (returning zero-value KPIs and empty chart data respectively).
- The existing `derivePeriod()` function in `App.tsx` handles empty arrays gracefully (returning "No data").
- An "Apply" button is sufficient for triggering the filter — live/debounced filtering on keystroke is explicitly out of scope.
- The `GET /api/metrics/facets` endpoint response is stable and will not change shape between versions.
- No backend changes are required — the existing endpoints already support `start_date` and `end_date` query parameters.
- The API base URL is configured via `VITE_API_BASE_URL` environment variable (already used in existing code).
- The date range filter component will be tested in isolation with unit tests and as part of the dashboard with integration tests.