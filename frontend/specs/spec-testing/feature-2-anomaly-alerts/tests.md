# Feature 2 — Anomaly Alerts Table — Tests

## Backend Tests (to add to `backend/tests/test_routes.py`)

### Test: Default threshold returns alerts (existing — extended)
```python
def test_metrics_alerts_default_threshold():
    """Default threshold 0.3 should return alerts for monthly data."""
    response = client.get("/api/metrics/alerts")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    # With default threshold 0.3 and month group_by, there may or may not be alerts
    # but the response must always be a valid list
```

### Test: Alerts endpoint respects start_date and end_date
```python
def test_metrics_alerts_respects_date_range():
    """Alerts must respect start_date and end_date filters."""
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.0, "group_by": "month", "start_date": "2024-07-01", "end_date": "2024-07-31"},
    )
    assert response.status_code == 200
    payload = response.json()
    if payload:
        for item in payload:
            # Periods should be "2024-07" only since we limited to July
            assert "2024-07" in item["period"]
```

### Test: Alerts with threshold 0.0 detects every period with increase
```python
def test_metrics_alerts_zero_threshold_detects_all_increases():
    """Zero threshold should flag any period where outcome exceeds the baseline."""
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.0, "group_by": "month"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    # Every alert should have increase_ratio >= 0
    for item in payload:
        assert item["increase_ratio"] >= 0
    # At least some periods should be flagged (since outcome varies month to month)
    assert len(payload) > 0
```

### Test: Alerts with threshold 1.0 returns empty (no spikes that large)
```python
def test_metrics_alerts_high_threshold_returns_empty():
    """Threshold of 1.0 (100% increase) should return no alerts for typical data."""
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 1.0, "group_by": "month"},
    )
    assert response.status_code == 200
    assert response.json() == []
```

### Test: Alerts returns correct shape
```python
def test_metrics_alerts_response_shape():
    """Each alert must have the four required fields."""
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.0, "group_by": "month"},
    )
    assert response.status_code == 200
    payload = response.json()
    if payload:
        item = payload[0]
        assert "period" in item
        assert "outcome_total" in item
        assert "baseline_average" in item
        assert "increase_ratio" in item
        assert isinstance(item["period"], str)
        assert isinstance(item["outcome_total"], (int, float))
        assert isinstance(item["baseline_average"], (int, float))
        assert isinstance(item["increase_ratio"], (int, float))
```

### Test: Alerts with date range that matches no data returns empty
```python
def test_metrics_alerts_no_data_in_range_returns_empty():
    """If no data exists in the given date range, the result should be an empty list."""
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.3, "start_date": "2030-01-01", "end_date": "2030-12-31"},
    )
    assert response.status_code == 200
    assert response.json() == []
```

---

## Frontend Component Tests (new file: `frontend/src/components/dashboard/anomaly-alerts-table.test.tsx`)

### Setup
```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnomalyAlertsTable } from "./anomaly-alerts-table";
```

### Test: Renders title and threshold input
```typescript
it("renders the title and threshold input", () => {
  render(<AnomalyAlertsTable startDate={null} endDate={null} />);
  expect(screen.getByText(/Anomaly Alerts/i)).toBeTruthy();
  expect(screen.getByLabelText(/Threshold/i)).toBeTruthy();
});
```

### Test: Threshold input defaults to 0.3
```typescript
it("threshold input defaults to 0.3", () => {
  render(<AnomalyAlertsTable startDate={null} endDate={null} />);
  const input = screen.getByLabelText(/Threshold/i) as HTMLInputElement;
  expect(input.value).toBe("0.3");
});
```

### Test: Apply button triggers fetch with threshold value
```typescript
it("applies threshold and fetches alerts on click", async () => {
  // Mock fetch to return empty
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

  render(<AnomalyAlertsTable startDate={null} endDate={null} />);
  const input = screen.getByLabelText(/Threshold/i);
  fireEvent.change(input, { target: { value: "0.5" } });
  fireEvent.click(screen.getByRole("button", { name: /Apply/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("threshold=0.5"),
    );
  });
});
```

