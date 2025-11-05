import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Archive, Search, Download, Calendar, Database, FileText, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Archives - Superuser',
  description: 'Gestion des données archivées'
}

export default async function ArchivesPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestion des Archives
        </h1>
        <p className="text-gray-600 mt-2">
          Accès et gestion des données historiques archivées
        </p>
      </div>

      {/* Archive Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Archives</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              Entrées archivées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace Utilisé</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2 GB</div>
            <p className="text-xs text-muted-foreground">
              Données archivées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Archive</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hier</div>
            <p className="text-xs text-muted-foreground">
              Archivage automatique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rétention</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 ans</div>
            <p className="text-xs text-muted-foreground">
              Politique actuelle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche dans les Archives
          </CardTitle>
          <CardDescription>
            Rechercher et filtrer les données archivées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10"
              />
            </div>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Type de données" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="users">Utilisateurs</SelectItem>
                <SelectItem value="reservations">Réservations</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="logs">Logs système</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Dernier mois</SelectItem>
                <SelectItem value="last-quarter">Dernier trimestre</SelectItem>
                <SelectItem value="last-year">Dernière année</SelectItem>
                <SelectItem value="older">Plus ancien</SelectItem>
              </SelectContent>
            </Select>

            <Button className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archive Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Archives Utilisateurs
            </CardTitle>
            <CardDescription>
              Données utilisateurs archivées et supprimées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { date: '2024-01-10', type: 'Comptes supprimés', count: 15, size: '2.3 MB' },
              { date: '2024-01-05', type: 'Profils inactifs', count: 45, size: '8.7 MB' },
              { date: '2023-12-28', type: 'Sessions expirées', count: 234, size: '12.1 MB' },
            ].map((archive, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{archive.type}</div>
                  <div className="text-xs text-gray-500">
                    {archive.date} • {archive.count} entrées • {archive.size}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Archives Système
            </CardTitle>
            <CardDescription>
              Logs système et données de performance archivées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { date: '2024-01-10', type: 'Logs d\'audit', count: 1247, size: '45.2 MB' },
              { date: '2024-01-05', type: 'Métriques performance', count: 8934, size: '123.4 MB' },
              { date: '2023-12-28', type: 'Logs d\'erreur', count: 156, size: '5.8 MB' },
            ].map((archive, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{archive.type}</div>
                  <div className="text-xs text-gray-500">
                    {archive.date} • {archive.count} entrées • {archive.size}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Archive Policies */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Politiques d'Archivage
          </CardTitle>
          <CardDescription>
            Configuration des règles d'archivage automatique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                type: 'Données utilisateur', 
                retention: '2 ans après suppression', 
                frequency: 'Mensuel',
                status: 'Actif'
              },
              { 
                type: 'Logs système', 
                retention: '1 an', 
                frequency: 'Hebdomadaire',
                status: 'Actif'
              },
              { 
                type: 'Transactions', 
                retention: '7 ans (légal)', 
                frequency: 'Quotidien',
                status: 'Actif'
              },
              { 
                type: 'Métriques performance', 
                retention: '6 mois', 
                frequency: 'Quotidien',
                status: 'Actif'
              },
            ].map((policy, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{policy.type}</div>
                  <div className="text-sm text-gray-600">
                    Rétention: {policy.retention} • Fréquence: {policy.frequency}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {policy.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}