"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gavel, Search, User, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react"
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
  resolution_notes?: string
  messages: DisputeMessage[]
}

interface DisputeMessage {
  id: string
  author: string
  message: string
  created_at: string
  is_internal: boolean
}

export function ManageDisputesClient() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [newStatus, setNewStatus] = useState<string>("")
  const t = useTranslations('disputes')

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      // Simulation de données pour la gestion des litiges
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
          messages: [
            {
              id: '1',
              author: 'Ahmed Benali',
              message: 'Bonjour, j\'ai été prélevé deux fois pour ma réservation du 15 janvier. Pouvez-vous vérifier ?',
              created_at: '2024-01-15T10:30:00Z',
              is_internal: false
            },
            {
              id: '2',
              author: 'Support Client',
              message: 'Nous avons bien reçu votre demande et vérifions actuellement votre dossier.',
              created_at: '2024-01-15T11:00:00Z',
              is_internal: false
            }
          ]
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
          messages: [
            {
              id: '3',
              author: 'Fatima Khelifi',
              message: 'L\'appartement que j\'ai réservé ne ressemble pas du tout aux photos. Il y a plusieurs problèmes de propreté.',
              created_at: '2024-01-14T14:20:00Z',
              is_internal: false
            }
          ]
        }
      ]
      setDisputes(mockData)
    } catch (error) {
      console.error('Erreur lors du chargement des litiges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return

    const message: DisputeMessage = {
      id: Date.now().toString(),
      author: 'Support Manager',
      message: newMessage,
      created_at: new Date().toISOString(),
      is_internal: false
    }

    setDisputes(prev => prev.map(dispute =>
      dispute.id === selectedDispute.id
        ? { ...dispute, messages: [...dispute.messages, message] }
        : dispute
    ))

    setSelectedDispute(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null)
    setNewMessage("")
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedDispute) return

    setDisputes(prev => prev.map(dispute =>
      dispute.id === selectedDispute.id
        ? { 
            ...dispute, 
            status: status as any,
            resolution_notes: status === 'resolved' || status === 'closed' ? resolutionNotes : undefined,
            updated_at: new Date().toISOString()
          }
        : dispute
    ))

    setSelectedDispute(prev => prev ? { 
      ...prev, 
      status: status as any,
      resolution_notes: status === 'resolved' || status === 'closed' ? resolutionNotes : undefined
    } : null)
    
    setResolutionNotes("")
  }

  const filteredDisputes = disputes.filter(dispute =>
    dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.reporter_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <Gavel className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des litiges</h1>
          <p className="text-gray-600">Résoudre et gérer les litiges de la plateforme</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des litiges */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Rechercher un litige
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Rechercher par titre ou nom du rapporteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredDisputes.map((dispute) => (
              <Card 
                key={dispute.id}
                className={`cursor-pointer transition-all ${
                  selectedDispute?.id === dispute.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedDispute(dispute)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">{dispute.title}</h3>
                      <Badge 
                        variant={dispute.status === 'open' ? 'destructive' : 
                                dispute.status === 'in_progress' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {dispute.status === 'open' ? 'Ouvert' :
                         dispute.status === 'in_progress' ? 'En cours' :
                         dispute.status === 'resolved' ? 'Résolu' : 'Fermé'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{dispute.reporter_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Détails du litige sélectionné */}
        <div>
          {selectedDispute ? (
            <div className="space-y-4">
              {/* Informations du litige */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Détails du litige</span>
                    <Badge 
                      variant={selectedDispute.status === 'open' ? 'destructive' : 
                              selectedDispute.status === 'in_progress' ? 'default' : 'secondary'}
                    >
                      {selectedDispute.status === 'open' ? 'Ouvert' :
                       selectedDispute.status === 'in_progress' ? 'En cours' :
                       selectedDispute.status === 'resolved' ? 'Résolu' : 'Fermé'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedDispute.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{selectedDispute.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Rapporté par</p>
                      <p className="text-gray-600">{selectedDispute.reporter_name}</p>
                      <p className="text-gray-600">{selectedDispute.reporter_email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Priorité</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedDispute.priority === 'urgent' ? 'Urgent' :
                         selectedDispute.priority === 'high' ? 'Élevée' :
                         selectedDispute.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                    </div>
                  </div>

                  {selectedDispute.resolution_notes && (
                    <div>
                      <p className="font-medium text-gray-700">Notes de résolution</p>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded text-sm">
                        {selectedDispute.resolution_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation ({selectedDispute.messages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedDispute.messages.map((message) => (
                      <div key={message.id} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{message.author}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Nouvelle réponse */}
              <Card>
                <CardHeader>
                  <CardTitle>Répondre au litige</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Tapez votre réponse..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Envoyer la réponse
                  </Button>
                </CardContent>
              </Card>

              {/* Actions de gestion */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions de gestion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Changer le statut
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un nouveau statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Ouvert</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="resolved">Résolu</SelectItem>
                        <SelectItem value="closed">Fermé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newStatus === 'resolved' || newStatus === 'closed') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes de résolution
                      </label>
                      <Textarea
                        placeholder="Expliquez comment le litige a été résolu..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleUpdateStatus(newStatus)}
                      disabled={!newStatus}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mettre à jour le statut
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionner un litige</h3>
                <p className="text-gray-600">Cliquez sur un litige dans la liste pour le gérer.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}