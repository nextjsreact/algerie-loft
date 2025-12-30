/**
 * Task-Loft Reports Service
 * Generates detailed reports and exports for task-loft analytics
 */

import { getTaskLoftAnalytics, getTaskCompletionRateByLoft } from './task-loft-analytics'
import { logger } from '@/lib/logger'

export interface TaskLoftReport {
  generatedAt: string
  summary: {
    totalTasks: number
    tasksWithLoft: number
    tasksWithoutLoft: number
    orphanedTasks: number
    loftsAnalyzed: number
    averageTasksPerLoft: number
  }
  loftPerformance: Array<{
    loftName: string
    totalTasks: number
    completionRate: number
    overdueTasks: number
    efficiency: 'high' | 'medium' | 'low'
  }>
  recommendations: string[]
  dataQualityIssues: Array<{
    type: 'orphaned_task' | 'unused_loft' | 'overloaded_loft'
    description: string
    severity: 'high' | 'medium' | 'low'
    affectedItems: string[]
  }>
}

/**
 * Generate comprehensive task-loft report
 */
export async function generateTaskLoftReport(): Promise<TaskLoftReport> {
  try {
    logger.info('Generating task-loft report')

    const [analytics, completionRates] = await Promise.all([
      getTaskLoftAnalytics(),
      getTaskCompletionRateByLoft()
    ])

    const { stats, loftBreakdown, orphanedTasks } = analytics

    // Calculate loft performance
    const loftPerformance = loftBreakdown
      .filter(loft => loft.totalTasks > 0)
      .map(loft => {
        const completionRate = loft.totalTasks > 0 
          ? (loft.completedTasks / loft.totalTasks) * 100 
          : 0
        
        const overdueRate = loft.totalTasks > 0 
          ? (loft.overdueTasks / loft.totalTasks) * 100 
          : 0

        // Determine efficiency based on completion rate and overdue tasks
        let efficiency: 'high' | 'medium' | 'low'
        if (completionRate >= 80 && overdueRate <= 10) {
          efficiency = 'high'
        } else if (completionRate >= 60 && overdueRate <= 25) {
          efficiency = 'medium'
        } else {
          efficiency = 'low'
        }

        return {
          loftName: loft.loftName,
          totalTasks: loft.totalTasks,
          completionRate,
          overdueTasks: loft.overdueTasks,
          efficiency
        }
      })
      .sort((a, b) => b.completionRate - a.completionRate)

    // Generate recommendations
    const recommendations: string[] = []

    if (stats.orphanedTasks > 0) {
      recommendations.push(
        `Clean up ${stats.orphanedTasks} orphaned task references to improve data quality`
      )
    }

    if (stats.tasksWithoutLoft > stats.tasksWithLoft * 0.2) {
      recommendations.push(
        `Consider assigning lofts to ${stats.tasksWithoutLoft} unassigned tasks for better organization`
      )
    }

    const lowEfficiencyLofts = loftPerformance.filter(loft => loft.efficiency === 'low')
    if (lowEfficiencyLofts.length > 0) {
      recommendations.push(
        `Review task management for ${lowEfficiencyLofts.length} low-efficiency lofts`
      )
    }

    const overloadedLofts = loftPerformance.filter(loft => loft.totalTasks > stats.averageTasksPerLoft * 2)
    if (overloadedLofts.length > 0) {
      recommendations.push(
        `Consider redistributing tasks from ${overloadedLofts.length} overloaded lofts`
      )
    }

    if (stats.loftsWithoutTasks > 0) {
      recommendations.push(
        `${stats.loftsWithoutTasks} lofts have no tasks - consider if they need maintenance or attention`
      )
    }

    // Identify data quality issues
    const dataQualityIssues: TaskLoftReport['dataQualityIssues'] = []

    // Orphaned tasks
    if (orphanedTasks.length > 0) {
      dataQualityIssues.push({
        type: 'orphaned_task',
        description: `${orphanedTasks.length} tasks reference deleted lofts`,
        severity: orphanedTasks.length > 10 ? 'high' : orphanedTasks.length > 5 ? 'medium' : 'low',
        affectedItems: orphanedTasks.map(task => task.title)
      })
    }

    // Unused lofts
    if (stats.loftsWithoutTasks > 0) {
      dataQualityIssues.push({
        type: 'unused_loft',
        description: `${stats.loftsWithoutTasks} lofts have no associated tasks`,
        severity: stats.loftsWithoutTasks > stats.totalLofts * 0.5 ? 'high' : 'medium',
        affectedItems: loftBreakdown
          .filter(loft => loft.totalTasks === 0)
          .map(loft => loft.loftName)
      })
    }

    // Overloaded lofts
    if (overloadedLofts.length > 0) {
      dataQualityIssues.push({
        type: 'overloaded_loft',
        description: `${overloadedLofts.length} lofts have significantly more tasks than average`,
        severity: overloadedLofts.some(loft => loft.totalTasks > stats.averageTasksPerLoft * 3) ? 'high' : 'medium',
        affectedItems: overloadedLofts.map(loft => loft.loftName)
      })
    }

    const report: TaskLoftReport = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTasks: stats.totalTasks,
        tasksWithLoft: stats.tasksWithLoft,
        tasksWithoutLoft: stats.tasksWithoutLoft,
        orphanedTasks: stats.orphanedTasks,
        loftsAnalyzed: loftBreakdown.length,
        averageTasksPerLoft: stats.averageTasksPerLoft
      },
      loftPerformance,
      recommendations,
      dataQualityIssues
    }

    logger.info('Task-loft report generated successfully', {
      totalTasks: stats.totalTasks,
      loftsAnalyzed: loftBreakdown.length,
      recommendationsCount: recommendations.length,
      issuesCount: dataQualityIssues.length
    })

    return report

  } catch (error) {
    logger.error('Failed to generate task-loft report', error)
    throw new Error('Failed to generate report')
  }
}

