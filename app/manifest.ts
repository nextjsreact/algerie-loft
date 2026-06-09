import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Loft Algérie - Réservez votre loft idéal',
    short_name: 'Loft Algérie',
    description: 'Découvrez des lofts uniques en Algérie. Réservation facile, gestion professionnelle.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'fr',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any' as any,
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any' as any,
      },
    ],
  }
}
