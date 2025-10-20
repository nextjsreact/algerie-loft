import { urlFor } from './sanity'
import { 
  MultilingualContent, 
  MultilingualText, 
  MultilingualArray, 
  SanityImage, 
  Locale 
} from '@/types/sanity'

/**
 * Get localized content from multilingual object
 */
export function getLocalizedContent(
  content: MultilingualContent | MultilingualText | undefined,
  locale: Locale,
  fallbackLocale: Locale = 'fr'
): string {
  if (!content) return ''
  
  return content[locale] || content[fallbackLocale] || content.fr || content.en || content.ar || ''
}

/**
 * Get localized array from multilingual array object
 */
export function getLocalizedArray(
  content: MultilingualArray | undefined,
  locale: Locale,
  fallbackLocale: Locale = 'fr'
): string[] {
  if (!content) return []
  
  return content[locale] || content[fallbackLocale] || content.fr || content.en || content.ar || []
}

/**
 * Check if multilingual content has any value
 */
export function hasContent(content: MultilingualContent | MultilingualText | undefined): boolean {
  if (!content) return false
  
  return Boolean(content.fr || content.en || content.ar)
}

/**
 * Get available locales for content
 */
export function getAvailableLocales(content: MultilingualContent | MultilingualText | undefined): Locale[] {
  if (!content) return []
  
  const locales: Locale[] = []
  if (content.fr) locales.push('fr')
  if (content.en) locales.push('en')
  if (content.ar) locales.push('ar')
  
  return locales
}

/**
 * Generate image URL with optimization
 */
export function getOptimizedImageUrl(
  image: SanityImage | undefined,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
    fit?: 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'clip' | 'min'
  }
): string | null {
  if (!image?.asset?._ref) return null
  
  let builder = urlFor(image)
  
  if (options?.width) builder = builder.width(options.width)
  if (options?.height) builder = builder.height(options.height)
  if (options?.quality) builder = builder.quality(options.quality)
  if (options?.format) builder = builder.format(options.format)
  if (options?.fit) builder = builder.fit(options.fit)
  
  return builder.url()
}

/**
 * Get responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(
  image: SanityImage | undefined,
  options?: {
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  }
): {
  mobile: string | null
  tablet: string | null
  desktop: string | null
  original: string | null
} {
  if (!image?.asset?._ref) {
    return {
      mobile: null,
      tablet: null,
      desktop: null,
      original: null
    }
  }
  
  const { quality = 80, format = 'webp' } = options || {}
  
  return {
    mobile: getOptimizedImageUrl(image, { width: 480, quality, format }),
    tablet: getOptimizedImageUrl(image, { width: 768, quality, format }),
    desktop: getOptimizedImageUrl(image, { width: 1200, quality, format }),
    original: getOptimizedImageUrl(image, { quality, format })
  }
}

/**
 * Get image alt text in specified locale
 */
export function getImageAlt(
  image: SanityImage | undefined,
  locale: Locale,
  fallback?: string
): string {
  if (!image?.alt) return fallback || ''
  
  return getLocalizedContent(image.alt, locale) || fallback || ''
}

/**
 * Generate SEO-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

/**
 * Format date for display
 */
export function formatDate(
  dateString: string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateString)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  
  // Map our locale to Intl locale
  const intlLocale = locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR'
  
  return date.toLocaleDateString(intlLocale, formatOptions)
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength - suffix.length).trim() + suffix
}

/**
 * Extract plain text from Portable Text blocks
 */
export function extractTextFromPortableText(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  
  return blocks
    .filter(block => block._type === 'block')
    .map(block => {
      if (block.children && Array.isArray(block.children)) {
        return block.children
          .filter((child: any) => child._type === 'span')
          .map((child: any) => child.text)
          .join('')
      }
      return ''
    })
    .join(' ')
}

/**
 * Get excerpt from Portable Text content
 */
export function getExcerptFromPortableText(
  blocks: any[],
  maxLength: number = 160
): string {
  const text = extractTextFromPortableText(blocks)
  return truncateText(text, maxLength)
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Basic formatting for Algerian numbers
  if (cleaned.startsWith('+213')) {
    const number = cleaned.substring(4)
    if (number.length === 9) {
      return `+213 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`
    }
  }
  
  return phone
}

/**
 * Generate breadcrumb items from path
 */
export function generateBreadcrumbs(
  pathname: string,
  locale: Locale,
  customLabels?: Record<string, MultilingualContent>
): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean)
  
  // Remove locale from segments if present
  if (segments[0] === locale) {
    segments.shift()
  }
  
  const breadcrumbs = [
    {
      label: getLocalizedContent(
        customLabels?.home || { fr: 'Accueil', en: 'Home', ar: 'الرئيسية' },
        locale
      ),
      href: `/${locale}`
    }
  ]
  
  let currentPath = `/${locale}`
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    const label = customLabels?.[segment] 
      ? getLocalizedContent(customLabels[segment], locale)
      : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    
    breadcrumbs.push({
      label,
      href: currentPath
    })
  })
  
  return breadcrumbs
}

/**
 * Check if content is RTL (Right-to-Left)
 */
export function isRTL(locale: Locale): boolean {
  return locale === 'ar'
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}