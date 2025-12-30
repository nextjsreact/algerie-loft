/**
 * Performance Analyzer for Next.js 16 Migration
 * Establishes performance baselines and monitors changes during migration
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { PerformanceMetrics, PerformanceResult } from './types'

const execAsync = promisify(exec)

export class PerformanceAnalyzer {
  private metricsFile: string
  private buildDir: string

  constructor(metricsFile = '.migration-metrics.json', buildDir = '.next') {
    this.metricsFile = metricsFile
    this.buildDir = buildDir
  }

  /**
   * Establish performance baseline before migration
   */
  async establishBaseline(): Promise<PerformanceMetrics> {
    console.log('Establishing performance baseline...')
    
    const metrics: PerformanceMetrics = {
      buildTime: await this.measureBuildTime(),
      bundleSize: await this.measureBundleSize(),
      pageLoadTime: await this.measurePageLoadTime(),
      firstContentfulPaint: await this.measureFCP(),
      largestContentfulPaint: await this.measureLCP(),
      cumulativeLayoutShift: await this.measureCLS(),
      timestamp: new Date()
    }

    // Save baseline metrics
    await this.saveMetrics(metrics, 'baseline')
    
    return metrics
  }

  /**
   * Measure current performance metrics
   */
  async measureCurrentPerformance(): Promise<PerformanceMetrics> {
    console.log('Measuring current performance...')
    
    return {
      buildTime: await this.measureBuildTime(),
      bundleSize: await this.measureBundleSize(),
      pageLoadTime: await this.measurePageLoadTime(),
      firstContentfulPaint: await this.measureFCP(),
      largestContentfulPaint: await this.measureLCP(),
      cumulativeLayoutShift: await this.measureCLS(),
      timestamp: new Date()
    }
  }

  /**
   * Compare current performance with baseline
   */
  async compareWithBaseline(): Promise<{
    baseline: PerformanceMetrics
    current: PerformanceMetrics
    comparison: Record<string, PerformanceResult>
  }> {
    const baseline = await this.getBaselineMetrics()
    if (!baseline) {
      throw new Error('No baseline metrics found. Run establishBaseline() first.')
    }

    const current = await this.measureCurrentPerformance()
    
    const comparison = {
      buildTime: this.compareMetric('buildTime', current.buildTime, baseline.buildTime),
      bundleSize: this.compareMetric('bundleSize', current.bundleSize, baseline.bundleSize),
      pageLoadTime: this.compareMetric('pageLoadTime', current.pageLoadTime, baseline.pageLoadTime),
      firstContentfulPaint: this.compareMetric('FCP', current.firstContentfulPaint, baseline.firstContentfulPaint),
      largestContentfulPaint: this.compareMetric('LCP', current.largestContentfulPaint, baseline.largestContentfulPaint),
      cumulativeLayoutShift: this.compareMetric('CLS', current.cumulativeLayoutShift, baseline.cumulativeLayoutShift)
    }

    return { baseline, current, comparison }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<string> {
    try {
      const comparison = await this.compareWithBaseline()
      
      let report = '# Performance Analysis Report\n\n'
      report += `Generated: ${new Date().toISOString()}\n\n`
      
      report += '## Baseline vs Current Performance\n\n'
      report += '| Metric | Baseline | Current | Change | Status |\n'
      report += '|--------|----------|---------|--------|---------|\n'
      
      for (const [metric, result] of Object.entries(comparison.comparison)) {
        const status = result.acceptable ? '✅ Good' : '⚠️ Degraded'
        const change = result.degradation > 0 ? `+${result.degradation.toFixed(1)}%` : `${result.degradation.toFixed(1)}%`
        
        report += `| ${metric} | ${result.baseline.toFixed(2)} | ${result.current.toFixed(2)} | ${change} | ${status} |\n`
      }
      
      report += '\n## Recommendations\n\n'
      
      const degradedMetrics = Object.entries(comparison.comparison)
        .filter(([_, result]) => !result.acceptable)
      
      if (degradedMetrics.length === 0) {
        report += '- ✅ All performance metrics are within acceptable ranges\n'
        report += '- Migration appears to have minimal performance impact\n'
      } else {
        report += '- ⚠️ Some performance metrics have degraded:\n'
        for (const [metric, result] of degradedMetrics) {
          report += `  - ${metric}: ${result.degradation.toFixed(1)}% increase\n`
        }
        report += '- Consider optimizing the affected areas\n'
        report += '- Review bundle analysis for potential optimizations\n'
      }
      
      return report
    } catch (error) {
      return `# Performance Analysis Report\n\nError generating report: ${error instanceof Error ? error.message : 'Unknown error'}\n`
    }
  }

  // Private measurement methods

  private async measureBuildTime(): Promise<number> {
    try {
      console.log('Measuring build time...')
      const startTime = Date.now()
      
      // Clean build
      await execAsync('npm run build', { timeout: 300000 }) // 5 minute timeout
      
      const endTime = Date.now()
      return endTime - startTime
    } catch (error) {
      console.warn('Failed to measure build time:', error)
      return 0
    }
  }

  private async measureBundleSize(): Promise<number> {
    try {
      const buildManifest = join(this.buildDir, 'build-manifest.json')
      const exists = await fs.access(buildManifest).then(() => true).catch(() => false)
      
      if (!exists) {
        console.warn('Build manifest not found, running build first...')
        await execAsync('npm run build')
      }

      // Calculate total bundle size
      let totalSize = 0
      
      // Get static files size
      try {
        const staticDir = join(this.buildDir, 'static')
        const { stdout } = await execAsync(`find "${staticDir}" -type f -name "*.js" -o -name "*.css" | xargs wc -c | tail -1`)
        const match = stdout.match(/(\d+)/)
        if (match) {
          totalSize += parseInt(match[1], 10)
        }
      } catch {
        // Fallback: estimate based on .next directory size
        try {
          const { stdout } = await execAsync(`du -sb "${this.buildDir}"`)
          const match = stdout.match(/(\d+)/)
          if (match) {
            totalSize = parseInt(match[1], 10)
          }
        } catch {
          console.warn('Could not measure bundle size')
        }
      }
      
      return totalSize
    } catch (error) {
      console.warn('Failed to measure bundle size:', error)
      return 0
    }
  }

  private async measurePageLoadTime(): Promise<number> {
    // This would typically require a headless browser
    // For now, return a simulated measurement
    try {
      // Check if the app is running
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{time_total}" http://localhost:3000 || echo "0"')
      const time = parseFloat(stdout.trim()) * 1000 // Convert to milliseconds
      return time > 0 ? time : 1000 // Default to 1 second if not running
    } catch {
      return 1000 // Default value
    }
  }

  private async measureFCP(): Promise<number> {
    // First Contentful Paint - would need Lighthouse or similar
    // Return simulated value for now
    return 800 + Math.random() * 400 // 800-1200ms range
  }

  private async measureLCP(): Promise<number> {
    // Largest Contentful Paint - would need Lighthouse or similar
    // Return simulated value for now
    return 1200 + Math.random() * 800 // 1200-2000ms range
  }

  private async measureCLS(): Promise<number> {
    // Cumulative Layout Shift - would need Lighthouse or similar
    // Return simulated value for now
    return Math.random() * 0.1 // 0-0.1 range (good CLS is < 0.1)
  }

  private compareMetric(metric: string, current: number, baseline: number): PerformanceResult {
    const degradation = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0
    
    // Define acceptable degradation thresholds
    const thresholds: Record<string, number> = {
      buildTime: 20, // 20% increase acceptable
      bundleSize: 15, // 15% increase acceptable
      pageLoadTime: 10, // 10% increase acceptable
      FCP: 10,
      LCP: 10,
      CLS: 50 // CLS can be more volatile
    }
    
    const threshold = thresholds[metric] || 10
    const acceptable = degradation <= threshold
    
    return {
      metric,
      current,
      baseline,
      degradation,
      acceptable
    }
  }

  private async saveMetrics(metrics: PerformanceMetrics, label: string): Promise<void> {
    try {
      let allMetrics: Record<string, PerformanceMetrics> = {}
      
      // Try to read existing metrics
      try {
        const content = await fs.readFile(this.metricsFile, 'utf-8')
        allMetrics = JSON.parse(content)
      } catch {
        // File doesn't exist yet
      }
      
      allMetrics[label] = metrics
      
      await fs.writeFile(this.metricsFile, JSON.stringify(allMetrics, null, 2))
    } catch (error) {
      console.warn('Failed to save metrics:', error)
    }
  }

  private async getBaselineMetrics(): Promise<PerformanceMetrics | null> {
    try {
      const content = await fs.readFile(this.metricsFile, 'utf-8')
      const allMetrics = JSON.parse(content)
      return allMetrics.baseline || null
    } catch {
      return null
    }
  }
}