import { requireRole } from "@/lib/auth"
import { getTask } from "@/app/actions/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, Calendar, User, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function TaskHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const awaitedParams = await params;
  
  try {
    const session = await requireRole(["admin", "manager", "member"])
    const task = await getTask(awaitedParams.id)
    const t = await getTranslations('tasks.history')
    const tStatus = await getTranslations('tasks.status')

    if (!task) {
      return notFound()
    }

    // Vérifier que le membre peut accéder à cette tâche
    if (session.user.role === 'member' && task.assigned_to !== session.user.id) {
      return notFound()
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case "todo":
          return "bg-gray-100 text-gray-800"
        case "in_progress":
          return "bg-blue-100 text-blue-800"
        case "completed":
          return "bg-green-100 text-green-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "completed":
          return <CheckCircle className="h-4 w-4" />
        case "in_progress":
          return <Clock className="h-4 w-4" />
        case "todo":
          return <Calendar className="h-4 w-4" />
        default:
          return <AlertCircle className="h-4 w-4" />
      }
    }

    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/tasks/${awaitedParams.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToTask')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('taskHistory')}</h1>
            <p className="text-gray-600">{t('historyFor')}: {task.title}</p>
          </div>
        </div>

        {/* Task Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('taskInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('taskTitle')}</h4>
                <p className="text-gray-600">{task.title}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('currentStatus')}</h4>
                <Badge className={getStatusColor(task.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(task.status)}
                    {tStatus(task.status)}
                  </div>
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('description')}</h4>
                <p className="text-gray-600">{task.description || t('noDescription')}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('dueDate')}</h4>
                <p className="text-gray-600">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : t('noDueDate')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('taskTimeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{t('taskCreated')}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(task.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{t('lastUpdated')}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(task.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {task.loft && (
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{t('associatedLoft')}</h4>
                    <p className="text-sm text-gray-600">
                      {task.loft.name} - {task.loft.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('availableActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button asChild>
                <Link href={`/tasks/${awaitedParams.id}/edit`}>
                  {t('updateStatus')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/tasks">
                  {t('backToAllTasks')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error loading task history:", error)
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Error</h1>
          <p className="text-muted-foreground">Failed to load task history</p>
        </div>
      </div>
    )
  }
}