# Tasks: Date Range Filter on Home Dashboard

**Input**: Design documents from `feature-1-date-range-filter/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories)

**Tests**: The spec explicitly requests that the date range filter component "will be tested in isolation with unit tests and as part of the dashboard with integration tests." Test tasks are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend paths**: `frontend/src/` for source, `frontend/src/` for component tests (Vitest)
- **Backend paths**: `backend/app/` for source, `backend/tests/` for tests
- All paths below assume the repository root as the working directory

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — no setup tasks needed. The Vite + React project already exists, all dependencies (React, Tailwind, Recharts, Vitest) are already configured, and the backend API already supports the required `start_date`/`end_date` query parameters.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and data structures that MUST exist before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Add `MetricsFacets` interface (with `min_date: string` and `max_date: string` fields) to `frontend/src/lib/financial-types.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Apply a date range and see filtered dashboard data (Priority: P1) 🎯 MVP

**Goal**: The user enters a start date and end date, clicks "Apply", and all dashboard metrics (KPI cards, charts, period badge) update to reflect only movements within that date range.

**Independent Test**: Open the dashboard, enter `2024-01-01` as start and `2024-06-30` as end, click Apply. Verify the KPI values and charts reflect only Q1–Q2 movements. Verify the API is called with `?start_date=2024-01-01&end_date=2024-06-30`.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T002 [P] [US1] Write unit tests for `DateRangeFilter` component rendering (date inputs, Apply button) in `frontend/src/components/dashboard/date-range-filter.test.tsx`
- [ ] T003 [P] [US1] Write unit tests for `DateRangeFilter` onApply callback invocation in `frontend/src/components/dashboard/date-range-filter.test.tsx`
- [ ] T004 [P] [US1] Write integration tests for applying a valid date range and verifying updated KPI values in `frontend/src/App.test.tsx`
- [ ] T005 [P] [US1] Write integration tests for re-applying a different date range in `frontend/src/App.test.tsx`

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create `DateRangeFilter` component with two `<input type="date">` fields (Start Date, End Date), an "Apply" button, and an empty-state error area in `frontend/src/components/dashboard/date-range-filter.tsx`
- [ ] T007 [P] [US1] Add `applyDateRange` state variables (`appliedStartDate`, `appliedEndDate`) and `rawStartDate`/`rawEndDate` input state to `frontend/src/App.tsx`
- [ ] T008 [P] [US1] Add helper function `buildMetricsUrl(startDate?: string, endDate?: string): string` that constructs the API URL with optional date params in `frontend/src/lib/financial-utils.ts`
- [ ] T009 [US1] Refactor `fetchFinancialData` in `frontend/src/App.tsx` to accept optional `start_date`/`end_date` parameters and pass them to the API
- [ ] T010 [US1] Wire `DateRangeFilter` into `App.tsx` between `DashboardHeader` and the error banner/KPIRow section, passing raw values, applied callback, and error state
- [ ] T011 [US1] Implement the `onApply` handler in `App.tsx` that: reads raw inputs, updates applied state, triggers re-fetch with date params, calls `computeKPIs()` and `computeMonthlyData()` on response, and updates period badge via `derivePeriod()`
- [ ] T012 [US1] Handle empty API response (`[]`) — ensure KPI cards show "No data for selected range" and charts show empty-state message

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Entering dates and clicking Apply updates the dashboard; clearing inputs resets to full data.

---

## Phase 4: User Story 2 — See the available reference date range (Priority: P2)

**Goal**: A label near the date inputs shows the earliest and latest dates available in the dataset, fetched once from `GET /api/metrics/facets` on page mount.

**Independent Test**: Load the dashboard and verify a label "Available range: 2024-01-05 to 2024-12-30" appears below the date inputs. If the network fails, verify "Could not load available date range" is shown instead.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T013 [P] [US2] Write unit tests for `DateRangeFilter` available-range label rendering in `frontend/src/components/dashboard/date-range-filter.test.tsx`
- [ ] T014 [P] [US2] Write unit tests for `DateRangeFilter` available-range error state fallback text in `frontend/src/components/dashboard/date-range-filter.test.tsx`
- [ ] T015 [P] [US2] Write integration tests for facets fetch on mount and range display in `frontend/src/App.test.tsx`
- [ ] T016 [P] [US2] Write integration tests for facets fetch failure (range label shows fallback) in `frontend/src/App.test.tsx`

