import FusionDualAudienceHomepage from '@/components/homepage/FusionDualAudienceHomepage';
import { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OAuthRedirectHandler } from '@/components/auth/oauth-redirect-handler';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Loft Algérie - Découvrez les Plus Beaux Lofts d'Algérie | Réservation & Gestion",
      description: "🏆 Réservez votre loft de rêve en Algérie ! Alger, Oran, Constantine. ✨ -20% première réservation + petit-déjeuner GRATUIT. Propriétaires: doublez vos revenus en 30 jours. Service VIP 24/7.",
      keywords: "loft algérie, réservation loft alger, hébergement oran, gestion propriété algérie, revenus locatifs, loft constantine, séjour algérie",
    },
    en: {
      title: "Loft Algeria - Discover Algeria's Most Beautiful Lofts | Booking & Management",
      description: "🏆 Book your dream loft in Algeria! Algiers, Oran, Constantine. ✨ -20% first booking + FREE breakfast. Property owners: double your income in 30 days. VIP service 24/7.",
      keywords: "loft algeria, algiers loft booking, oran accommodation, algeria property management, rental income, constantine loft, algeria stay",
    },
    ar: {
      title: "لوفت الجزائر - اكتشف أجمل الشقق المفروشة في الجزائر | حجز وإدارة",
      description: "🏆 احجز شقة أحلامك في الجزائر! الجزائر، وهران، قسنطينة. ✨ خصم 20% أول حجز + إفطار مجاني. أصحاب العقارات: ضاعفوا دخلكم في 30 يوماً. خدمة VIP 24/7.",
      keywords: "شقق مفروشة الجزائر, حجز شقة الجزائر العاصمة, إقامة وهران, إدارة عقارات الجزائر, دخل إيجاري, شقة قسنطينة, إقامة الجزائر",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: `https://loftalgerie.com/${locale}`,
      languages: {
        'fr': 'https://loftalgerie.com/fr',
        'en': 'https://loftalgerie.com/en',
        'ar': 'https://loftalgerie.com/ar',
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `https://loftalgerie.com/${locale}`,
      siteName: 'Loft Algérie',
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'en' ? 'en_US' : 'fr_FR',
      type: 'website',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=630&fit=crop',
          width: 1200,
          height: 630,
          alt: 'Loft moderne avec vue panoramique - Loft Algérie',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=630&fit=crop'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  // Fetch real lofts with photos server-side
  let featuredLoftsFromDB: any[] = []
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient(true)

    const { data: photos, error: photosError } = await supabase
      .from('loft_photos')
      .select('loft_id, url')
      .order('created_at', { ascending: true })

    console.log('[page.tsx] photos fetched:', photos?.length, 'error:', photosError?.message)

    if (photos && photos.length > 0) {
      const photoMap = new Map<string, string>()
      photos.forEach((p: any) => { if (!photoMap.has(p.loft_id)) photoMap.set(p.loft_id, p.url) })
      const loftIds = Array.from(photoMap.keys())

      const { data: lofts } = await supabase
        .from('lofts')
        .select('id, name, address, description, price_per_night, zone_areas!lofts_zone_area_id_fkey(name)')
        .in('id', loftIds)
        .order('name')

      featuredLoftsFromDB = (lofts || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        address: l.address || '',
        description: l.description || '',
        price_per_night: l.price_per_night || 0,
        zone: l.zone_areas?.name || '',
        photo: photoMap.get(l.id) || '',
      }))
      console.log('[page.tsx] featuredLoftsFromDB:', featuredLoftsFromDB.length, 'lofts')
    }
  } catch (e) {
    console.error('Failed to fetch featured lofts:', e)
  }
    <>
      {/* Gestionnaire de redirection OAuth */}
      <OAuthRedirectHandler locale={locale} />
      
      {/* Schema.org JSON-LD pour SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Loft Algérie',
            url: `https://loft-algerie.com/${locale}`,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `https://loft-algerie.com/${locale}/search?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Loft Algérie',
            url: 'https://loft-algerie.com',
            logo: 'https://loft-algerie.com/logo.png',
            description: locale === 'fr' 
              ? 'Plateforme de réservation et gestion de lofts en Algérie'
              : locale === 'en'
              ? 'Loft booking and management platform in Algeria'
              : 'منصة حجز وإدارة الشقق المفروشة في الجزائر',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'DZ',
              addressLocality: 'Alger',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              availableLanguage: ['French', 'English', 'Arabic'],
            },
          }),
        }}
      />
      <FusionDualAudienceHomepage locale={locale} featuredLofts={featuredLoftsFromDB} />
    </>
  );
}