import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver since JSDOM doesn't support it
// recharts ResponsiveContainer depends on it
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};