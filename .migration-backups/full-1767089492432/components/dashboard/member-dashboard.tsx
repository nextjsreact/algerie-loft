"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertTriangle, Calendar, User, Building, Shield, Eye } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { DataFilterService, FilterConfig } from "@/lib/services/data-filter"
import { MemberTaskView, MemberLoftView, MemberDataGuards } from "@/lib/types/member-views"
import { UserRole } from "@/lib/types"
import { usePermissions } from "@/hooks/use-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMemo, useEffect, useState } from "react"
import { getTasks } from "@/app/actions/tasks"

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  due_date?: string
  loft_id?: string
  assigned_to?: string
  user_id?: string
  loft?: {
    name: string
    address?: string
    status?: string
  }
}

interface MemberDashboardProps {
  userTasks?: Task[]
  userName: string
  userRole: string
  userId?: string
  showSecurityInfo?: boolean
}

export function MemberDashboard({ 
  userTasks: initialUserTasks = [], 
  userName, 
  userRole, 
  userId,
  showSecurityInfo = true 
}: MemberDashboardProps) {
  // All hooks must be at the top level
  const t = useTranslations("dashboard");
  const permissions = usePermissions(userRole as UserRole);
  const [userTasks, setUserTasks] = useState<Task[]>(initialUserTasks);
  const [loading, setLoading] = useState(!initialUserTasks.length);
  const [showSecurityAlert, setShowSecurityAlert] = useState(showSecurityInfo);

  // Fetch tasks if not provided
  useEffect(() => {
    async function fetchTasks() {
      if (initialUserTasks.length > 0) return;
      
      try {
        const tasks = await getTasks();
        
        // SECURITY: Sanitize tasks to prevent financial data leaks to member dashboard
        const sanitizedTasks = tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          due_date: task.due_date,
          loft_id: task.loft_id,
          assigned_to: task.assigned_to,
          user_id: task.user_id,
          loft: task.loft ? {
            name: task.loft.name,
            address: task.loft.address,
            status: task.loft.status,
          } : undefined,
        }));

        setUserTasks(sanitizedTasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTasks();
  }, [initialUserTasks.length]);

  // Security validation - ensure user can only see their own tasks
  const secureUserTasks = useMemo(() => {
    if (!userId) return userTasks;

    // Apply security filtering to ensure member only sees assigned tasks
    const filterConfig: FilterConfig = {
      userRole: userRole as UserRole,
      userId: userId
    };

    const filteredResult = DataFilterService.filterTasks(userTasks, filterConfig);
    
    // Log security filtering for audit
    if (filteredResult.hasSecurityFiltering) {
      console.warn(`Security filtering applied: ${filteredResult.filteredCount} tasks filtered for user ${userId}`);
    }

    return filteredResult.data as Task[];
  }, [userTasks, userId, userRole]);

  // Validate that all tasks are properly assigned to the member
  const validatedTasks = useMemo(() => {
    return secureUserTasks.filter(task => {
      // Ensure task is assigned to current user or created by them
      const isAssigned = task.assigned_to === userId;
      const isCreated = task.user_id === userId;
      
      if (!isAssigned && !isCreated && userId) {
        console.warn(`Task ${task.id} not properly assigned to user ${userId}`);
        return false;
      }
      
      return true;
    });
  }, [secureUserTasks, userId]);

  // Calculate task statistics with security validation
  const todoTasks = validatedTasks.filter(task => task.status === 'todo')
  const inProgressTasks = validatedTasks.filter(task => task.status === 'in_progress')
  const completedTasks = validatedTasks.filter(task => task.status === 'completed')
  
  const overdueTasks = validatedTasks.filter(task => {
    if (!task.due_date) return false
    return new Date(task.due_date) < new Date() && task.status !== 'completed'
  })

  const upcomingTasks = validatedTasks.filter(task => {
    if (!task.due_date) return false
    const dueDate = new Date(task.due_date)
    const today = new Date()
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000))
    return dueDate >= today && dueDate <= threeDaysFromNow && task.status !== 'completed'
  })

  // Get unique lofts from assigned tasks (security filtered)
  const assignedLofts = useMemo(() => {
    const loftMap = new Map();
    validatedTasks.forEach(task => {
      if (task.loft && task.loft_id) {
        loftMap.set(task.loft_id, {
          id: task.loft_id,
          name: task.loft.name,
          address: task.loft.address,
          status: task.loft.status,
          taskCount: (loftMap.get(task.loft_id)?.taskCount || 0) + 1
        });
      }
    });
    return Array.from(loftMap.values());
  }, [validatedTasks]);

  // Security check - ensure no financial data is exposed
  const hasFinancialDataLeak = useMemo(() => {
    return validatedTasks.some(task => {
      const taskObj = task as any;
      return taskObj.price || taskObj.cost || taskObj.amount || taskObj.revenue || 
             taskObj.expense || taskObj.payment || taskObj.salary;
    });
  }, [validatedTasks]);

  // Early return for loading state (after all hooks)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your tasks...</div>
      </div>
    );
  }

  // Security warning if financial data detected
  if (hasFinancialDataLeak) {
    console.error('SECURITY ALERT: Financial data detected in member dashboard');
  }

  const taskStatusTranslationKeys = {
    todo: 'toDo',
    in_progress: 'inProgress',
    completed: 'completed',
    unknown: 'unknown',
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
      {/* Security Information - Dismissible */}
      {showSecurityAlert && (
        <Alert className="border-blue-200 bg-blue-50 relative">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                {t('secureViewMessage')}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Eye className="h-3 w-3" />
                  <span>{validatedTasks.length} {t('tasksVisible')}</span>
                  {assignedLofts.length > 0 && (
                    <>
                      <span>•</span>
                      <Building className="h-3 w-3" />
                      <span>{assignedLofts.length} {t('loftsAccessible')}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowSecurityAlert(false)}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  {t('dismiss')}
                </button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Financial Data Leak Warning (Development Only) */}
      {hasFinancialDataLeak && process.env.NODE_ENV === 'development' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>SECURITY WARNING:</strong> Financial data detected in member view. This should not happen in production.
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('welcomeBack', { name: userName })}</h1>
            <p className="text-gray-600">{t('pendingTasks', { todo: todoTasks.length, inProgress: inProgressTasks.length })}</p>
          </div>
          {/* Role Badge */}
          <div className="text-right">
            <Badge variant="secondary" className="mb-1">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            <p className="text-xs text-gray-500">Limited Access</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('toDo')}</p>
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
                <p className="text-sm font-medium text-blue-600">{t('inProgress')}</p>
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
                <p className="text-sm font-medium text-green-600">{t('completed')}</p>
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
                <p className="text-sm font-medium text-red-600">{t('overdue')}</p>
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
              {t('urgentTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 && upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>{t('noUrgentTasks')}</p>
                <p className="text-sm">{t('allCaughtUp')}</p>
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
                            {t('overdue')}
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
                            {t('due')}: {new Date(task.due_date!).toLocaleDateString()}
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                {t('myRecentTasks')}
              </div>
              <Badge variant="outline" className="text-xs">
                {validatedTasks.length} assigned
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validatedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{t('noTasksAssigned')}</p>
                <p className="text-sm">{t('noTasksYet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {validatedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {task.loft && (
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {task.loft.name}
                            </Badge>
                          )}
                          {task.assigned_to === userId && (
                            <Badge variant="secondary" className="text-xs">
                              Assigned to me
                            </Badge>
                          )}
                          {task.user_id === userId && task.assigned_to !== userId && (
                            <Badge variant="outline" className="text-xs">
                              Created by me
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getStatusColor(task.status)}>
                        {t(taskStatusTranslationKeys[task.status])}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {validatedTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/tasks">{t('viewAllMyTasks')}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loft-Specific Tasks (if user has access to multiple lofts) */}
      {assignedLofts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-500" />
              My Assigned Lofts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedLofts.map((loft) => (
                <div key={loft.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{loft.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {loft.taskCount} tasks
                    </Badge>
                  </div>
                  {loft.address && (
                    <p className="text-sm text-gray-600 mb-2">{loft.address}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={loft.status === 'maintenance' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {loft.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tasks?loft=${loft.id}`} className="text-xs">
                        View Tasks
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('quickActions')}</span>
            <Badge variant="outline" className="text-xs">
              Member Access
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/tasks" className="flex flex-col items-center gap-2">
                <Calendar className="h-6 w-6" />
                <span>{t('viewMyTasks')}</span>
                <span className="text-xs text-gray-500">Assigned tasks only</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/profile" className="flex flex-col items-center gap-2">
                <User className="h-6 w-6" />
                <span>{t('myProfile')}</span>
                <span className="text-xs text-gray-500">Personal settings</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/notifications" className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span>My Notifications</span>
                <span className="text-xs text-gray-500">Task updates only</span>
              </Link>
            </Button>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>
                As a member, you have access to your assigned tasks and related loft information only. 
                Financial data and administrative functions are not available.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}