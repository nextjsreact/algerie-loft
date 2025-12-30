"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  Users, 
  Home, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings
} from "lucide-react"

interface AdminDashboardProps {
  stats: {
    totalLofts: number
    availableLofts: number
    occupiedLofts: number
    maintenanceLofts: number
    totalBookings: number
    monthlyRevenue: number
    totalUsers: number
    pendingRequests: number
  }
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const occupancyRate = Math.round((stats.occupiedLofts / stats.totalLofts) * 100)
  const availabilityRate = Math.round((stats.availableLofts / stats.totalLofts) * 100)

  return (
    <div className="space-y-8">
      {/* En-tête du dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏢 Dashboard Administrateur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vue d'ensemble de votre plateforme de location
          </p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Lofts
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalLofts}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Réservations
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalBookings}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+8%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenus Mensuels
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+15%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Utilisateurs
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+5%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statut des lofts et alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Statut des Lofts</CardTitle>
            <CardDescription>
              Répartition actuelle de vos propriétés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-800">
                    Disponibles
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.availableLofts} lofts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-green-600">
                    {availabilityRate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800">
                    Occupés
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.occupiedLofts} lofts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-blue-600">
                    {occupancyRate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Maintenance
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.maintenanceLofts} lofts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-yellow-600">
                    {Math.round((stats.maintenanceLofts / stats.totalLofts) * 100)}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Taux d'occupation</span>
                  <span className="text-xl font-bold text-blue-600">
                    {occupancyRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚨 Alertes & Notifications</CardTitle>
            <CardDescription>
              Actions requises et mises à jour importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {stats.pendingRequests} demandes en attente
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Nécessitent votre attention
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Voir
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    3 lofts en maintenance
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300">
                    Vérifiez les délais de réparation
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Voir
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Système à jour
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    Toutes les fonctionnalités opérationnelles
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Actions Rapides</CardTitle>
          <CardDescription>
            Accès direct aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col gap-2" asChild>
              <a href="/business">
                <Home className="h-6 w-6" />
                <span className="text-sm">Gérer Lofts</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
              <a href="/admin/users">
                <Users className="h-6 w-6" />
                <span className="text-sm">Utilisateurs</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
              <a href="/admin/reports">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Rapports</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Réservations</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}