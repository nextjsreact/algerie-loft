'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Mail, Phone, MapPin, FileText, User } from 'lucide-react'

export default function PartnerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    description: '',
  })

  console.log('[REGISTER PAGE] Component mounted')

  // Fetch user session data and check partner status
  useEffect(() => {
    console.log('[REGISTER PAGE] useEffect running')
    async function fetchUserData() {
      try {
        // Check if user already has a partner profile
        const statusResponse = await fetch('/api/partner/status')
        console.log('[REGISTER PAGE] Status response:', statusResponse.status)
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          console.log('[REGISTER PAGE] Status data:', statusData)
          
          // If user has a verified partner profile, redirect to dashboard
          if (statusData.hasProfile && statusData.verification_status === 'verified') {
            console.log('[REGISTER PAGE] Verified partner detected, redirecting to dashboard')
            const locale = window.location.pathname.split('/')[1] || 'fr'
            router.push(`/${locale}/partner/dashboard`)
            return
          }
          
          // If user has a pending application, redirect to pending page
          if (statusData.hasProfile && statusData.verification_status === 'pending') {
            console.log('[REGISTER PAGE] Pending partner detected, redirecting to pending page')
            const locale = window.location.pathname.split('/')[1] || 'fr'
            router.push(`/${locale}/partner/application-pending`)
            return
          }
          
          console.log('[REGISTER PAGE] No redirect needed, showing registration form')
        } else {
          console.log('[REGISTER PAGE] Status check failed:', statusResponse.status)
        }
        
        // Fetch user session to pre-fill form
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setFormData(prev => ({
              ...prev,
              company_name: data.user.full_name || '',
              contact_email: data.user.email || '',
            }))
          }
        }
      } catch (err) {
        console.error('Failed to fetch user session:', err)
      } finally {
        setLoadingSession(false)
      }
    }
    
    fetchUserData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/partner/register-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to application pending page with locale
      const locale = window.location.pathname.split('/')[1] || 'fr'
      router.push(`/${locale}/partner/application-pending`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Devenir Partenaire
            </CardTitle>
            <CardDescription>
              Remplissez ce formulaire pour soumettre votre demande de partenariat. Notre équipe examinera votre demande et vous contactera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Nom de l'entreprise / Nom du partenaire / Propriétaire
                </Label>
                <Input
                  id="company_name"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nom de votre entreprise ou votre nom"
                  disabled={loadingSession}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email de contact
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="votre@email.com"
                  disabled={loadingSession}
                />
                {formData.contact_email && (
                  <p className="text-xs text-gray-500">
                    Vous pouvez modifier cet email si nécessaire
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Téléphone
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  required
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  disabled={loadingSession}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse complète de votre entreprise"
                  disabled={loadingSession}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Description de votre activité
                </Label>
                <Textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre activité et pourquoi vous souhaitez devenir partenaire..."
                  disabled={loadingSession}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || loadingSession}>
                {loadingSession ? 'Chargement...' : loading ? 'Envoi en cours...' : 'Soumettre ma demande'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
