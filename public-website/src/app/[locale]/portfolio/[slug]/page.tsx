'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { Property, Locale } from '@/types/sanity'
import { getPropertyBySlug, getRelatedProperties } from '@/lib/sanity-queries'
import { urlFor } from '@/lib/sanity-utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PropertyCard } from '@/components/ui/property-card'

interface PropertyPageState {
  property: Property | null
  relatedProperties: Property[]
  loading: boolean
  error: string | null
}

export default function PropertyPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('portfolio')
  const locale = useLocale() as Locale
  const slug = params.slug as string

  const [state, setState] = useState<PropertyPageState>({
    property: null,
    relatedProperties: [],
    loading: true,
    error: null
  })

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    const loadProperty = async () => {
      if (!slug) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const property = await getPropertyBySlug(slug)
        
        if (!property) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Property not found' 
          }))
          return
        }

        // Load related properties
        const related = await getRelatedProperties(
          property._id, 
          property.type, 
          3
        )

        setState(prev => ({
          ...prev,
          property,
          relatedProperties: related,
          loading: false
        }))
      } catch (error) {
        console.error('Error loading property:', error)
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to load property' 
        }))
      }
    }

    loadProperty()
  }, [slug])

  if (state.loading) {
    return <PropertyPageSkeleton />
  }

  if (state.error || !state.property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('propertyNotFound')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('propertyNotFoundDescription')}
          </p>
          <Link href={`/${locale}/portfolio`}>
            <Button>
              {t('backToPortfolio')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { property, relatedProperties } = state
  const title = property.title?.[locale] || property.title?.fr || 'Property'
  const description = property.description?.[locale] || property.description?.fr || ''
  const features = property.features?.[locale] || property.features?.fr || []
  const images = property.images || []
  const specs = property.specifications
  const location = property.location
  const testimonial = property.testimonial

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href={`/${locale}`} className="hover:text-gray-700">
              {t('home')}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/portfolio`} className="hover:text-gray-700">
              {t('title')}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="mb-8 overflow-hidden">
              {images.length > 0 ? (
                <div>
                  {/* Main Image */}
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <Image
                      src={urlFor(images[selectedImageIndex]).width(800).height(500).quality(90).url()}
                      alt={images[selectedImageIndex]?.alt?.[locale] || title}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex(prev => 
                            prev === 0 ? images.length - 1 : prev - 1
                          )}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(prev => 
                            prev === images.length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {images.length > 1 && (
                    <div className="p-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                              index === selectedImageIndex 
                                ? 'border-blue-500' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={urlFor(image).width(80).height(64).quality(70).url()}
                              alt={image.alt?.[locale] || `${title} ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>{t('noImages')}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Property Description */}
            <Card className="mb-8 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {title}
              </h1>
              
              {location && (
                <div className="flex items-center text-gray-600 mb-6">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {location.address && `${location.address}, `}
                    {location.city}
                  </span>
                </div>
              )}

              {description && (
                <div className="prose prose-gray max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {description}
                  </p>
                </div>
              )}

              {/* Property Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('features')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Client Testimonial */}
            {testimonial?.content?.[locale] && (
              <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  {testimonial.clientPhoto && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={urlFor(testimonial.clientPhoto).width(48).height(48).quality(80).url()}
                        alt={testimonial.clientName || 'Client'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <blockquote className="text-gray-700 italic mb-2">
                      "{testimonial.content[locale]}"
                    </blockquote>
                    {testimonial.clientName && (
                      <cite className="text-sm font-medium text-gray-900">
                        — {testimonial.clientName}
                      </cite>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Property Specifications */}
            <Card className="mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('specifications')}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('propertyType')}</span>
                  <span className="font-medium capitalize">
                    {t(`types.${property.type}`)}
                  </span>
                </div>
                
                {specs?.bedrooms && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('specs.bedrooms')}</span>
                    <span className="font-medium">{specs.bedrooms}</span>
                  </div>
                )}
                
                {specs?.bathrooms && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('specs.bathrooms')}</span>
                    <span className="font-medium">{specs.bathrooms}</span>
                  </div>
                )}
                
                {specs?.area && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('specs.area')}</span>
                    <span className="font-medium">{specs.area}m²</span>
                  </div>
                )}
                
                {specs?.capacity && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('specs.capacity')}</span>
                    <span className="font-medium">{specs.capacity} {t('specs.guests')}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Location Map Placeholder */}
            {location?.coordinates && (
              <Card className="mb-6 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('location')}
                </h3>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">{t('mapPlaceholder')}</p>
                  </div>
                </div>
                {location.address && (
                  <p className="text-sm text-gray-600 mt-3">
                    {location.address}
                  </p>
                )}
              </Card>
            )}

            {/* Contact CTA */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('interestedTitle')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('interestedDescription')}
              </p>
              <Link href={`/${locale}/contact?property=${slug}`}>
                <Button className="w-full">
                  {t('contactAboutProperty')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Related Properties */}
        {relatedProperties.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('relatedProperties')}
              </h2>
              <p className="text-gray-600">
                {t('relatedPropertiesDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProperties.map((relatedProperty) => (
                <PropertyCard 
                  key={relatedProperty._id} 
                  property={relatedProperty} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PropertyPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-gray-200"></div>
              <div className="p-4">
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}