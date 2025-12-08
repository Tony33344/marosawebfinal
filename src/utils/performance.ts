/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals and other performance metrics
 */

import { isFeatureEnabled } from '../config/featureFlags';

// Core Web Vitals thresholds (in ms)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },  // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },    // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },   // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 },  // Time to First Byte
  FCP: { good: 1800, needsImprovement: 3000 },  // First Contentful Paint
  INP: { good: 200, needsImprovement: 500 }     // Interaction to Next Paint
};

type MetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';

interface PerformanceMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

/**
 * Get rating based on metric thresholds
 */
function getRating(name: MetricName, value: number): PerformanceMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics
 */
function reportMetric(metric: PerformanceMetric): void {
  if (!isFeatureEnabled('analytics_tracking')) return;

  console.debug(`[Performance] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);

  // Send to Google Analytics if available
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.rating,
      non_interaction: true
    });
  }
}

/**
 * Observe Largest Contentful Paint
 */
export function observeLCP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      
      if (lastEntry) {
        const value = lastEntry.startTime;
        reportMetric({
          name: 'LCP',
          value,
          rating: getRating('LCP', value)
        });
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.debug('[Performance] LCP observation not supported');
  }
}

/**
 * Observe First Input Delay
 */
export function observeFID(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
      
      if (firstEntry) {
        const value = firstEntry.processingStart - firstEntry.startTime;
        reportMetric({
          name: 'FID',
          value,
          rating: getRating('FID', value)
        });
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.debug('[Performance] FID observation not supported');
  }
}

/**
 * Observe Cumulative Layout Shift
 */
export function observeCLS(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  let clsValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          sessionEntries.push(entry);
        }
      }

      reportMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue)
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.debug('[Performance] CLS observation not supported');
  }
}

/**
 * Measure Time to First Byte
 */
export function measureTTFB(): void {
  if (typeof performance === 'undefined') return;

  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  
  if (navEntry) {
    const value = navEntry.responseStart - navEntry.requestStart;
    reportMetric({
      name: 'TTFB',
      value,
      rating: getRating('TTFB', value)
    });
  }
}

/**
 * Measure First Contentful Paint
 */
export function measureFCP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((entryList) => {
      const fcpEntry = entryList.getEntries().find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        const value = fcpEntry.startTime;
        reportMetric({
          name: 'FCP',
          value,
          rating: getRating('FCP', value)
        });
        observer.disconnect();
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.debug('[Performance] FCP observation not supported');
  }
}

/**
 * Initialize all performance observers
 */
export function initPerformanceMonitoring(): void {
  if (!isFeatureEnabled('analytics_tracking')) {
    console.debug('[Performance] Performance monitoring disabled');
    return;
  }

  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    startObservers();
  } else {
    window.addEventListener('load', startObservers);
  }
}

function startObservers(): void {
  observeLCP();
  observeFID();
  observeCLS();
  measureTTFB();
  measureFCP();
  
  console.debug('[Performance] Monitoring initialized');
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary(): Record<string, number | null> {
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const paintEntries = performance.getEntriesByType('paint');
  
  const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
  
  return {
    domContentLoaded: navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : null,
    loadComplete: navEntry ? navEntry.loadEventEnd - navEntry.startTime : null,
    firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || null,
    firstContentfulPaint: fcpEntry?.startTime || null,
    ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : null
  };
}
