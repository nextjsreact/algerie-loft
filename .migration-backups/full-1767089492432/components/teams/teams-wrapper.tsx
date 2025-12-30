"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Users, Calendar, Settings, TrendingUp, Activity, Target, Clock, Search, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import "../../styles/teams-animations.css"
import { getTeamColorByName } from "./team-colors"

interface Team {
  id: string
  name: string
  description?: string
  created_by_name: string
  member_count: string
  active_tasks: string
}

interface TeamsWrapperProps {
  teams: Team[]
  userRole: string
}

export function TeamsWrapper({ teams, userRole }: TeamsWrapperProps) {
  const t = useTranslations("teams")
  const tCommon = useTranslations("common")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTeams, setFilteredTeams] = useState(teams)

  // Filtrage des équipes basé sur la recherche
  useEffect(() => {
    const filtered = teams.filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTeams(filtered)
  }, [searchTerm, teams])



  // Attendre que les traductions soient prêtes
  if (false) { // next-intl translations are ready immediately
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-700">{t('loading')}</p>
                <p className="text-gray-500">{t('preparingWorkspace')}</p>
              </div>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* En-tête de la page avec design moderne */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative px-8 py-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {t('title')}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                      <span className="text-sm text-gray-500 font-medium">{t(filteredTeams.length === 1 ? 'teamCount' : 'teamCountPlural', { count: filteredTeams.length })}</span>
                    </div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>
              
              {userRole === "admin" && (
                <Button 
                  asChild 
                  className="gradient-button text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/teams/new" className="flex items-center gap-3 px-8 py-4 text-base font-semibold">
                    <Plus className="h-5 w-5" />
                    <span>{t('addTeam')}</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        {teams.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-center text-sm text-gray-600 mt-3">
                {t(filteredTeams.length === 1 ? 'teamFoundCount' : 'teamFoundCountPlural', { count: filteredTeams.length })}
              </p>
            )}
          </div>
        )}

        {/* Statistiques rapides avec design moderne */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                    {t('totalTeams')}
                  </p>
                  <p className="text-4xl font-bold text-gray-900">{filteredTeams.length}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>{t('activeTeams')}</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors duration-300">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                    {t('activeMembers')}
                  </p>
                  <p className="text-4xl font-bold text-gray-900">
                    {filteredTeams.reduce((total, team) => total + parseInt(team.member_count), 0)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>{t('collaborators')}</span>
                  </div>
                </div>
                <div className="p-4 bg-emerald-100 rounded-2xl group-hover:bg-emerald-200 transition-colors duration-300">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
                    {t('tasksInProgress')}
                  </p>
                  <p className="text-4xl font-bold text-gray-900">
                    {filteredTeams.reduce((total, team) => total + parseInt(team.active_tasks), 0)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4 text-amber-500" />
                    <span>{t('inProgress')}</span>
                  </div>
                </div>
                <div className="p-4 bg-amber-100 rounded-2xl group-hover:bg-amber-200 transition-colors duration-300">
                  <Calendar className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des équipes */}
        {filteredTeams.length === 0 && teams.length === 0 ? (
          <Card className="relative overflow-hidden bg-white border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100/50"></div>
            <CardContent className="relative text-center py-20">
              <div className="max-w-md mx-auto space-y-6">
                <div className="p-6 bg-gray-100 rounded-full w-fit mx-auto">
                  <Users className="h-16 w-16 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t('noTeamsFound')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t('noTeamsDescription')}
                  </p>
                </div>
                {userRole === "admin" && (
                  <Button 
                    asChild 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/teams/new" className="flex items-center gap-2 px-8 py-3">
                      <Plus className="h-5 w-5" />
                      <span className="font-semibold">{t('createTeam')}</span>
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : filteredTeams.length === 0 ? (
          <Card className="relative overflow-hidden bg-white border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100/50"></div>
            <CardContent className="relative text-center py-20">
              <div className="max-w-md mx-auto space-y-6">
                <div className="p-6 bg-gray-100 rounded-full w-fit mx-auto">
                  <Search className="h-16 w-16 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t('noTeamsFound')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t('noSearchResults', { searchTerm })}
                  </p>
                </div>
                <Button 
                  onClick={() => setSearchTerm("")}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {t('clearSearch')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team, index) => {
              const teamColor = getTeamColorByName(team.name);
              return (
                <Card 
                  key={team.id} 
                  className="team-card group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  {/* Gradient de fond animé avec couleur de l'équipe */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${teamColor.bg}/50 via-white to-${teamColor.name}-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <CardHeader className="relative pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-br ${teamColor.bg} to-${teamColor.name}-100 rounded-xl group-hover:${teamColor.hover} transition-colors duration-300`}>
                          <Users className={`h-5 w-5 ${teamColor.text}`} />
                        </div>
                        <CardTitle className={`text-xl font-bold text-gray-900 group-hover:${teamColor.text} transition-colors duration-300`}>
                          {team.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{t('createdBy')}</span> 
                        <span className={`${teamColor.text} font-semibold`}>{team.created_by_name}</span>
                      </CardDescription>
                    </div>
                    <div className={`flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full px-4 py-2 group-hover:${teamColor.bg} group-hover:to-${teamColor.name}-100 transition-all duration-300`}>
                      <Users className={`h-4 w-4 text-gray-600 group-hover:${teamColor.text}`} />
                      <span className={`text-sm font-bold text-gray-700 group-hover:${teamColor.text}`}>
                        {parseInt(team.member_count)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-6">
                  {/* Description de l'équipe */}
                  {team.description && (
                    <div className={`bg-gradient-to-r from-gray-50 to-${teamColor.name}-50/30 rounded-xl p-4 border ${teamColor.border}/50`}>
                      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                        {team.description}
                      </p>
                    </div>
                  )}

                  {/* Statistiques de l'équipe avec design amélioré */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">{t("members")}</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-800">{parseInt(team.member_count)}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">{t("tasks")}</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-800">{parseInt(team.active_tasks)}</p>
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <div className="flex justify-center">
                    <Badge 
                      variant={parseInt(team.active_tasks) > 0 ? "default" : "secondary"}
                      className={`font-semibold px-4 py-2 ${
                        parseInt(team.active_tasks) > 0 
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" 
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {parseInt(team.active_tasks) > 0 
                        ? t(parseInt(team.active_tasks) === 1 ? "activeTaskCount" : "activeTaskCountPlural", { count: parseInt(team.active_tasks) })
                        : t("noActiveTasks")
                      }
                    </Badge>
                  </div>

                  {/* Actions avec design moderne */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className={`flex-1 ${teamColor.border} ${teamColor.text} ${teamColor.hover} hover:${teamColor.border} hover:${teamColor.text} transition-all duration-300 font-semibold`}
                    >
                      <Link href={`/teams/${team.id}`} className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{t("view")}</span>
                      </Link>
                    </Button>
                    
                    {userRole === "admin" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-300 font-semibold"
                      >
                        <Link href={`/teams/${team.id}/edit`} className="flex items-center justify-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>{t("edit")}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  )
}