import FusionDualAudienceHomepage from '@/components/homepage/FusionDualAudienceHomepage';
import { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
  
  // Check for auth cookies first to avoid unnecessary Supabase calls
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );
  
  // Only check session if auth cookies exist
  if (hasAuthCookie) {
    const session = await getSession();
    
    if (session) {
      const loginContext = cookieStore.get('login_context')?.value;
      
      console.log('[ROOT PAGE] User logged in with context:', loginContext, 'role:', session.user.role);
      
      // Rediriger selon le CONTEXTE DE CONNEXION, pas le rôle DB
      if (loginContext === 'client') {
        redirect(`/${locale}/client/dashboard`);
      } else if (loginContext === 'partner') {
        redirect(`/${locale}/partner/dashboard`);
      } else if (loginContext === 'employee') {
        // Pour les employés, utiliser le rôle pour déterminer l'interface
        switch (session.user.role) {
          case 'superuser':
            redirect(`/${locale}/admin/superuser/dashboard`);
          case 'executive':
            redirect(`/${locale}/executive`);
          case 'admin':
          case 'manager':
          case 'member':
            redirect(`/${locale}/dashboard`);
          default:
            redirect(`/${locale}/dashboard`);
        }
      } else {
        // Pas de contexte de connexion, utiliser le rôle DB (fallback)
        console.log('[ROOT PAGE] ⚠️ No login context found! Using role fallback for role:', session.user.role);
        console.log('[ROOT PAGE] User email:', session.user.email);
        console.log('[ROOT PAGE] All cookies:', cookieStore.getAll().map(c => c.name));
        
        // IMPORTANT: Rediriger selon le rôle DB
        if (session.user.role === 'client') {
          console.log('[ROOT PAGE] Redirecting to client dashboard (fallback)');
          redirect(`/${locale}/client/dashboard`);
        } else if (session.user.role === 'partner') {
          console.log('[ROOT PAGE] Redirecting to partner dashboard (fallback)');
          redirect(`/${locale}/partner/dashboard`);
        } else if (session.user.role === 'superuser') {
          console.log('[ROOT PAGE] Redirecting to superuser dashboard (fallback)');
          redirect(`/${locale}/admin/superuser/dashboard`);
        } else if (session.user.role === 'executive') {
          console.log('[ROOT PAGE] Redirecting to executive (fallback)');
          redirect(`/${locale}/executive`);
        } else if (['admin', 'manager', 'member'].includes(session.user.role)) {
          console.log('[ROOT PAGE] Redirecting to dashboard (fallback)');
          redirect(`/${locale}/dashboard`);
        }
        // Si rôle inconnu, rester sur la page publique
        console.log('[ROOT PAGE] Unknown role, staying on public page');
      }
    }
  }
  
  // Utilisateurs non connectés voient la page publique
  return (
    <>
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
      <FusionDualAudienceHomepage locale={locale} />
    </>
  );
}