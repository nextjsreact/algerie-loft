"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Search, Clock, User, MessageSquare, Eye } from "lucide-react"
import { useTranslations } from "next-intl"

interface Dispute {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'payment' | 'property' | 'service' | 'booking' | 'other'
  reporter_name: string
  reporter_email: string
  assigned_to?: string
  created_at: string
  updated_at: string
  messages_count: number
}

export function OpenDisputesClient() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const t = useTranslations('disputes')

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      // Simulation de données pour les litiges ouverts
      const mockData: Dispute[] = [
        {
          id: '1',
          title: 'Problème de paiement - Réservation #1234',
          description: 'Le client signale un double prélèvement pour sa réservation',
          status: 'open',
          priority: 'high',
          category: 'payment',
          reporter_name: 'Ahmed Benali',
          reporter_email: 'ahmed.benali@email.com',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          messages_count: 3
        },
        {
          id: '2',
          title: 'Appartement non conforme aux photos',
          description: 'L\'appartement ne correspond pas aux photos publiées sur la plateforme',
          status: 'in_progress',
          priority: 'medium',
          category: 'property',
          reporter_name: 'Fatima Khelifi',
          reporter_email: 'fatima.khelifi@email.com',
          assigned_to: 'Manager Support',
          created_at: '2024-01-14T14:20:00Z',
          updated_at: '2024-01-16T09:15:00Z',
          messages_count: 7
        },
        {
          id: '3',
          title: 'Service client non réactif',
          description: 'Aucune réponse depuis 48h concernant une demande d\'annulation',
          status: 'open',
          priority: 'urgent',
          category: 'service',
          reporter_name: 'Karim Messaoudi',
          reporter_email: 'karim.messaoudi@email.com',
          created_at: '2024-01-16T16:45:00Z',
          updated_at: '2024-01-16T16:45:00Z',
          messages_count: 1
        }
      ]
      setDisputes(mockData)
    } catch (error) {
      console.error('Erreur lors du chargement des litiges:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || dispute.status === filterStatus
    const matchesPriority = filterPriority === 'all' || dispute.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des litiges...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Litiges ouverts</h1>
          <p className="text-gray-600">Consulter et suivre les litiges en cours</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un litige..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="urgent">Urgent</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
            <Button variant="outline">
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {disputes.filter(d => d.status === 'open').length}
                </p>
                <p className="text-sm text-gray-600">Ouverts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {disputes.filter(d => d.status === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {disputes.filter(d => d.priority === 'urgent' || d.priority === 'high').length}
                </p>
                <p className="text-sm text-gray-600">Priorité élevée</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {disputes.reduce((sum, d) => sum + d.messages_count, 0)}
                </p>
                <p className="text-sm text-gray-600">Messages totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des litiges */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <Card key={dispute.id} className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{dispute.title}</h3>
                      <p className="text-gray-600 mb-3">{dispute.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={getStatusColor(dispute.status)}>
                          {dispute.status === 'open' ? 'Ouvert' :
                           dispute.status === 'in_progress' ? 'En cours' :
                           dispute.status === 'resolved' ? 'Résolu' : 'Fermé'}
                        </Badge>
                        <Badge className={getPriorityColor(dispute.priority)}>
                          {dispute.priority === 'urgent' ? 'Urgent' :
                           dispute.priority === 'high' ? 'Élevée' :
                           dispute.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </Badge>
                        <Badge variant="outline">
                          {dispute.category === 'payment' ? 'Paiement' :
                           dispute.category === 'property' ? 'Propriété' :
                           dispute.category === 'service' ? 'Service' :
                           dispute.category === 'booking' ? 'Réservation' : 'Autre'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Rapporté par:</strong> {dispute.reporter_name}</p>
                          <p><strong>Email:</strong> {dispute.reporter_email}</p>
                        </div>
                        <div>
                          <p><strong>Créé le:</strong> {new Date(dispute.created_at).toLocaleDateString('fr-FR')}</p>
                          <p><strong>Mis à jour:</strong> {new Date(dispute.updated_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          {dispute.assigned_to && (
                            <p><strong>Assigné à:</strong> {dispute.assigned_to}</p>
                          )}
                          <p><strong>Messages:</strong> {dispute.messages_count}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Répondre
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDisputes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun litige trouvé</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Aucun litige ne correspond aux critères de recherche.'
                : 'Il n\'y a actuellement aucun litige ouvert.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}