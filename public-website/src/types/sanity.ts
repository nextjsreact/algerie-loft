import { PortableTextBlock } from '@portabletext/types'
import { SanityImageSource } from '@sanity/image-url/lib/types/types'

// Base multilingual content type
export interface MultilingualContent {
  fr?: string
  en?: string
  ar?: string
}

export interface MultilingualText {
  fr?: string
  en?: string
  ar?: string
}

export interface MultilingualArray {
  fr?: string[]
  en?: string[]
  ar?: string[]
}

export interface MultilingualRichText {
  fr?: PortableTextBlock[]
  en?: PortableTextBlock[]
  ar?: PortableTextBlock[]
}

// Image types
export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  alt?: MultilingualContent
  caption?: MultilingualContent
}

// SEO types
export interface SEOData {
  title?: MultilingualContent
  description?: MultilingualText
  keywords?: MultilingualArray
  ogImage?: SanityImage
  canonical?: string
  noIndex?: boolean
}

// Page types
export interface Page {
  _id: string
  _type: 'page'
  title: MultilingualContent
  slug: {
    current: string
  }
  content?: MultilingualRichText
  seo?: SEOData
  publishedAt: string
  isPublished: boolean
}

// Property types
export interface PropertyLocation {
  address?: string
  city?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface PropertySpecifications {
  bedrooms?: number
  bathrooms?: number
  area?: number
  capacity?: number
}

export interface PropertyTestimonial {
  content?: MultilingualText
  clientName?: string
  clientPhoto?: SanityImage
}

export interface Property {
  _id: string
  _type: 'property'
  title: MultilingualContent
  slug: {
    current: string
  }
  description?: MultilingualText
  images?: SanityImage[]
  location?: PropertyLocation
  features?: MultilingualArray
  type: 'apartment' | 'villa' | 'studio' | 'loft' | 'house'
  specifications?: PropertySpecifications
  status: 'active' | 'inactive' | 'featured'
  order: number
  testimonial?: PropertyTestimonial
}

// Service types
export interface ServicePricing {
  type?: 'fixed' | 'percentage' | 'custom'
  amount?: number
  currency?: string
  description?: MultilingualText
}

export interface Service {
  _id: string
  _type: 'service'
  title: MultilingualContent
  slug: {
    current: string
  }
  description?: MultilingualText
  longDescription?: MultilingualRichText
  icon?: string
  image?: SanityImage
  features?: MultilingualArray
  pricing?: ServicePricing
  ctaText?: MultilingualContent
  ctaLink?: string
  order: number
  isActive: boolean
}

// Blog types
export interface BlogAuthor {
  name?: string
  bio?: MultilingualText
  avatar?: SanityImage
}

export interface BlogPost {
  _id: string
  _type: 'blogPost'
  title: MultilingualContent
  slug: {
    current: string
  }
  excerpt?: MultilingualText
  content?: MultilingualRichText
  featuredImage?: SanityImage
  categories?: string[]
  tags?: MultilingualArray
  author?: BlogAuthor
  publishedAt: string
  isPublished: boolean
  seo?: SEOData
}

// Site Settings types
export interface ContactInfo {
  email?: string
  phone?: string
  whatsapp?: string
  address?: MultilingualText
  businessHours?: MultilingualText
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  youtube?: string
}

export interface NavigationItem {
  label: MultilingualContent
  href: string
  order?: number
}

export interface Navigation {
  mainMenu?: NavigationItem[]
  footerMenu?: NavigationItem[]
}

export interface Analytics {
  googleAnalyticsId?: string
  facebookPixelId?: string
  gtmId?: string
}

export interface SiteSettings {
  _id: string
  _type: 'siteSettings'
  title: MultilingualContent
  description?: MultilingualText
  logo?: SanityImage
  favicon?: SanityImage
  contactInfo?: ContactInfo
  socialLinks?: SocialLinks
  navigation?: Navigation
  seo?: {
    defaultTitle?: MultilingualContent
    defaultDescription?: MultilingualText
    defaultOgImage?: SanityImage
  }
  analytics?: Analytics
}

// Query result types
export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  nextCursor?: string
}

// Locale type
export type Locale = 'fr' | 'en' | 'ar'