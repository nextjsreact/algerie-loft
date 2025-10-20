// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface LighthouseConfig {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

// Target scores for production
export const LIGHTHOUSE_TARGETS: LighthouseConfig = {
  performance: 95,
  accessibility: 100,
  bestPractices: 95,
  seo: 100,
  pwa: 90,
};

// Core Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
};

export function analyzePerformance(metrics: PerformanceMetrics): {
  score: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let totalScore = 0;
  let metricCount = 0;

  // Analyze each metric
  Object.entries(metrics).forEach(([key, value]) => {
    const threshold = WEB_VITALS_THRESHOLDS[key as keyof typeof WEB_VITALS_THRESHOLDS];
    if (threshold) {
      metricCount++;
      if (value <= threshold.good) {
        totalScore += 100;
      } else if (value <= threshold.poor) {
        totalScore += 50;
        recommendations.push(`Improve ${key.toUpperCase()}: Current ${value}ms, target <${threshold.good}ms`);
      } else {
        totalScore += 0;
        recommendations.push(`Critical ${key.toUpperCase()}: Current ${value}ms, must be <${threshold.poor}ms`);
      }
    }
  });

  return {
    score: Math.round(totalScore / metricCount),
    recommendations,
  };
}

// Performance optimization suggestions
export const OPTIMIZATION_STRATEGIES = {
  images: [
    'Use next/image with WebP format',
    'Implement lazy loading for below-fold images',
    'Optimize image sizes for different viewports',
    'Use responsive images with srcset',
  ],
  javascript: [
    'Enable code splitting with dynamic imports',
    'Remove unused JavaScript with tree shaking',
    'Use React.lazy for component-level splitting',
    'Minimize third-party scripts',
  ],
  css: [
    'Remove unused CSS with PurgeCSS',
    'Use critical CSS for above-fold content',
    'Minimize CSS bundle size',
    'Use CSS-in-JS for component-scoped styles',
  ],
  network: [
    'Enable HTTP/2 and compression',
    'Use CDN for static assets',
    'Implement service worker for caching',
    'Optimize API response times',
  ],
};

export function generateOptimizationReport(metrics: PerformanceMetrics): string {
  const analysis = analyzePerformance(metrics);
  
  let report = `# Performance Analysis Report\n\n`;
  report += `**Overall Score: ${analysis.score}/100**\n\n`;
  
  if (analysis.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    analysis.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += `\n`;
  }
  
  report += `## Optimization Strategies\n\n`;
  Object.entries(OPTIMIZATION_STRATEGIES).forEach(([category, strategies]) => {
    report += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    strategies.forEach((strategy, index) => {
      report += `- ${strategy}\n`;
    });
    report += `\n`;
  });
  
  return report;
}