import { client } from './sanity'
import { 
  Page, 
  Property, 
  Service, 
  BlogPost, 
  SiteSettings, 
  PaginatedResult,
  Locale 
} from '@/types/sanity'

// Cache configuration
const CACHE_DURATION = 60 // 60 seconds
const cache = new Map<string, { data: any; timestamp: number }>()

function getCacheKey(query: string, params?: any): string {
  return `${query}-${JSON.stringify(params || {})}`
}

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 1000) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

async function fetchWithCache<T>(
  query: string, 
  params?: any, 
  options?: { cache?: boolean }
): Promise<T> {
  const cacheKey = getCacheKey(query, params)
  
  if (options?.cache !== false) {
    const cached = getCachedData<T>(cacheKey)
    if (cached) return cached
  }

  const data = await client.fetch<T>(query, params)
  
  if (options?.cache !== false) {
    setCachedData(cacheKey, data)
  }
  
  return data
}

// Site Settings Queries
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const query = `*[_type == "siteSettings"][0] {
    _id,
    _type,
    title,
    description,
    logo,
    favicon,
    contactInfo,
    socialLinks,
    navigation,
    seo,
    analytics
  }`
  
  return fetchWithCache<SiteSettings | null>(query)
}

// Page Queries
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const query = `*[_type == "page" && slug.current == $slug && isPublished == true][0] {
    _id,
    _type,
    title,
    slug,
    content,
    seo,
    publishedAt,
    isPublished
  }`
  
  return fetchWithCache<Page | null>(query, { slug })
}

export async function getAllPages(): Promise<Page[]> {
  const query = `*[_type == "page" && isPublished == true] | order(publishedAt desc) {
    _id,
    _type,
    title,
    slug,
    seo,
    publishedAt,
    isPublished
  }`
  
  return fetchWithCache<Page[]>(query)
}

