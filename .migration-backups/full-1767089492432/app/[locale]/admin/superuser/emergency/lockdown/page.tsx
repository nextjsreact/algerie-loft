import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Lock, AlertTriangle, Shield, Users, Database, Server } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Verrouillage d\'Urgence - Superuser',
  description: 'Système de verrouillage d\'urgence'
}

export default async function EmergencyLockdownPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
          <Lock className="h-8 w-8" />
          Verrouillage d'Urgence
        </h1>
        <p className="text-gray-600 mt-2">
          Système de sécurité d'urgence pour verrouiller l'accès au système
        </p>
      </div>

      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>ATTENTION:</strong> Ces actions peuvent affecter gravement le fonctionnement du système. 
          Utilisez uniquement en cas d'urgence de sécurité.
        </AlertDescription>
      </Alert>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            État Actuel du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium">Accès Utilisateurs</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Normal
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="font-medium">Base de Données</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Accessible
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-green-600" />
                <span className="font-medium">Services API</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Opérationnel
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Actions de Verrouillage
            </CardTitle>
            <CardDescription>
              Verrouillages d'urgence par niveau de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <h4 className="font-semibold text-yellow-800 mb-2">Niveau 1 - Verrouillage Partiel</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Bloque les nouvelles connexions, maintient les sessions actives
                </p>
                <Button variant="outline" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                  Activer Verrouillage Partiel
                </Button>
              </div>

              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <h4 className="font-semibold text-orange-800 mb-2">Niveau 2 - Verrouillage Complet</h4>
                <p className="text-sm text-orange-700 mb-3">
                  Déconnecte tous les utilisateurs sauf superusers
                </p>
                <Button variant="outline" className="w-full border-orange-600 text-orange-700 hover:bg-orange-100">
                  Activer Verrouillage Complet
                </Button>
              </div>

              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-semibold text-red-800 mb-2">Niveau 3 - Arrêt d'Urgence</h4>
                <p className="text-sm text-red-700 mb-3">
                  Arrêt complet du système, accès superuser uniquement
                </p>
                <Button variant="destructive" className="w-full">
                  ARRÊT D'URGENCE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Historique des Verrouillages
            </CardTitle>
            <CardDescription>
              Dernières actions de sécurité d'urgence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  date: '2024-01-10 15:30',
                  type: 'Test Niveau 1',
                  duration: '5 minutes',
                  reason: 'Test de sécurité programmé',
                  status: 'Terminé'
                },
                {
                  date: '2023-12-15 09:45',
                  type: 'Niveau 2',
                  duration: '2 heures',
                  reason: 'Tentative d\'intrusion détectée',
                  status: 'Résolu'
                },
                {
                  date: '2023-11-28 14:20',
                  type: 'Test Niveau 1',
                  duration: '10 minutes',
                  reason: 'Maintenance de sécurité',
                  status: 'Terminé'
                }
              ].map((event, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{event.type}</div>
                    <Badge variant="outline" className="text-green-600">
                      {event.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>{event.date} • Durée: {event.duration}</div>
                    <div className="mt-1">Raison: {event.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Actions Rapides de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-sm">Déconnecter Tous</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col">
              <Database className="h-5 w-5 mb-1" />
              <span className="text-sm">Mode Lecture Seule</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col">
              <Server className="h-5 w-5 mb-1" />
              <span className="text-sm">Bloquer API</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}