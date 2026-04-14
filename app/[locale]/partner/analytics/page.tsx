'use client'
import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnerAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  useEffect(() => { router.replace(`/${locale}/partner/revenue`) }, [locale, router])
  return null
}