/**
 * Export report data as CSV format
 */
export function exportTaskLoftReportAsCSV(report: TaskLoftReport): string {
  const lines: string[] = []

  // Header
  lines.push('Task-Loft Analytics Report')
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`)
  lines.push('')

  // Summary
  lines.push('SUMMARY')
  lines.push('Metric,Value')
  lines.push(`Total Tasks,${report.summary.totalTasks}`)
  lines.push(`Tasks with Loft,${report.summary.tasksWithLoft}`)
  lines.push(`Tasks without Loft,${report.summary.tasksWithoutLoft}`)
  lines.push(`Orphaned Tasks,${report.summary.orphanedTasks}`)
  lines.push(`Lofts Analyzed,${report.summary.loftsAnalyzed}`)
  lines.push(`Average Tasks per Loft,${report.summary.averageTasksPerLoft.toFixed(2)}`)
  lines.push('')

  // Loft Performance
  lines.push('LOFT PERFORMANCE')
  lines.push('Loft Name,Total Tasks,Completion Rate (%),Overdue Tasks,Efficiency')
  report.loftPerformance.forEach(loft => {
    lines.push(`"${loft.loftName}",${loft.totalTasks},${loft.completionRate.toFixed(1)},${loft.overdueTasks},${loft.efficiency}`)
  })
  lines.push('')

  // Recommendations
  lines.push('RECOMMENDATIONS')
  report.recommendations.forEach((rec, index) => {
    lines.push(`${index + 1}. ${rec}`)
  })
  lines.push('')

  // Data Quality Issues
  lines.push('DATA QUALITY ISSUES')
  lines.push('Type,Description,Severity,Affected Count')
  report.dataQualityIssues.forEach(issue => {
    lines.push(`${issue.type},${issue.description},${issue.severity},${issue.affectedItems.length}`)
  })

  return lines.join('\n')
}

/**
 * Get task-loft KPIs (Key Performance Indicators)
 */
export async function getTaskLoftKPIs() {
  try {
    const analytics = await getTaskLoftAnalytics()
    const { stats } = analytics

    const totalTasks = stats.totalTasks
    const associationRate = totalTasks > 0 ? (stats.tasksWithLoft / totalTasks) * 100 : 0
    const utilizationRate = stats.loftsWithTasks + stats.loftsWithoutTasks > 0 
      ? (stats.loftsWithTasks / (stats.loftsWithTasks + stats.loftsWithoutTasks)) * 100 
      : 0
    const dataQualityScore = totalTasks > 0 ? ((totalTasks - stats.orphanedTasks) / totalTasks) * 100 : 100

    return {
      associationRate: {
        value: associationRate,
        label: 'Task-Loft Association Rate',
        target: 80, // Target: 80% of tasks should have lofts
        status: associationRate >= 80 ? 'good' : associationRate >= 60 ? 'warning' : 'critical'
      },
      utilizationRate: {
        value: utilizationRate,
        label: 'Loft Utilization Rate',
        target: 70, // Target: 70% of lofts should have tasks
        status: utilizationRate >= 70 ? 'good' : utilizationRate >= 50 ? 'warning' : 'critical'
      },
      dataQualityScore: {
        value: dataQualityScore,
        label: 'Data Quality Score',
        target: 95, // Target: 95% data quality (minimal orphaned references)
        status: dataQualityScore >= 95 ? 'good' : dataQualityScore >= 90 ? 'warning' : 'critical'
      },
      averageTasksPerLoft: {
        value: stats.averageTasksPerLoft,
        label: 'Average Tasks per Loft',
        target: 5, // Target: 5 tasks per loft on average
        status: stats.averageTasksPerLoft >= 3 && stats.averageTasksPerLoft <= 10 ? 'good' : 'warning'
      }
    }

  } catch (error) {
    logger.error('Failed to calculate task-loft KPIs', error)
    throw new Error('Failed to calculate KPIs')
  }
}