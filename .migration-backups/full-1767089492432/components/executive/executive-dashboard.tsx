"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MessageSquare,
  Bell,
  Zap,
  Brain,
  Target,
  Activity,
  Gauge,
  Sparkles,
  Eye,
  Shield,
  Rocket
} from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"
import type { AuthSession } from "@/lib/types"

interface ExecutiveDashboardProps {
  session: AuthSession
}

export function ExecutiveDashboard({ session }: ExecutiveDashboardProps) {
  const locale = useLocale()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header Executive */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Exécutif
              </h1>
              <p className="text-xl text-slate-300 mt-2">Tableau de bord exécutif</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-medium border border-red-500/30">
                Confidentiel
              </div>
              <div className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-500/30">
                Exécutif seulement
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Command Center */}
      <div className="px-8 pb-8">
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-400" />
              Executive Command Center
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </CardTitle>
            <p className="text-purple-200">Intelligence Dashboard</p>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-lg">
              Analyse prédictive en temps réel de votre empire immobilier
            </p>
          </CardContent>
        </Card>

        {/* Métriques Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Revenus Totaux</p>
                  <p className="text-3xl font-bold text-white">1 600 DA</p>
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    -100.0% ce mois
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Profit Net</p>
                  <p className="text-3xl font-bold text-white">1 600 DA</p>
                  <p className="text-green-400 text-sm">Marge: 100.0%</p>
                  <p className="text-green-300 text-xs">Performance excellente</p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Taux d'Occupation</p>
                  <p className="text-3xl font-bold text-white">27.3%</p>
                  <p className="text-green-400 text-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +2.9% tendance
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Propriétés Totales</p>
                  <p className="text-3xl font-bold text-white">22</p>
                  <p className="text-slate-400 text-sm">Loyer moyen: NaN DA</p>
                  <p className="text-blue-300 text-xs">Portfolio diversifié</p>
                </div>
                <Rocket className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intelligence Financière */}
        <Card className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-slate-600/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-3">
              <Brain className="h-6 w-6 text-cyan-400" />
              Intelligence Financière
              <Activity className="h-5 w-5 text-green-400" />
            </CardTitle>
            <p className="text-slate-300">Analyse prédictive en temps réel</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Revenus Totaux</p>
                <p className="text-2xl font-bold text-white">1 600 DA</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Dépenses Totales</p>
                <p className="text-2xl font-bold text-white">-0 DA</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Cash Flow</p>
                <p className="text-2xl font-bold text-green-400">1 600 DA</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Maintenance</p>
                <p className="text-2xl font-bold text-white">0 DA</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">Analyse IA en cours...</span>
            </div>
          </CardContent>
        </Card>

        {/* Matrice des Revenus */}
        <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-3">
              <Gauge className="h-6 w-6 text-indigo-400" />
              Matrice des Revenus
              <Eye className="h-5 w-5 text-purple-400" />
            </CardTitle>
            <p className="text-indigo-200">Distribution intelligente</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Revenus Entreprise</p>
                <p className="text-2xl font-bold text-white">0 DA</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Revenus Tiers</p>
                <p className="text-2xl font-bold text-white">0 DA</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Dominance Entreprise</p>
                <p className="text-2xl font-bold text-purple-400">0.0%</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm">Optimisation automatique activée</span>
            </div>
          </CardContent>
        </Card>

        {/* Chronologie quantique */}
        <Card className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-3">
              <Activity className="h-6 w-6 text-cyan-400" />
              Chronologie quantique
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </CardTitle>
            <p className="text-cyan-200">Évolution temporelle des performances</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">September 2025</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">Revenus: <span className="text-white">0 DA</span></p>
                    <p className="text-slate-400">Dépenses: <span className="text-white">-0 DA</span></p>
                    <p className="text-slate-400">Profit: <span className="text-white">0 DA</span></p>
                    <p className="text-slate-400">Occupation: <span className="text-cyan-400">27.3%</span></p>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                  <h4 className="text-white font-semibold mb-2">October 2025</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">Revenus: <span className="text-green-400">1 600 DA</span></p>
                    <p className="text-slate-400">Dépenses: <span className="text-white">-0 DA</span></p>
                    <p className="text-slate-400">Profit: <span className="text-green-400">1 600 DA</span></p>
                    <p className="text-slate-400">Occupation: <span className="text-cyan-400">27.3%</span></p>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">November 2025</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">Revenus: <span className="text-white">0 DA</span></p>
                    <p className="text-slate-400">Dépenses: <span className="text-white">-0 DA</span></p>
                    <p className="text-slate-400">Profit: <span className="text-white">0 DA</span></p>
                    <p className="text-slate-400">Occupation: <span className="text-cyan-400">27.3%</span></p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyse Temporelle */}
        <Card className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-emerald-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
              Analyse Temporelle
              <Brain className="h-5 w-5 text-teal-400" />
            </CardTitle>
            <p className="text-emerald-200">Comparaison multidimensionnelle</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-white font-semibold mb-4">Année Courante</h4>
                <div className="space-y-2">
                  <p className="text-slate-400">Revenus: <span className="text-white">1 600 DA</span></p>
                  <p className="text-slate-400">Dépenses: <span className="text-white">0 DA</span></p>
                  <p className="text-slate-400">Profit: <span className="text-emerald-400">1 600 DA</span></p>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Évolution</h4>
                <div className="space-y-2">
                  <p className="text-slate-400">Revenus: <span className="text-yellow-400">+0.0%</span></p>
                  <p className="text-slate-400">Dépenses: <span className="text-yellow-400">+0.0%</span></p>
                  <p className="text-slate-400">Profit: <span className="text-yellow-400">+0.0%</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Index */}
        <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Performance Index</h3>
                <p className="text-green-400 text-lg font-semibold">Excellent</p>
              </div>
              <div className="text-right">
                <p className="text-6xl font-bold text-yellow-400">65000</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}