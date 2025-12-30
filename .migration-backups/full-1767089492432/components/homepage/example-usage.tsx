'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { DualAudienceLayout, Section, Grid, Card } from './dual-audience-layout'
import { PriceDisplay, PerNightPrice } from '@/components/price-display'
import { useContextRestoration } from '@/hooks/use-context-restoration'

/**
 * Example component demonstrating multilingual and currency features
 */
export function HomepageExample() {
  const t = useTranslations('homepage')
  const { searchContext, updateSearchContext } = useContextRestoration()

  // Example loft data
  const exampleLofts = [
    {
      id: '1',
      title: t('featuredLofts.title'),
      location: t('locations.algiers'),
      price: { amount: 15000, currency: 'DZD' as const },
      rating: 4.8,
      reviews: 124
    },
    {
      id: '2', 
      title: t('featuredLofts.title'),
      location: t('locations.oran'),
      price: { amount: 12000, currency: 'DZD' as const },
      rating: 4.6,
      reviews: 89
    },
    {
      id: '3',
      title: t('featuredLofts.title'), 
      location: t('locations.constantine'),
      price: { amount: 18000, currency: 'DZD' as const },
      rating: 4.9,
      reviews: 156
    }
  ]

  return (
    <DualAudienceLayout>
      {/* Hero Section */}
      <Section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="text-center py-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('hero.headline')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {t('hero.subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              {t('hero.ctaPrimary')}
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              {t('hero.ctaSecondary')}
            </button>
          </div>
        </div>
      </Section>

      {/* Featured Lofts Section */}
      <Section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {t('featuredLofts.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('featuredLofts.subtitle')}
          </p>
        </div>

        <Grid columns={3}>
          {exampleLofts.map((loft) => (
            <Card key={loft.id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">{loft.title}</h3>
              <p className="text-muted-foreground mb-4">{loft.location}</p>
              
              <div className="flex items-center justify-between mb-4">
                <PerNightPrice price={loft.price} />
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{loft.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({loft.reviews} {t('featuredLofts.reviews')})
                  </span>
                </div>
              </div>

              <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                {t('featuredLofts.bookNow')}
              </button>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* Trust Section */}
      <Section className="bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {t('trust.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('trust.subtitle')}
          </p>
        </div>

        <Grid columns={4}>
          <Card className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-xl">✓</span>
            </div>
            <h3 className="font-semibold mb-2">{t('trust.reviews.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('trust.reviews.subtitle')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">🏆</span>
            </div>
            <h3 className="font-semibold mb-2">{t('trust.certifications.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('trust.certifications.subtitle')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-xl">🕒</span>
            </div>
            <h3 className="font-semibold mb-2">{t('trust.support.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('trust.support.subtitle')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-600 text-xl">🛡️</span>
            </div>
            <h3 className="font-semibold mb-2">{t('trust.guarantees.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('trust.guarantees.security')}</p>
          </Card>
        </Grid>
      </Section>

      {/* Property Owners Section */}
      <Section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {t('owners.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('owners.subtitle')}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8">
          <Grid columns={3}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">85%</div>
              <div className="text-sm opacity-90">{t('owners.metrics.occupancyRate')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">+40%</div>
              <div className="text-sm opacity-90">{t('owners.metrics.revenueIncrease')}</div>
            </div>
            <div className="text-center">
              <PriceDisplay 
                price={{ amount: 45000, currency: 'DZD' }}
                className="text-3xl font-bold mb-2"
              />
              <div className="text-sm opacity-90">{t('owners.metrics.averageRevenue')}</div>
            </div>
          </Grid>

          <div className="text-center mt-8">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              {t('owners.cta.primary')}
            </button>
          </div>
        </div>
      </Section>
    </DualAudienceLayout>
  )
}