// Property Queries
export async function getAllProperties(options?: {
  type?: string[]
  city?: string[]
  features?: string[]
  search?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<PaginatedResult<Property>> {
  const { 
    type, 
    city, 
    features, 
    search, 
    status = 'active', 
    limit = 12, 
    offset = 0 
  } = options || {}
  
  let filters = [`_type == "property"`, `status == "${status}"`]
  
  // Type filter
  if (type && type.length > 0) {
    const typeFilter = type.map(t => `type == "${t}"`).join(' || ')
    filters.push(`(${typeFilter})`)
  }
  
  // City filter
  if (city && city.length > 0) {
    const cityFilter = city.map(c => `location.city == "${c}"`).join(' || ')
    filters.push(`(${cityFilter})`)
  }
  
  // Features filter
  if (features && features.length > 0) {
    const featureFilters = features.map(feature => 
      `("${feature}" in features.fr[] || "${feature}" in features.en[] || "${feature}" in features.ar[])`
    ).join(' && ')
    filters.push(`(${featureFilters})`)
  }
  
  // Search filter
  if (search) {
    const searchFilter = `(
      title.fr match "${search}*" || 
      title.en match "${search}*" || 
      title.ar match "${search}*" ||
      description.fr match "${search}*" || 
      description.en match "${search}*" || 
      description.ar match "${search}*" ||
      location.address match "${search}*" ||
      location.city match "${search}*"
    )`
    filters.push(searchFilter)
  }
  
  const filterString = filters.join(' && ')
  
  const query = `{
    "items": *[${filterString}] | order(order asc, _createdAt desc) [${offset}...${offset + limit}] {
      _id,
      _type,
      title,
      slug,
      description,
      images,
      location,
      features,
      type,
      specifications,
      status,
      order,
      testimonial
    },
    "total": count(*[${filterString}])
  }`
  
  const result = await fetchWithCache<{ items: Property[]; total: number }>(
    query, 
    { type, city, features, search, status, limit, offset },
    { cache: search ? false : true } // Don't cache search results
  )
  
  return {
    ...result,
    hasMore: result.total > offset + limit
  }
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const query = `*[_type == "property" && slug.current == $slug && status == "active"][0] {
    _id,
    _type,
    title,
    slug,
    description,
    images,
    location,
    features,
    type,
    specifications,
    status,
    order,
    testimonial
  }`
  
  return fetchWithCache<Property | null>(query, { slug })
}

export async function getFeaturedProperties(limit: number = 6): Promise<Property[]> {
  const query = `*[_type == "property" && (status == "featured" || status == "active")] | order(status desc, order asc) [0...${limit}] {
    _id,
    _type,
    title,
    slug,
    description,
    images,
    location,
    features,
    type,
    specifications,
    status,
    order,
    testimonial
  }`
  
  return fetchWithCache<Property[]>(query, { limit })
}

export async function getPropertyTypes(): Promise<string[]> {
  const query = `array::unique(*[_type == "property" && status == "active"].type)`
  
  return fetchWithCache<string[]>(query)
}

export async function getPropertyCities(): Promise<string[]> {
  const query = `array::unique(*[_type == "property" && status == "active" && defined(location.city)].location.city)`
  
  return fetchWithCache<string[]>(query)
}

export async function getPropertyFeatures(locale: Locale = 'fr'): Promise<string[]> {
  const query = `array::unique(*[_type == "property" && status == "active" && defined(features.${locale})].features.${locale}[])`
  
  return fetchWithCache<string[]>(query, { locale })
}

// Service Queries
export async function getAllServices(): Promise<Service[]> {
  const query = `*[_type == "service" && isActive == true] | order(order asc) {
    _id,
    _type,
    title,
    slug,
    description,
    longDescription,
    icon,
    image,
    features,
    pricing,
    ctaText,
    ctaLink,
    order,
    isActive
  }`
  
  return fetchWithCache<Service[]>(query)
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const query = `*[_type == "service" && slug.current == $slug && isActive == true][0] {
    _id,
    _type,
    title,
    slug,
    description,
    longDescription,
    icon,
    image,
    features,
    pricing,
    ctaText,
    ctaLink,
    order,
    isActive
  }`
  
  return fetchWithCache<Service | null>(query, { slug })
}

// Blog Queries
export async function getAllBlogPosts(options?: {
  category?: string
  limit?: number
  offset?: number
}): Promise<PaginatedResult<BlogPost>> {
  const { category, limit = 10, offset = 0 } = options || {}
  
  let filters = [`_type == "blogPost"`, `isPublished == true`]
  if (category) filters.push(`"${category}" in categories`)
  
  const filterString = filters.join(' && ')
  
  const query = `{
    "items": *[${filterString}] | order(publishedAt desc) [${offset}...${offset + limit}] {
      _id,
      _type,
      title,
      slug,
      excerpt,
      featuredImage,
      categories,
      tags,
      author,
      publishedAt,
      isPublished,
      seo
    },
    "total": count(*[${filterString}])
  }`
  
  const result = await fetchWithCache<{ items: BlogPost[]; total: number }>(query, { category, limit, offset })
  
  return {
    ...result,
    hasMore: result.total > offset + limit
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const query = `*[_type == "blogPost" && slug.current == $slug && isPublished == true][0] {
    _id,
    _type,
    title,
    slug,
    excerpt,
    content,
    featuredImage,
    categories,
    tags,
    author,
    publishedAt,
    isPublished,
    seo
  }`
  
  return fetchWithCache<BlogPost | null>(query, { slug })
}

export async function getRecentBlogPosts(limit: number = 3): Promise<BlogPost[]> {
  const query = `*[_type == "blogPost" && isPublished == true] | order(publishedAt desc) [0...${limit}] {
    _id,
    _type,
    title,
    slug,
    excerpt,
    featuredImage,
    categories,
    publishedAt
  }`
  
  return fetchWithCache<BlogPost[]>(query, { limit })
}

export async function getBlogCategories(): Promise<string[]> {
  const query = `array::unique(*[_type == "blogPost" && isPublished == true].categories[])`
  
  return fetchWithCache<string[]>(query)
}

// Related content queries
export async function getRelatedProperties(
  currentPropertyId: string, 
  type?: string, 
  limit: number = 3
): Promise<Property[]> {
  const query = `*[_type == "property" && _id != $currentPropertyId && status == "active" ${type ? `&& type == "${type}"` : ''}] | order(order asc) [0...${limit}] {
    _id,
    _type,
    title,
    slug,
    description,
    images,
    location,
    type,
    specifications
  }`
  
  return fetchWithCache<Property[]>(query, { currentPropertyId, limit })
}

export async function getRelatedBlogPosts(
  currentPostId: string, 
  categories?: string[], 
  limit: number = 3
): Promise<BlogPost[]> {
  const categoryFilter = categories && categories.length > 0 
    ? `&& count((categories[])[@ in ${JSON.stringify(categories)}]) > 0`
    : ''
  
  const query = `*[_type == "blogPost" && _id != $currentPostId && isPublished == true ${categoryFilter}] | order(publishedAt desc) [0...${limit}] {
    _id,
    _type,
    title,
    slug,
    excerpt,
    featuredImage,
    categories,
    publishedAt
  }`
  
  return fetchWithCache<BlogPost[]>(query, { currentPostId, limit })
}

// Search functionality
export async function searchContent(
  searchTerm: string, 
  locale: Locale = 'fr'
): Promise<{
  properties: Property[]
  services: Service[]
  blogPosts: BlogPost[]
}> {
  const query = `{
    "properties": *[_type == "property" && status == "active" && (
      title.${locale} match $searchTerm + "*" ||
      description.${locale} match $searchTerm + "*" ||
      features.${locale}[] match $searchTerm + "*"
    )] [0...5] {
      _id,
      _type,
      title,
      slug,
      description,
      images,
      type
    },
    "services": *[_type == "service" && isActive == true && (
      title.${locale} match $searchTerm + "*" ||
      description.${locale} match $searchTerm + "*" ||
      features.${locale}[] match $searchTerm + "*"
    )] [0...5] {
      _id,
      _type,
      title,
      slug,
      description,
      icon
    },
    "blogPosts": *[_type == "blogPost" && isPublished == true && (
      title.${locale} match $searchTerm + "*" ||
      excerpt.${locale} match $searchTerm + "*"
    )] [0...5] {
      _id,
      _type,
      title,
      slug,
      excerpt,
      featuredImage,
      publishedAt
    }
  }`
  
  return fetchWithCache<{
    properties: Property[]
    services: Service[]
    blogPosts: BlogPost[]
  }>(query, { searchTerm }, { cache: false }) // Don't cache search results
}

// Utility function to clear cache (useful for development)
export function clearCache(): void {
  cache.clear()
}