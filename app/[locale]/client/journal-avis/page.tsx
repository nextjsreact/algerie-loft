'use client'

import { useEffect, useMemo, useState } from 'react'
import { NotificationsWrapper, type AirbnbNotificationItem } from '@/components/notifications/notifications-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Star, MessageSquareText, ThumbsUp } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

type Review = {
  id: string
  rating: number | null
  review_text: string | null
  created_at: string
  is_published: boolean
  response_text: string | null
  response_date: string | null
  loft_id: string
  loft_name?: string | null
}

type Payload = {
  notifications: any[]
  airbnbNotifications: AirbnbNotificationItem[]
  reviews: Review[]
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return iso
  }
}

export default function ClientJournalAvisPage() {
  const t = useTranslations('clientJournalAvis')
  const locale = useLocale()

  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/client/journal-avis', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to load')
        }
        const data: Payload = await res.json()
        if (!cancelled) setPayload(data)
      } catch (e) {
        if (!cancelled) setError('Impossible de charger le journal & les avis.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const reviewsSorted = useMemo(() => {
    const r = payload?.reviews || []
    return [...r].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [payload?.reviews])

  const userRole = 'customer'
  const userId = 'client'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !payload) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('title', { defaultValue: 'Journal & Avis' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error ?? 'Erreur'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const notifications = payload.notifications || []
  const airbnbNotifications = payload.airbnbNotifications || []
  const reviews = reviewsSorted

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title', { defaultValue: 'Journal & Avis' })}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle', { defaultValue: 'Votre historique et vos appréciations, au même endroit.' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            {reviews.length} avis
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JOURNAL */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('journalTitle', { defaultValue: 'Journal' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <NotificationsWrapper
              notifications={notifications}
              userRole={userRole as any}
              userId={userId}
              airbnbNotifications={airbnbNotifications}
              onNotificationRead={async () => {}}
              onAirbnbNotificationRead={async () => {}}
              onAirbnbMarkAllRead={async () => {}}
            />
          </CardContent>
        </Card>

        {/* AVIS */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {t('reviewsTitle', { defaultValue: 'Appréciations' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t('noReviews', { defaultValue: 'Aucun avis pour le moment.' })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg border bg-white dark:bg-[#111b21]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border border-yellow-200">
                            <span className="font-semibold">{r.rating ?? '—'}</span>/5
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(r.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {r.loft_name || t('unknownLoft', { defaultValue: 'Loft' })}
                        </p>
                      </div>
                    </div>

                    {r.review_text ? (
                      <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                        {r.review_text}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-3">
                        {t('emptyReviewText', { defaultValue: 'Texte indisponible.' })}
                      </p>
                    )}

                    {r.response_text ? (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground font-medium mb-1">
                          Réponse
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {r.response_text}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground">
        {t('footnote', {
          defaultValue: 'Les avis sont affichés à partir de vos séjours. Le journal provient de vos notifications in-app et Airbnb.',
        })}
      </div>
    </div>
  )
}