### Test: Shows empty state when no alerts
```typescript
it("shows empty state message when no alerts", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

  render(<AnomalyAlertsTable startDate={null} endDate={null} />);

  await waitFor(() => {
    expect(screen.getByText(/No anomalies detected/i)).toBeTruthy();
  });
});
```

### Test: Shows loading skeleton initially
```typescript
it("shows loading skeleton while fetching", () => {
  // Return a promise that doesn't resolve immediately
  global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

  render(<AnomalyAlertsTable startDate={null} endDate={null} />);
  expect(screen.getByTestId("alerts-skeleton")).toBeTruthy();
});
```

### Test: Shows error state on API failure
```typescript
it("shows error message on API failure", async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

  render(<AnomalyAlertsTable startDate={null} endDate={null} />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load alerts/i)).toBeTruthy();
  });
});
```

### Test: Passes date range from Feature 1 to API
```typescript
it("passes start_date and end_date to the API when provided", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

  render(<AnomalyAlertsTable startDate="2024-06-01" endDate="2024-06-30" />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("start_date=2024-06-01"),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("end_date=2024-06-30"),
    );
  });
});
```

---

## Backend Unit Tests (new file: `backend/tests/test_anomaly_alerts.py`)

```python
"""Unit tests for anomaly alert detection logic."""
from app.routes import detect_outcome_alerts, MetricsSummaryItem


def test_detect_outcome_alerts_no_previous_periods():
    """With only one summary item, no alerts should fire (no baseline)."""
    summary = [MetricsSummaryItem(period="2024-01", income=1000, outcome=500, net=500)]
    alerts = detect_outcome_alerts(summary, 0.3)
    assert alerts == []


def test_detect_outcome_alerts_threshold_not_exceeded():
    """If outcome does not exceed threshold, no alerts."""
    summary = [
        MetricsSummaryItem(period="2024-01", income=1000, outcome=500, net=500),
        MetricsSummaryItem(period="2024-02", income=1000, outcome=550, net=450),  # 10% increase → below 0.3
    ]
    alerts = detect_outcome_alerts(summary, 0.3)
    assert alerts == []


def test_detect_outcome_alerts_threshold_exceeded():
    """If outcome exceeds threshold, an alert is generated."""
    summary = [
        MetricsSummaryItem(period="2024-01", income=1000, outcome=500, net=500),
        MetricsSummaryItem(period="2024-02", income=1000, outcome=800, net=200),  # 60% increase → above 0.3
    ]
    alerts = detect_outcome_alerts(summary, 0.3)
    assert len(alerts) == 1
    assert alerts[0].period == "2024-02"
    assert alerts[0].outcome_total == 800
    assert alerts[0].baseline_average == 500
    assert round(alerts[0].increase_ratio, 2) == 0.60


def test_detect_outcome_alerts_uses_all_historical():
    """Baseline is average of all previous periods, not just the last one."""
    summary = [
        MetricsSummaryItem(period="2024-01", income=1000, outcome=100, net=900),
        MetricsSummaryItem(period="2024-02", income=1000, outcome=100, net=900),
        MetricsSummaryItem(period="2024-03", income=1000, outcome=100, net=900),
        MetricsSummaryItem(period="2024-04", income=1000, outcome=300, net=700),  # avg baseline = 100, 200% increase
    ]
    alerts = detect_outcome_alerts(summary, 0.3)
    assert len(alerts) == 1
    assert alerts[0].period == "2024-04"
    assert alerts[0].baseline_average == 100.0
    assert round(alerts[0].increase_ratio, 2) == 2.0


def test_detect_outcome_alerts_baseline_zero_skipped():
    """If baseline average is 0, skip to avoid division by zero."""
    summary = [
        MetricsSummaryItem(period="2024-01", income=1000, outcome=0, net=1000),
        MetricsSummaryItem(period="2024-02", income=1000, outcome=100, net=900),
    ]
    alerts = detect_outcome_alerts(summary, 0.3)
    assert len(alerts) == 0
```