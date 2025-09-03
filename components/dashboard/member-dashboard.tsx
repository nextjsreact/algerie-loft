"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertTriangle, Calendar, User, Building } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  due_date?: string
  loft?: {
    name: string
  }
}

interface MemberDashboardProps {
  userTasks: Task[]
  userName: string
  userRole: string
}

export function MemberDashboard({ userTasks, userName, userRole }: MemberDashboardProps) {
  const t = useTranslations("dashboard");
  const todoTasks = userTasks.filter(task => task.status === 'todo')
  const inProgressTasks = userTasks.filter(task => task.status === 'in_progress')
  const completedTasks = userTasks.filter(task => task.status === 'completed')
  
  const overdueTasks = userTasks.filter(task => {
    if (!task.due_date) return false
    return new Date(task.due_date) < new Date() && task.status !== 'completed'
  })

  const upcomingTasks = userTasks.filter(task => {
    if (!task.due_date) return false
    const dueDate = new Date(task.due_date)
    const today = new Date()
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000))
    return dueDate >= today && dueDate <= threeDaysFromNow && task.status !== 'completed'
  })

  const taskStatusTranslationKeys = {
    todo: 'dashboard.todo',
    in_progress: 'dashboard.inProgress',
    completed: 'dashboard.completed',
    unknown: 'dashboard.unknown', // Added this key
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'todo': return <Calendar className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcomeBack', { name: userName })}</h1>
            <p className="text-gray-600">{t('dashboard.pendingTasks', { todo: todoTasks.length, inProgress: inProgressTasks.length })}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.toDo')}</p>
                <p className="text-2xl font-bold text-gray-900">{todoTasks.length}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">{t('dashboard.inProgress')}</p>
                <p className="text-2xl font-bold text-blue-900">{inProgressTasks.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">{t('dashboard.completed')}</p>
                <p className="text-2xl font-bold text-green-900">{completedTasks.length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">{t('dashboard.overdue')}</p>
                <p className="text-2xl font-bold text-red-900">{overdueTasks.length}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('dashboard.urgentTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 && upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>{t('dashboard.noUrgentTasks')}</p>
                <p className="text-sm">{t('dashboard.allCaughtUp')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-red-700 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.loft && (
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {task.loft.name}
                            </Badge>
                          )}
                          <Badge variant="destructive" className="text-xs">
                            {t('dashboard.overdue')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-orange-700 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.loft && (
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {task.loft.name}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {t('dashboard.due')}: {new Date(task.due_date!).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              {t('dashboard.myRecentTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{t('dashboard.noTasksAssigned')}</p>
                <p className="text-sm">{t('dashboard.noTasksYet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        {task.loft && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {task.loft.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {t(taskStatusTranslationKeys[task.status])}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {userTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/tasks">{t('dashboard.viewAllMyTasks')}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/tasks" className="flex flex-col items-center gap-2">
                <Calendar className="h-6 w-6" />
                <span>{t('dashboard.viewMyTasks')}</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/profile" className="flex flex-col items-center gap-2">
                <User className="h-6 w-6" />
                <span>{t('dashboard.myProfile')}</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/help" className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span>{t('dashboard.needHelp')}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