### Implementation for User Story 2

- [ ] T017 [P] [US2] Add `fetchFacets` async function in `frontend/src/App.tsx` that calls `GET /api/metrics/facets` and returns `MetricsFacets`
- [ ] T018 [US2] Call `fetchFacets` on mount via `useEffect` and store `availableMinDate`/`availableMaxDate` in state
- [ ] T019 [US2] Update `DateRangeFilter` component to accept `availableMinDate?: string` and `availableMaxDate?: string` props and display "Available range: {min_date} to {max_date}" label below the inputs
- [ ] T020 [US2] Handle facets fetch failure — pass `availableRangeError: boolean` to `DateRangeFilter` and show "Could not load available date range" fallback text

**Checkpoint**: Both User Story 1 AND 2 should now work independently and together. The available range label appears below the date inputs on load.

---

## Phase 5: User Story 3 — Inverted date range shows error without losing existing data (Priority: P3)

**Goal**: When the user enters a start date after the end date and clicks Apply, the system shows "Start date must be before end date" inline without replacing the currently displayed data.

**Independent Test**: Load the dashboard with full data, enter `2024-12-01` as start and `2024-01-01` as end, click Apply. Verify the existing data stays visible and "Start date must be before end date" appears. Then correct the dates and verify the error clears and the data updates.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T021 [P] [US3] Write unit tests for `DateRangeFilter` inline error message display in `frontend/src/components/dashboard/date-range-filter.test.tsx`
- [ ] T022 [P] [US3] Write unit tests for `DateRangeFilter` error clearing on subsequent valid Apply in `frontend/src/components/dashboard/date-range-filter.test.tsx`
- [ ] T023 [P] [US3] Write integration tests for HTTP 422 error handling (error shown, data preserved) in `frontend/src/App.test.tsx`
- [ ] T024 [P] [US3] Write integration tests for error clearing on valid re-submit in `frontend/src/App.test.tsx`

### Implementation for User Story 3

- [ ] T025 [US3] Handle HTTP 422 response in `fetchFinancialData` or the `onApply` handler — catch the 422, extract error detail, set `dateError` state, and do NOT replace currently displayed metrics/chart data
- [ ] T026 [US3] Add `dateError?: string` prop to `DateRangeFilter` component and render "Start date must be before end date" inline error message when set
- [ ] T027 [US3] Clear `dateError` state on next successful (non-422) Apply click

**Checkpoint**: User Story 3 works independently. Invalid date ranges show an error without destroying the current view. Correcting dates clears the error.

---

## Phase 6: User Story 4 — Clear the date filter to see all data (Priority: P3)

**Goal**: The user clears both date inputs and clicks Apply; the full unfiltered dataset is restored.

**Independent Test**: Apply a filter, then clear both date inputs and click Apply. Verify `GET /api/metrics` is called without `start_date`/`end_date` params and the dashboard shows the full dataset.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T028 [P] [US4] Write integration tests for clearing both inputs, clicking Apply, and restoring full dataset in `frontend/src/App.test.tsx`
- [ ] T029 [P] [US4] Write integration tests for page reload resetting filter state (no persistence) in `frontend/src/App.test.tsx`

### Implementation for User Story 4

- [ ] T030 [US4] Ensure the `buildMetricsUrl` utility and `onApply` handler omit `start_date` and `end_date` query params when the corresponding inputs are empty (string `""` or `null`)

**Note**: This story's behavior is already largely implemented by the core Apply logic from US1 (which omits empty params). This phase mainly adds the dedicated test coverage and ensures the clearing UX flow works end-to-end.

**Checkpoint**: All four user stories are now independently functional. Filtering, range display, error handling, and clearing all work correctly.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, refinement, and validation that affect multiple user stories.

