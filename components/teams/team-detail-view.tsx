"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Edit, Users, Calendar, FileText, Trash2 } from "lucide-react"

interface Team {
  id: string
  name: string
  description?: string
  created_at: string
}

interface TeamDetailViewProps {
  team: Team | null
  teamId: string
}

export function TeamDetailView({ team, teamId }: TeamDetailViewProps) {
  const t = useTranslations('teams')
  const router = useRouter()

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-white/80"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('goBack')}
            </Button>
          </div>
          
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('teamNotFound')}</h1>
            <p className="text-gray-600">{t('teamNotFoundDescription', { id: teamId })}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('goBack')}
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Users className="h-3 w-3 mr-1" />
            {t('title')}
          </Badge>
        </div>

        {/* En-tête de l'équipe */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {t('createdAt')}: {format(new Date(team.created_at), "PPP")}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link href={`/teams/${team.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  {t('edit_team')}
                </Link>
              </Button>
              <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                {t('delete_team')}
              </Button>
            </div>
          </div>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Statistiques rapides */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <Users className="h-5 w-5" />
                {t('activeMembers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-sm text-green-600 mt-1">{t('membersCount')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <FileText className="h-5 w-5" />
                {t('activeTasks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">0</div>
              <p className="text-sm text-blue-600 mt-1">{t('tasksInProgress')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                <Calendar className="h-5 w-5" />
                {t('teamAge')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Math.floor((new Date().getTime() - new Date(team.created_at).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <p className="text-sm text-purple-600 mt-1">{t('daysActive')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Détails de l'équipe */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="h-5 w-5" />
              {t('team_details')}
            </CardTitle>
            <CardDescription>{t('basicInformation')}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {t('teamName')}
                </h3>
                <p className="text-lg text-gray-900 font-medium">{team.name}</p>
              </div>

              {team.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t('description')}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{team.description}</p>
                  </div>
                </div>
              )}


            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}