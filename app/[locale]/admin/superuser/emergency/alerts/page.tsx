import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Bell, Shield, Activity, Database, Users, Server, Eye } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Alertes Critiques - Superuser',
  description: 'Système d\'alertes de sécurité critiques'
}

export default async function EmergencyAlertsPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8" />
          Alertes Critiques
        </h1>
        <p className="text-gray-600 mt-2">
          Surveillance et gestion des alertes de sécurité critiques
        </p>
      </div>

      {/* Critical Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentatives d'Intrusion</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Système</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">7</div>
            <p className="text-xs text-muted-foreground">
              En surveillance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niveau de Menace</CardTitle>
            <Bell className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">ÉLEVÉ</div>
            <p className="text-xs text-muted-foreground">
              Surveillance renforcée
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Critical Alerts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Alertes Critiques Actives
          </CardTitle>
          <CardDescription>
            Alertes nécessitant une action immédiate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong>Tentatives de connexion suspectes détectées</strong>
                    <div className="text-sm mt-1">
                      15 tentatives échouées depuis l'IP 192.168.1.100 en 5 minutes
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Détecté il y a 2 minutes • Sévérité: CRITIQUE
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      Bloquer IP
                    </Button>
                    <Button size="sm" variant="destructive">
                      Enquêter
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <Database className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong>Accès non autorisé à la base de données</strong>
                    <div className="text-sm mt-1">
                      Tentative d'accès direct à la base avec des privilèges élevés
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Détecté il y a 5 minutes • Sévérité: CRITIQUE
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      Verrouiller DB
                    </Button>
                    <Button size="sm" variant="destructive">
                      Analyser
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert>
              <Server className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong>Utilisation CPU anormalement élevée</strong>
                    <div className="text-sm mt-1">
                      CPU à 95% depuis 10 minutes, processus inconnu détecté
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Détecté il y a 8 minutes • Sévérité: MOYENNE
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      Analyser Processus
                    </Button>
                    <Button size="sm">
                      Surveiller
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Surveillance Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm">Pare-feu</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Actif
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-sm">Détection d'intrusion</span>
              </div>
              <Badge variant="destructive">
                Alertes actives
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-sm">Analyse comportementale</span>
              </div>
              <Badge variant="secondary">
                Surveillance
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm">Chiffrement SSL/TLS</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Opérationnel
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Événements Récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  time: '14:32',
                  type: 'CRITIQUE',
                  event: 'Tentative de force brute détectée',
                  source: 'IP: 203.0.113.45'
                },
                {
                  time: '14:28',
                  type: 'ALERTE',
                  event: 'Connexion depuis nouvelle localisation',
                  source: 'User: admin@example.com'
                },
                {
                  time: '14:15',
                  type: 'INFO',
                  event: 'Mise à jour de sécurité appliquée',
                  source: 'Système automatique'
                },
                {
                  time: '13:45',
                  type: 'ALERTE',
                  event: 'Échec d\'authentification multiple',
                  source: 'IP: 198.51.100.23'
                },
                {
                  time: '13:30',
                  type: 'INFO',
                  event: 'Sauvegarde de sécurité terminée',
                  source: 'Tâche programmée'
                }
              ].map((event, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        event.type === 'CRITIQUE' ? 'destructive' : 
                        event.type === 'ALERTE' ? 'secondary' : 'outline'
                      }>
                        {event.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{event.time}</span>
                    </div>
                    <div className="font-medium text-sm">{event.event}</div>
                    <div className="text-xs text-gray-600">{event.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Response Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Bell className="h-5 w-5" />
            Actions de Réponse d'Urgence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="destructive" className="h-16 flex-col">
              <Shield className="h-5 w-5 mb-1" />
              <span className="text-sm">Verrouillage Immédiat</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col border-red-600 text-red-600 hover:bg-red-50">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-sm">Déconnecter Tous</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col border-orange-600 text-orange-600 hover:bg-orange-50">
              <Database className="h-5 w-5 mb-1" />
              <span className="text-sm">Sauvegarde d'Urgence</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col border-yellow-600 text-yellow-600 hover:bg-yellow-50">
              <AlertTriangle className="h-5 w-5 mb-1" />
              <span className="text-sm">Alerter Équipe</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}