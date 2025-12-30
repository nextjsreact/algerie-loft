"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Building2, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Shield,
  Eye,
  AlertTriangle
} from "lucide-react"
import { getTasks } from "@/app/actions/tasks"
import type { AuthSession } from "@/lib/types"

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
    id: string
    name: string
    address?: string
    status?: string
    zone_area_name?: string
  }
}

interface MemberLoftData {
  id: string
  name: string
  address?: string
  status?: string
  zone_area_name?: string
  tasks: Task[]
  taskCounts: {
    todo: number
    in_progress: number
    completed: number
    total: number
  }
}

interface MemberLoftsViewProps {
  session: AuthSession
}

export function MemberLoftsView({ session }: MemberLoftsViewProps) {
  const t = useTranslations('lofts.member')
  const [memberLofts, setMemberLofts] = useState<MemberLoftData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInfoAlert, setShowInfoAlert] = useState(false) // Masqué par défaut

  useEffect(() => {
    async function fetchMemberLofts() {
      try {
        // Récupérer toutes les tâches assignées à ce membre
        const allTasks = await getTasks()
        
        // Filtrer seulement les tâches assignées à ce membre
        const memberTasks = allTasks.filter(task => 
          task.assigned_to === session.user.id
        )

        // Grouper les tâches par loft
        const loftTasksMap = new Map<string, Task[]>()
        const loftInfoMap = new Map<string, any>()

        memberTasks.forEach(task => {
          if (task.loft_id && task.loft) {
            if (!loftTasksMap.has(task.loft_id)) {
              loftTasksMap.set(task.loft_id, [])
              loftInfoMap.set(task.loft_id, task.loft)
            }
            loftTasksMap.get(task.loft_id)!.push(task)
          }
        })

        // Créer les données des lofts pour le membre
        const memberLoftsData: MemberLoftData[] = Array.from(loftTasksMap.entries()).map(([loftId, tasks]) => {
          const loftInfo = loftInfoMap.get(loftId)
          const taskCounts = {
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            total: tasks.length
          }

          return {
            id: loftId,
            name: loftInfo.name,
            address: loftInfo.address,
            status: loftInfo.status,
            zone_area_name: loftInfo.zone_area_name,
            tasks,
            taskCounts
          }
        })

        setMemberLofts(memberLoftsData)
      } catch (err) {
        console.error('Failed to fetch member lofts:', err)
        setError('Failed to load your assigned lofts')
      } finally {
        setLoading(false)
      }
    }

    fetchMemberLofts()
  }, [session.user.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unavailable': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />
      case 'todo': return <Calendar className="h-4 w-4 text-gray-600" />
      default: return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('completed')
      case 'in_progress': return t('inProgress')
      case 'todo': return t('toDo')
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your assigned lofts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header avec information de sécurité */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('myAssignedLofts')}</h1>
            <p className="text-gray-600">{t('loftsWithTasks')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <Badge variant="outline">{t('memberView')}</Badge>
          </div>
        </div>

        {/* Info compacte avec bouton pour plus de détails */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-blue-600" />
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Building2 className="h-3 w-3" />
              <span>{memberLofts.length} {t('loftsAccessible')}</span>
              <span>•</span>
              <span>{t('memberViewShort')}</span>
            </div>
          </div>
          <button
            onClick={() => setShowInfoAlert(!showInfoAlert)}
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            {showInfoAlert ? t('hideDetails') : t('showDetails')}
          </button>
        </div>

        {/* Message détaillé (optionnel) */}
        {showInfoAlert && (
          <Alert className="border-blue-200 bg-blue-50">
            <Eye className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span>
                  {t('memberViewDescription')}
                </span>
                <button
                  onClick={() => setShowInfoAlert(false)}
                  className="text-blue-600 hover:text-blue-800 text-xs underline ml-4"
                >
                  {t('dismiss')}
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Liste des lofts */}
      {memberLofts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noAssignedLofts')}</h3>
            <p className="text-gray-600">
              {t('noAssignedLoftsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memberLofts.map((loft) => (
            <Card key={loft.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {loft.name}
                    </CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      {loft.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{loft.address}</span>
                        </div>
                      )}
                      {loft.zone_area_name && (
                        <div className="text-xs text-gray-500">
                          {t('zone')}: {loft.zone_area_name}
                        </div>
                      )}
                    </div>
                  </div>
                  {loft.status && (
                    <Badge className={getStatusColor(loft.status)}>
                      {loft.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Statistiques des tâches */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-600">{loft.taskCounts.todo}</div>
                    <div className="text-xs text-gray-500">{t('toDo')}</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{loft.taskCounts.in_progress}</div>
                    <div className="text-xs text-blue-500">{t('inProgress')}</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{loft.taskCounts.completed}</div>
                    <div className="text-xs text-green-500">{t('completed')}</div>
                  </div>
                </div>

                {/* Liste des tâches */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">{t('yourTasks')} ({loft.taskCounts.total})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loft.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          {getTaskStatusIcon(task.status)}
                          <span className="font-medium truncate">{task.title}</span>
                        </div>
                        <Badge className={`${getTaskStatusColor(task.status)} text-xs`}>
                          {getTaskStatusText(task.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = `/tasks?loft=${loft.id}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('viewUpdateTasks')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}