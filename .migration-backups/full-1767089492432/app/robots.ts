import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/settings/',
          '/transactions/',
          '/reservations/',
          '/customers/',
          '/owners/',
          '/tasks/',
          '/teams/',
          '/reports/',
          '/conversations/',
          '/notifications/',
          '/profile/',
          '/partner/',
          '/client/',
          '/executive/',
          '/database-cloner/',
          '/*?*', // Éviter les paramètres de requête
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: 'https://loft-algerie.com/sitemap.xml',
  }
}
