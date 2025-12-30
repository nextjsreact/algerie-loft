"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Target, AlertTriangle, CheckCircle } from "lucide-react"

interface TaskLoftQuickStatsProps {
  stats: {
    totalLofts: number
    tasksWithLoft: number
    tasksWithoutLoft: number
    orphanedTasks: number
    loftsWithTasks: number
  }
}

export function TaskLoftQuickStats({ stats }: TaskLoftQuickStatsProps) {
  const totalTasks = stats.tasksWithLoft + stats.tasksWithoutLoft + stats.orphanedTasks
  const loftAssociationRate = totalTasks > 0 ? (stats.tasksWithLoft / totalTasks) * 100 : 0
  const loftUtilizationRate = stats.totalLofts > 0 ? (stats.loftsWithTasks / stats.totalLofts) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Task-Loft Association
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loftAssociationRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">
            {stats.tasksWithLoft} of {totalTasks} tasks have lofts
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-green-500" />
            Loft Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loftUtilizationRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">
            {stats.loftsWithTasks} of {stats.totalLofts} lofts have tasks
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            Unassigned Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tasksWithoutLoft}</div>
          <div className="text-xs text-muted-foreground">
            Tasks without loft assignment
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Data Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.orphanedTasks}</div>
          <div className="text-xs text-muted-foreground">
            Orphaned task references
          </div>
          {stats.orphanedTasks > 0 && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Needs attention
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}