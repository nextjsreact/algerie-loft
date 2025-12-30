"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3,
  PieChart,
  Target,
  Users,
  Calendar,
  RefreshCw
} from "lucide-react"

interface TaskLoftAnalyticsProps {
  userRole: string
}

interface TaskLoftStats {
  totalTasks: number
  tasksWithLoft: number
  tasksWithoutLoft: number
  orphanedTasks: number
  loftsWithTasks: number
  loftsWithoutTasks: number
  averageTasksPerLoft: number
}

interface LoftTaskBreakdown {
  loftId: string
  loftName: string
  loftAddress: string
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  completedTasks: number
  overdueTasks: number
}

interface TaskLoftAnalytics {
  stats: TaskLoftStats
  loftBreakdown: LoftTaskBreakdown[]
  statusByLoft: Array<{
    loftId: string | null
    loftName: string | null
    todo: number
    in_progress: number
    completed: number
    total: number
  }>
  orphanedTasks: Array<{
    id: string
    title: string
    orphanedLoftId: string
    status: string
  }>
  trends: {
    tasksCreatedThisMonth: number
    tasksCompletedThisMonth: number
    mostActiveLoft: string | null
    leastActiveLoft: string | null
  }
}

export function TaskLoftAnalytics({ userRole }: TaskLoftAnalyticsProps) {
  const [analytics, setAnalytics] = useState<TaskLoftAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/tasks/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'manager') {
      fetchAnalytics()
    }
  }, [userRole])

  if (userRole !== 'admin' && userRole !== 'manager') {
    return null // Don't show analytics for members
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task-Loft Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task-Loft Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  const { stats, loftBreakdown, orphanedTasks, trends } = analytics

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <div className="text-xs text-muted-foreground">
              {stats.tasksWithLoft} with loft, {stats.tasksWithoutLoft} without
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-500" />
              Active Lofts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loftsWithTasks}</div>
            <div className="text-xs text-muted-foreground">
              {stats.loftsWithoutTasks} lofts without tasks
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Avg Tasks/Loft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageTasksPerLoft.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Tasks per active loft
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Orphaned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.orphanedTasks}
            </div>
            <div className="text-xs text-muted-foreground">
              Tasks with deleted lofts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trends.tasksCreatedThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trends.tasksCompletedThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {trends.mostActiveLoft || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Most Active Loft</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {trends.leastActiveLoft || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Least Active Loft</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loft Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-green-500" />
            Tasks by Loft
          </CardTitle>
          <CardDescription>
            Task distribution and completion status across lofts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loftBreakdown.slice(0, 10).map((loft) => {
              const completionRate = loft.totalTasks > 0 
                ? (loft.completedTasks / loft.totalTasks) * 100 
                : 0

              return (
                <div key={loft.loftId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{loft.loftName}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {loft.loftAddress}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{loft.totalTasks} tasks</div>
                      <div className="text-sm text-muted-foreground">
                        {completionRate.toFixed(0)}% complete
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={completionRate} className="h-2" />
                  
                  <div className="flex gap-2 text-xs">
                    <Badge variant="secondary" className="bg-gray-100">
                      {loft.todoTasks} todo
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100">
                      {loft.inProgressTasks} in progress
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100">
                      {loft.completedTasks} completed
                    </Badge>
                    {loft.overdueTasks > 0 && (
                      <Badge variant="destructive">
                        {loft.overdueTasks} overdue
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
            
            {loftBreakdown.length > 10 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All Lofts ({loftBreakdown.length - 10} more)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orphaned Tasks Alert */}
      {orphanedTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Orphaned Tasks Alert
            </CardTitle>
            <CardDescription className="text-red-600">
              These tasks reference deleted lofts and need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orphanedTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Orphaned Loft ID: {task.orphanedLoftId}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-red-300">
                    {task.status}
                  </Badge>
                </div>
              ))}
              
              {orphanedTasks.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All Orphaned Tasks ({orphanedTasks.length - 5} more)
                  </Button>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Clean Up Orphaned References
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analytics
        </Button>
      </div>
    </div>
  )
}