'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTranslations } from 'next-intl'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Zap,
  Globe,
  Shield,
  Star,
  Activity,
  Eye,
  Brain,
  Sparkles,
  Rocket,
  Crown,
  Diamond,
  Flame
} from 'lucide-react'

interface ExecutiveMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  cashFlow: number
  totalLofts: number
  occupancyRate: number
  averageRentPrice: number
  maintenanceCosts: number
  revenueGrowth: number
  expenseGrowth: number
  occupancyTrend: number
  companyRevenue: number
  thirdPartyRevenue: number
  companyProfitShare: number
  criticalAlerts: any[]
  monthlyTrends: any[]
  yearOverYearComparison: any
}

interface ExecutiveDashboardProps {
  metrics: ExecutiveMetrics
}

export function ExecutiveDashboard({ metrics }: ExecutiveDashboardProps) {
  const t = useTranslations('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [animatedValues, setAnimatedValues] = useState({
    revenue: 0,
    profit: 0,
    occupancy: 0,
    lofts: 0
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Animation des valeurs au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
      const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
        const startTime = Date.now()
        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const easeOutQuart = 1 - Math.pow(1 - progress, 4)
          const current = start + (end - start) * easeOutQuart
          callback(current)
          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }
        animate()
      }

      animateValue(0, metrics.totalRevenue, 2000, (value) => 
        setAnimatedValues(prev => ({ ...prev, revenue: value }))
      )
      animateValue(0, metrics.netProfit, 2200, (value) => 
        setAnimatedValues(prev => ({ ...prev, profit: value }))
      )
      animateValue(0, metrics.occupancyRate, 1800, (value) => 
        setAnimatedValues(prev => ({ ...prev, occupancy: value }))
      )
      animateValue(0, metrics.totalLofts, 1500, (value) => 
        setAnimatedValues(prev => ({ ...prev, lofts: value }))
      )
    }, 500)

    return () => clearTimeout(timer)
  }, [metrics])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 5) return <Rocket className="h-4 w-4 text-emerald-500" />
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (growth < -5) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-orange-500" />
    return <Activity className="h-4 w-4 text-blue-500" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-emerald-500'
    if (growth > 0) return 'text-green-500'
    if (growth < -5) return 'text-red-500'
    if (growth < 0) return 'text-orange-500'
    return 'text-blue-500'
  }

  const getGradientClass = (type: string) => {
    const gradients = {
      revenue: 'from-emerald-500 via-teal-500 to-cyan-500',
      profit: 'from-violet-500 via-purple-500 to-indigo-500',
      occupancy: 'from-orange-500 via-amber-500 to-yellow-500',
      lofts: 'from-blue-500 via-indigo-500 to-purple-500',
      alert: 'from-red-500 via-pink-500 to-rose-500'
    }
    return gradients[type as keyof typeof gradients] || gradients.revenue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Éléments de fond futuristes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 space-y-8 p-8">
        {/* En-tête Executive avec effet holographique */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-full mb-6">
            <Crown className="h-6 w-6 text-yellow-400" />
            <span className="text-white font-medium">Executive Command Center</span>
            <Diamond className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Intelligence Dashboard
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Analyse prédictive en temps réel de votre empire immobilier
          </p>
        </div>

        {/* Alertes critiques avec design futuriste */}
        {metrics.criticalAlerts && metrics.criticalAlerts.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-xl rounded-3xl"></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-red-500/30 shadow-2xl shadow-red-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                    Alertes Critiques
                  </span>
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                    {metrics.criticalAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.criticalAlerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl hover:border-red-500/50 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                          </div>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} 
                                 className="bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30">
                            {alert.severity}
                          </Badge>
                          <div>
                            <p className="font-semibold text-white">{alert.title}</p>
                            <p className="text-sm text-slate-300">{alert.description}</p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-red-500/25">
                          <Zap className="h-4 w-4 mr-2" />
                          Résoudre
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Métriques principales avec design holographique */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenus Totaux */}
          <div className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass('revenue')} opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition-all duration-500`}></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-emerald-300">Revenus Totaux</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(animatedValues.revenue)}
                </div>
                <div className={`flex items-center text-sm ${getGrowthColor(metrics.revenueGrowth)}`}>
                  {getGrowthIcon(metrics.revenueGrowth)}
                  <span className="ml-2 font-medium">{formatPercentage(metrics.revenueGrowth)} ce mois</span>
                </div>
                <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" 
                       style={{ width: `${Math.min((animatedValues.revenue / metrics.totalRevenue) * 100, 100)}%` }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profit Net */}
          <div className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass('profit')} opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition-all duration-500`}></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-300">Profit Net</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(animatedValues.profit)}
                </div>
                <div className="text-sm text-purple-300 mb-3">
                  Marge: <span className="font-bold text-white">{metrics.profitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-slate-300">Performance excellente</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Taux d'Occupation */}
          <div className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass('occupancy')} opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition-all duration-500`}></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-orange-300">Taux d'Occupation</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white mb-3">
                  {animatedValues.occupancy.toFixed(1)}%
                </div>
                <div className="relative mb-3">
                  <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 relative" 
                         style={{ width: `${animatedValues.occupancy}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center text-sm ${getGrowthColor(metrics.occupancyTrend)}`}>
                  {getGrowthIcon(metrics.occupancyTrend)}
                  <span className="ml-2 font-medium">{formatPercentage(metrics.occupancyTrend)} tendance</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Propriétés Totales */}
          <div className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass('lofts')} opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition-all duration-500`}></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-300">Propriétés Totales</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white mb-2">
                  {Math.round(animatedValues.lofts)}
                </div>
                <div className="text-sm text-blue-300 mb-3">
                  Loyer moyen: <span className="font-bold text-white">{formatCurrency(metrics.averageRentPrice)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-slate-300">Portfolio diversifié</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métriques financières détaillées avec design neural */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Performance Financière */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl rounded-3xl group-hover:blur-2xl transition-all duration-500"></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Intelligence Financière</CardTitle>
                    <CardDescription className="text-cyan-300">Analyse prédictive en temps réel</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-emerald-300">Revenus Totaux</span>
                    </div>
                    <span className="font-bold text-white text-lg">{formatCurrency(metrics.totalRevenue)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-red-300">Dépenses Totales</span>
                    </div>
                    <span className="font-bold text-red-400 text-lg">-{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <Flame className="h-5 w-5 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">Cash Flow</span>
                    </div>
                    <span className={`font-bold text-xl ${metrics.cashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(metrics.cashFlow)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-300">Maintenance</span>
                    </div>
                    <span className="font-bold text-white">{formatCurrency(metrics.maintenanceCosts)}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">Analyse IA en cours...</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Répartition des Revenus */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-3xl group-hover:blur-2xl transition-all duration-500"></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Matrice des Revenus</CardTitle>
                    <CardDescription className="text-purple-300">Distribution intelligente</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-300">Revenus Entreprise</span>
                      </div>
                      <span className="font-bold text-white">{formatCurrency(metrics.companyRevenue)}</span>
                    </div>
                    <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full relative transition-all duration-1000" 
                           style={{ width: `${metrics.companyProfitShare}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">Revenus Tiers</span>
                      </div>
                      <span className="font-bold text-white">{formatCurrency(metrics.thirdPartyRevenue)}</span>
                    </div>
                    <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full relative transition-all duration-1000" 
                           style={{ width: `${100 - metrics.companyProfitShare}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm font-medium text-purple-300">Dominance Entreprise</span>
                    </div>
                    <span className="font-bold text-xl text-white">{metrics.companyProfitShare.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Optimisation automatique activée</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tendances mensuelles avec visualisation futuriste */}
        {metrics.monthlyTrends && metrics.monthlyTrends.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl rounded-3xl"></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">Chronologie Quantique</CardTitle>
                    <CardDescription className="text-indigo-300">Évolution temporelle des performances</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid gap-6 md:grid-cols-3">
                  {metrics.monthlyTrends.slice(-3).map((trend, index) => (
                    <div key={index} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                      <div className="relative p-6 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-indigo-500/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-lg text-white">{trend.month}</h4>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-100"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                              <span className="text-emerald-300">Revenus</span>
                            </div>
                            <span className="font-bold text-white">{formatCurrency(trend.revenue)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                              <span className="text-red-300">Dépenses</span>
                            </div>
                            <span className="font-bold text-red-400">-{formatCurrency(trend.expenses)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="text-purple-300">Profit</span>
                            </div>
                            <span className={`font-bold ${trend.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatCurrency(trend.profit)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-300">Occupation</span>
                            </div>
                            <span className="font-bold text-white">{trend.occupancyRate.toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" 
                                 style={{ width: `${Math.min(trend.occupancyRate, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comparaison année sur année avec design temporel */}
        {metrics.yearOverYearComparison && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-xl rounded-3xl"></div>
            <Card className="relative bg-black/40 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-blue-500/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">Analyse Temporelle</CardTitle>
                    <CardDescription className="text-emerald-300">Comparaison multidimensionnelle</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid gap-8 md:grid-cols-2">
                  {/* Année Courante */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-white">Année Courante</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-emerald-300 font-medium">Revenus</span>
                          </div>
                          <span className="font-bold text-white text-lg">
                            {formatCurrency(metrics.yearOverYearComparison.currentYear.revenue)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl border border-red-500/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span className="text-red-300 font-medium">Dépenses</span>
                          </div>
                          <span className="font-bold text-red-400 text-lg">
                            {formatCurrency(metrics.yearOverYearComparison.currentYear.expenses)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-purple-300 font-medium">Profit</span>
                          </div>
                          <span className="font-bold text-white text-lg">
                            {formatCurrency(metrics.yearOverYearComparison.currentYear.profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Croissance */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                        <Rocket className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-white">Évolution</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-black/20 rounded-xl border border-white/10 hover:border-emerald-500/50 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <span className="text-cyan-300 font-medium">Revenus</span>
                          </div>
                          <div className={`flex items-center gap-2 ${getGrowthColor(metrics.yearOverYearComparison.growth.revenue)}`}>
                            {getGrowthIcon(metrics.yearOverYearComparison.growth.revenue)}
                            <span className="font-bold text-lg">
                              {formatPercentage(metrics.yearOverYearComparison.growth.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-black/20 rounded-xl border border-white/10 hover:border-orange-500/50 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            <span className="text-orange-300 font-medium">Dépenses</span>
                          </div>
                          <div className={`flex items-center gap-2 ${getGrowthColor(metrics.yearOverYearComparison.growth.expenses)}`}>
                            {getGrowthIcon(metrics.yearOverYearComparison.growth.expenses)}
                            <span className="font-bold text-lg">
                              {formatPercentage(metrics.yearOverYearComparison.growth.expenses)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Diamond className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 font-medium">Profit</span>
                          </div>
                          <div className={`flex items-center gap-2 ${getGrowthColor(metrics.yearOverYearComparison.growth.profit)}`}>
                            {getGrowthIcon(metrics.yearOverYearComparison.growth.profit)}
                            <span className="font-bold text-xl">
                              {formatPercentage(metrics.yearOverYearComparison.growth.profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Indicateur de performance global */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Performance Index</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
                      ))}
                    </div>
                    <span className="text-white font-bold">Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}