- [ ] T031 [P] Verify single-input filter behavior (only start_date OR only end_date sent to API — unilateral bound) in `frontend/src/App.test.tsx`
- [ ] T032 [P] Verify `start_date === end_date` (single-day filter) works in `frontend/src/App.test.tsx`
- [ ] T033 [P] Verify rapid consecutive Apply clicks — most recent response wins, no queuing issues in `frontend/src/App.test.tsx`
- [ ] T034 [P] Verify network error during filter fetch — existing data preserved, error banner shown in `frontend/src/App.test.tsx`
- [ ] T035 [P] Verify invariant I-003 — facets endpoint called exactly once (not re-fetched on Apply) in `frontend/src/App.test.tsx`
- [ ] T036 [P] Verify invariant I-005 — filter state not persisted across page reload in `frontend/src/App.test.tsx`
- [ ] T037 Run `quickstart.md` validation scenarios end-to-end
- [ ] T038 Run full test suite: `npm test` — all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 - Apply filter (Phase 3)**: Depends on Foundational — BLOCKS US2, US3, US4 (all depend on DateRangeFilter component and App.tsx state management)
- **User Story 2 - Reference range (Phase 4)**: Depends on US1 component and App.tsx integration — independently testable once component exists
- **User Story 3 - Error handling (Phase 5)**: Depends on US1 component and state management — independently testable once Apply flow works
- **User Story 4 - Clear filter (Phase 6)**: Depends on US1 Apply logic — largely covered by core implementation, focused on test coverage
- **Polish (Phase 7)**: Depends on all user stories being complete

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Models/Types before components
- Utilities before component integration
- Component before App.tsx wiring
- Core implementation before edge case handling
- Story complete before moving to next priority

### Parallel Opportunities

| Tasks | Why Parallel |
|-------|-------------|
| T002, T003, T004, T005 | Different test files, no mutual dependencies |
| T006, T007, T008 | Different files (component vs App.tsx vs utils), can be written simultaneously |
| T013, T014, T015, T016 | All test tasks — different files/test concerns |
| T017, T019, T020 | T017 (fetchFacets utility) is independent of component props in T019/T020 |
| T021, T022, T023, T024 | All test tasks — different files/test concerns |
| T028, T029 | Different test scenarios in same test file — can be written in parallel |
| T031 through T036 | All edge case tests — independent of each other |

---

## Parallel Example: User Story 1

```text
Day 1 (tests, in parallel):
  Developer A: T002, T003  — DateRangeFilter unit tests
  Developer B: T004, T005  — App integration tests

Day 2 (implementation, in parallel):
  Developer A: T006        — DateRangeFilter component
  Developer B: T007        — State variables in App.tsx
  Developer C: T008        — buildMetricsUrl utility

Day 3 (integration):
  Developer A: T009, T010  — Refactor fetchFinancialData + wire component
  Developer B: T011, T012  — onApply handler + empty state

Day 4 (test pass):
  All: Run tests, fix failures, ensure green
```

---

## Implementation Strategy

### MVP Scope: User Story 1 (Phase 3) only

The minimum viable product is US1 — date inputs, Apply button, and API filtering. This delivers the core value of the feature. US2 (reference range), US3 (error handling), and US4 (clear) are incremental enhancements that can be added in subsequent iterations.

### Recommended Delivery Order

1. **Phase 3 (US1) — MVP**: Date inputs + Apply + filtered dashboard data. Core value delivered.
2. **Phase 4 (US2) — Reference range**: Add facets label. Small, self-contained enhancement.
3. **Phase 5 (US3) — Error handling**: 422 error handling. Important UX polish.
4. **Phase 6 (US4) — Clear filter**: Clearing behavior (mostly already covered by US1 logic).
5. **Phase 7 — Polish**: Edge cases, verification.

### Invariant I-006 (Propagation to Feature 2)

The applied date range state (`appliedStartDate`, `appliedEndDate`) in `App.tsx` must be accessible for Feature 2 (anomaly alerts). When Feature 2 is implemented, these same state values will be passed to `GET /api/metrics/alerts`. Ensure the state variables are hoisted at the `App` component level (not buried inside `DateRangeFilter`) so future features can share the same filter values.

---

## Completion Checklist

- [ ] All 38 tasks completed across 7 phases
- [ ] All tasks follow the required checklist format: `- [ ] TXXX [P] [Story] Description with file path`
- [ ] Tests written first (RED), then implementation (GREEN), for each story
- [ ] Quickstart validation scenarios verified end-to-end
- [ ] Full test suite passes (`npm test`)