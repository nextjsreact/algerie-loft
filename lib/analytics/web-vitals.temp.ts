/**
 * Temporary Web Vitals - web-vitals package not installed
 */

// Temporary metric type
export interface Metric {
  name: string;
  value: number;
  id: string;
}

// Temporary functions that do nothing
export function onCLS(callback: (metric: Metric) => void) {
  // Disabled until web-vitals is installed
}

export function onFCP(callback: (metric: Metric) => void) {
  // Disabled until web-vitals is installed
}

export function onINP(callback: (metric: Metric) => void) {
  // Disabled until web-vitals is installed
}

export function onLCP(callback: (metric: Metric) => void) {
  // Disabled until web-vitals is installed
}

export function onTTFB(callback: (metric: Metric) => void) {
  // Disabled until web-vitals is installed
}