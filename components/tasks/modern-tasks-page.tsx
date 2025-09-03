"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  BarChart3,
  Sparkles,
  RefreshCw,
  Target,
  Users,
  TrendingUp,
  ListTodo,
  PlayCircle,
  CheckCircle2
} from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  due_date?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  full_name: string
  email: string
}

interface ModernTasksPageProps {
  tasks: Task[]
  users: User[]
  userRole: string
  currentUserId: string
}

export function ModernTasksPage({
  tasks,
  users,
  userRole,
  currentUserId
}: ModernTasksPageProps) {
  const t = useTranslations("tasks")
  const tCommon = useTranslations("common")
  const tAvailability = useTranslations("availability")
  const locale = useLocale()

  // Function to translate task status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return t('status.todo')
      case 'in_progress':
        return t('status.inProgress')
      case 'completed':
        return t('status.completed')
      default:
        return status
    }
  }
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = task.due_date ? new Date(task.due_date) : null
      const startDateMatch = !startDate || (taskDate && taskDate >= new Date(startDate))
      const endDateMatch = !endDate || (taskDate && taskDate <= new Date(endDate))
      const matchesSearch = !searchTerm || 
                           task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesAssignee = assigneeFilter === "all" || task.assigned_to === assigneeFilter

      return startDateMatch && endDateMatch && matchesSearch && matchesStatus && matchesAssignee
    })
  }, [tasks, searchTerm, statusFilter, assigneeFilter, startDate, endDate])

  // Calculs des statistiques
  const { todoCount, inProgressCount, completedCount, myTasksCount, overdueCount } = useMemo(() => {
    const now = new Date()
    return tasks.reduce(
      (acc, task) => {
        if (task.status === 'todo') acc.todoCount++
        if (task.status === 'in_progress') acc.inProgressCount++
        if (task.status === 'completed') acc.completedCount++
        if (task.assigned_to === currentUserId) acc.myTasksCount++
        
        if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') {
          acc.overdueCount++
        }
        
        return acc
      },
      { todoCount: 0, inProgressCount: 0, completedCount: 0, myTasksCount: 0, overdueCount: 0 }
    )
  }, [tasks, currentUserId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress': return <PlayCircle className="h-4 w-4" />
      case 'todo': return <ListTodo className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
    }
  }

  const getPriorityColor = (task: Task) => {
    if (!task.due_date) return ''
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0 && task.status !== 'completed') return 'border-l-4 border-l-red-500'
    if (daysUntilDue <= 1 && task.status !== 'completed') return 'border-l-4 border-l-orange-500'
    if (daysUntilDue <= 3 && task.status !== 'completed') return 'border-l-4 border-l-yellow-500'
    return 'border-l-4 border-l-blue-500'
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setAssigneeFilter("all")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Enhanced header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {userRole === "member" ? t('yourTasks') : t('subtitle')}
          </p>
          
          {/* Bouton d'action */}
          {(userRole === "admin" || userRole === "manager") && (
            <div className="flex justify-center">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl px-6 py-3 text-base font-medium transition-all duration-200" 
                asChild
              >
                <Link href="/tasks/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t('addTask')}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('status.todo')}
                </CardTitle>
                <div className="p-2 bg-gray-500 rounded-full">
                  <ListTodo className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {todoCount}
                </span>
                <span className="text-gray-600 dark:text-gray-400 font-medium">{t('tasks')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700">
                  {t('status.inProgress')}
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-full">
                  <PlayCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {inProgressCount}
                </span>
                <span className="text-blue-600 font-medium">{t('status.inProgress')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">
                  {t('status.completed')}
                </CardTitle>
                <div className="p-2 bg-green-500 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {completedCount}
                </span>
                <span className="text-green-600 font-medium">{t('status.completed')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700">
                  {t('myTasks')}
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {myTasksCount}
                </span>
                <span className="text-purple-600 font-medium">{t('assigned')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-700">
                  {t('overdue')}
                </CardTitle>
                <div className="p-2 bg-red-500 rounded-full">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {overdueCount}
                </span>
                <span className="text-red-600 font-medium">{t('overdue')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced filters */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Filter className="h-5 w-5 text-blue-500" />
                {t('filtersTitle')}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Recherche */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  {t('search')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Plage de dates */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {t('dateRange')}
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="jj/mm/aaaa"
                    className="flex-1 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-500 text-sm font-medium">{t('to')}</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="jj/mm/aaaa"
                    className="flex-1 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  {t('taskStatus')}
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                    <SelectItem value="todo">
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        {t('status.todo')}
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-blue-600" />
                        {t('status.inProgress')}
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {t('status.completed')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned to */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  {t('assignedTo')}
                </label>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allUsers')}</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name === 'member1' ? tCommon('member1') : user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced tasks list */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-blue-500" />
              {t('tasksList')} ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('noTasks')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('noTasksDescription')}
                </p>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button asChild>
                    <Link href="/tasks/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('createNewTask')}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task) => {
                  const assignedUser = users.find(u => u.id === task.assigned_to)
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                  
                  return (
                    <Card key={task.id} className={`border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group ${getPriorityColor(task)}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded-full ${task.status === 'completed' ? 'bg-green-100' : task.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                {getStatusIcon(task.status)}
                              </div>
                              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {task.title}
                              </CardTitle>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {new Date(task.due_date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')}
                                  {isOverdue && ` (${t('overdue')})`}
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge className={`${getStatusColor(task.status)} border`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.status)}
                              {getStatusText(task.status)}
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description || t('noDescription')}
                        </p>

                        {/* Assigned to */}
                        {assignedUser && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('assignedTo')}:</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {assignedUser.full_name === 'member1' ? 'Membre 1' : assignedUser.full_name}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/tasks/${task.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              {t('viewTask')}
                            </Link>
                          </Button>
                          
                          {(userRole === "admin" || userRole === "manager" || (userRole === "member" && task.assigned_to === currentUserId)) && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/tasks/${task.id}/edit`}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}