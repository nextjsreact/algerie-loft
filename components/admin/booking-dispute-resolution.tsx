'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AlertTriangle, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Eye,
  FileText
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface BookingDispute {
  id: string
  booking_id: string
  dispute_type: 'cancellation' | 'refund' | 'property_issue' | 'payment' | 'other'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  reported_by: 'client' | 'partner'
  created_at: string
  updated_at: string
  resolution_notes?: string
  resolved_by?: string
  resolved_at?: string
  booking: {
    id: string
    check_in: string
    check_out: string
    total_price: number
    status: string
    client: {
      id: string
      full_name: string
      email: string
    }
    partner: {
      id: string
      full_name: string
      email: string
    }
    loft: {
      id: string
      name: string
      address: string
    }
  }
  messages: DisputeMessage[]
}

interface DisputeMessage {
  id: string
  dispute_id: string
  sender_id: string
  sender_role: 'client' | 'partner' | 'admin'
  message: string
  created_at: string
  sender: {
    full_name: string
    email: string
  }
}

interface DisputeResolution {
  disputeId: string
  status: 'resolved' | 'closed'
  resolution: string
  refund_amount?: number
  compensation?: number
}

export function BookingDisputeResolution() {
  const t = useTranslations('admin.disputes')
  const [disputes, setDisputes] = useState<BookingDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('open')
  const [selectedDispute, setSelectedDispute] = useState<BookingDispute | null>(null)
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [resolutionData, setResolutionData] = useState<Partial<DisputeResolution>>({})
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchDisputes(activeTab)
  }, [activeTab])

  const fetchDisputes = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/disputes?status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setDisputes(data)
      }
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (disputeId: string, newStatus: string, priority?: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, status: newStatus, priority })
      })

      if (response.ok) {
        await fetchDisputes(activeTab)
      }
    } catch (error) {
      console.error('Error updating dispute status:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleResolution = async () => {
    if (!selectedDispute || !resolutionData.resolution) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          status: resolutionData.status,
          resolution: resolutionData.resolution,
          refund_amount: resolutionData.refund_amount,
          compensation: resolutionData.compensation
        })
      })

      if (response.ok) {
        await fetchDisputes(activeTab)
        setIsResolutionDialogOpen(false)
        setResolutionData({})
        setSelectedDispute(null)
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/disputes/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          message: newMessage
        })
      })

      if (response.ok) {
        // Refresh dispute details
        const updatedResponse = await fetch(`/api/admin/disputes/${selectedDispute.id}`)
        if (updatedResponse.ok) {
          const updatedDispute = await updatedResponse.json()
          setSelectedDispute(updatedDispute)
        }
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'text-red-600 border-red-600', icon: AlertTriangle },
      investigating: { color: 'text-yellow-600 border-yellow-600', icon: Clock },
      resolved: { color: 'text-green-600 border-green-600', icon: CheckCircle },
      closed: { color: 'text-gray-600 border-gray-600', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config?.icon || AlertTriangle

    return (
      <Badge variant="outline" className={config?.color}>
        <Icon className="w-3 h-3 mr-1" />
        {t(`status.${status}`)}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    }

    return (
      <Badge variant="outline" className={priorityColors[priority as keyof typeof priorityColors]}>
        {t(`priority.${priority}`)}
      </Badge>
    )
  }

  const getDisputeTypeBadge = (type: string) => {
    return (
      <Badge variant="outline">
        {t(`types.${type}`)}
      </Badge>
    )
  }

  const renderDisputeCard = (dispute: BookingDispute) => (
    <Card key={dispute.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('disputeTitle', { id: dispute.id.slice(0, 8) })}
            </CardTitle>
            <CardDescription>
              {t('reportedOn')} {new Date(dispute.created_at).toLocaleDateString()}
              {' '}{t('by')} {dispute.reported_by === 'client' ? t('client') : t('partner')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(dispute.status)}
            {getPriorityBadge(dispute.priority)}
            {getDisputeTypeBadge(dispute.dispute_type)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('property')}:</span>
              <span>{dispute.booking.loft.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('dates')}:</span>
              <span>
                {new Date(dispute.booking.check_in).toLocaleDateString()} - 
                {new Date(dispute.booking.check_out).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('amount')}:</span>
              <span>${dispute.booking.total_price}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('client')}:</span>
              <span>{dispute.booking.client.full_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('partner')}:</span>
              <span>{dispute.booking.partner.full_name}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-3">{dispute.description}</p>
          
          <div className="flex gap-2 flex-wrap">
            <Dialog open={isDetailDialogOpen && selectedDispute?.id === dispute.id} onOpenChange={setIsDetailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('viewDetails')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('disputeDetails')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('status')}</Label>
                      <div className="mt-1">{getStatusBadge(dispute.status)}</div>
                    </div>
                    <div>
                      <Label>{t('priority')}</Label>
                      <div className="mt-1">{getPriorityBadge(dispute.priority)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('description')}</Label>
                    <p className="mt-1 text-sm">{dispute.description}</p>
                  </div>

                  <div>
                    <Label>{t('messages')}</Label>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                      {dispute.messages.map((message) => (
                        <div key={message.id} className="border-b pb-2 last:border-b-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {message.sender.full_name} ({message.sender_role})
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder={t('addMessage')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button onClick={handleSendMessage} disabled={processing || !newMessage.trim()}>
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                        {t('sendMessage')}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {dispute.status === 'open' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(dispute.id, 'investigating')}
                disabled={processing}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('startInvestigation')}
              </Button>
            )}

            {(dispute.status === 'open' || dispute.status === 'investigating') && (
              <Dialog open={isResolutionDialogOpen && selectedDispute?.id === dispute.id} onOpenChange={setIsResolutionDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDispute(dispute)
                      setResolutionData({ disputeId: dispute.id, status: 'resolved' })
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('resolve')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('resolveDispute')}</DialogTitle>
                    <DialogDescription>
                      {t('resolveDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resolution-status">{t('resolutionStatus')}</Label>
                      <Select
                        value={resolutionData.status}
                        onValueChange={(value) => setResolutionData(prev => ({ ...prev, status: value as 'resolved' | 'closed' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resolved">{t('status.resolved')}</SelectItem>
                          <SelectItem value="closed">{t('status.closed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="resolution-notes">{t('resolutionNotes')}</Label>
                      <Textarea
                        id="resolution-notes"
                        placeholder={t('resolutionNotesPlaceholder')}
                        value={resolutionData.resolution || ''}
                        onChange={(e) => setResolutionData(prev => ({ ...prev, resolution: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="refund-amount">{t('refundAmount')}</Label>
                        <Input
                          id="refund-amount"
                          type="number"
                          placeholder="0.00"
                          value={resolutionData.refund_amount || ''}
                          onChange={(e) => setResolutionData(prev => ({ ...prev, refund_amount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="compensation">{t('compensation')}</Label>
                        <Input
                          id="compensation"
                          type="number"
                          placeholder="0.00"
                          value={resolutionData.compensation || ''}
                          onChange={(e) => setResolutionData(prev => ({ ...prev, compensation: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResolutionDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleResolution} disabled={processing || !resolutionData.resolution}>
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {t('resolveDispute')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          {t('title')}
        </h2>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="open">{t('tabs.open')}</TabsTrigger>
          <TabsTrigger value="investigating">{t('tabs.investigating')}</TabsTrigger>
          <TabsTrigger value="resolved">{t('tabs.resolved')}</TabsTrigger>
          <TabsTrigger value="closed">{t('tabs.closed')}</TabsTrigger>
        </TabsList>

        {['open', 'investigating', 'resolved', 'closed'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : disputes.length === 0 ? (
              <Alert>
                <AlertDescription>{t(`noDisputes.${status}`)}</AlertDescription>
              </Alert>
            ) : (
              disputes.map(renderDisputeCard)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}