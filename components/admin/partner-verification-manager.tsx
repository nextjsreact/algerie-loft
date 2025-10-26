'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Loader2
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PartnerProfile {
  id: string
  user_id: string
  business_name?: string
  business_type: 'individual' | 'company'
  tax_id?: string
  address: string
  phone: string
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_documents: string[]
  created_at: string
  profiles: {
    id: string
    full_name: string
    role: string
  }
}

export function PartnerVerificationManager() {
  const t = useTranslations('admin.partners')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPartners(activeTab)
  }, [activeTab])

  const fetchPartners = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/partners?status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setPartners(data)
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (partnerId: string, status: 'verified' | 'rejected') => {
    setProcessingId(partnerId)
    try {
      const response = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId,
          status,
          notes: verificationNotes[partnerId] || ''
        })
      })

      if (response.ok) {
        // Refresh the list
        await fetchPartners(activeTab)
        // Clear notes
        setVerificationNotes(prev => ({ ...prev, [partnerId]: '' }))
      }
    } catch (error) {
      console.error('Error updating partner status:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />{t('status.pending')}</Badge>
      case 'verified':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />{t('status.verified')}</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />{t('status.rejected')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderPartnerCard = (partner: PartnerProfile) => (
    <Card key={partner.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {partner.business_type === 'company' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {partner.business_name || partner.profiles.full_name}
            </CardTitle>
            <CardDescription>
              {t('submittedOn')} {new Date(partner.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(partner.verification_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('contactPerson')}:</span>
              <span>{partner.profiles.full_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('businessType')}:</span>
              <span>{partner.business_type === 'company' ? t('company') : t('individual')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{t('phone')}:</span>
              <span>{partner.phone}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <span className="font-medium">{t('address')}:</span>
                <p className="text-gray-600">{partner.address}</p>
              </div>
            </div>
            {partner.tax_id && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{t('taxId')}:</span>
                <span>{partner.tax_id}</span>
              </div>
            )}
          </div>
        </div>

        {partner.verification_status === 'pending' && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <Label htmlFor={`notes-${partner.id}`}>{t('verificationNotes')}</Label>
              <Textarea
                id={`notes-${partner.id}`}
                placeholder={t('notesPlaceholder')}
                value={verificationNotes[partner.id] || ''}
                onChange={(e) => setVerificationNotes(prev => ({ ...prev, [partner.id]: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleVerification(partner.id, 'verified')}
                disabled={processingId === partner.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingId === partner.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {t('approve')}
              </Button>
              <Button
                onClick={() => handleVerification(partner.id, 'rejected')}
                disabled={processingId === partner.id}
                variant="destructive"
              >
                {processingId === partner.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                {t('reject')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">{t('tabs.pending')}</TabsTrigger>
          <TabsTrigger value="verified">{t('tabs.verified')}</TabsTrigger>
          <TabsTrigger value="rejected">{t('tabs.rejected')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <Alert>
              <AlertDescription>{t('noPendingPartners')}</AlertDescription>
            </Alert>
          ) : (
            partners.map(renderPartnerCard)
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <Alert>
              <AlertDescription>{t('noVerifiedPartners')}</AlertDescription>
            </Alert>
          ) : (
            partners.map(renderPartnerCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <Alert>
              <AlertDescription>{t('noRejectedPartners')}</AlertDescription>
            </Alert>
          ) : (
            partners.map(renderPartnerCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}