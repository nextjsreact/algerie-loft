import PublicHeader from '@/components/public/PublicHeader';
import ServiceCard from '@/components/public/ServiceCard';
import PublicFooter from '@/components/public/PublicFooter';
import TouchButton from '@/components/ui/TouchButton';
import SmoothScroll from '@/components/ui/SmoothScroll';
import BackToTop from '@/components/ui/BackToTop';
import StatsSection from '@/components/public/StatsSection';
import TestimonialsSection from '@/components/public/TestimonialsSection';
import { Metadata } from 'next';

interface PublicPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Loft Algérie - Gestion Professionnelle de Lofts en Algérie",
      description: "Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise reconnue. Gestion complète, réservations et optimisation des revenus.",
    },
    en: {
      title: "Loft Algeria - Professional Loft Management in Algeria",
      description: "Professional loft and accommodation management services in Algeria. Maximize your rental income with our recognized expertise. Complete management, reservations and revenue optimization.",
    },
    ar: {
      title: "لوفت الجزائر - إدارة احترافية للشقق المفروشة في الجزائر",
      description: "خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. اعظم عوائدك الإيجارية مع خبرتنا المعترف بها. إدارة شاملة وحجوزات وتحسين الإيرادات.",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `https://loftalgerie.com/${locale}/public`,
      languages: {
        'fr': 'https://loftalgerie.com/fr/public',
        'en': 'https://loftalgerie.com/en/public',
        'ar': 'https://loftalgerie.com/ar/public',
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `https://loftalgerie.com/${locale}/public`,
      siteName: 'Loft Algérie',
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'en' ? 'en_US' : 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { locale } = await params;
  
  // Contenu multilingue pour le site public
  const content = {
    fr: {
      title: "Gestion Professionnelle de Lofts",
      subtitle: "Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise reconnue.",
      servicesTitle: "Nos Services",
      contactTitle: "Prêt à maximiser vos revenus ?",
      contactDesc: "Contactez-nous pour une consultation gratuite et découvrez comment nous pouvons optimiser la gestion de vos propriétés.",
      discoverServices: "Découvrir nos services",
      contactUs: "Nous contacter",
      login: "Connexion",
      clientArea: "Espace Client",
      contact: "Contact",
      allRightsReserved: "Tous droits réservés",
      property: { title: "Gestion de Propriétés", desc: "Gestion complète de vos biens immobiliers avec suivi personnalisé, optimisation des revenus et maintenance préventive." },
      reservation: { title: "Réservations", desc: "Système de réservation professionnel pour maximiser votre taux d'occupation et automatiser la gestion des clients." },
      revenue: { title: "Optimisation Revenus", desc: "Stratégies personnalisées pour maximiser vos revenus locatifs avec analyse de marché et ajustement des prix." }
    },
    en: {
      title: "Professional Loft Management",
      subtitle: "Professional loft and accommodation management services in Algeria. Maximize your rental income with our recognized expertise.",
      servicesTitle: "Our Services", 
      contactTitle: "Ready to maximize your income?",
      contactDesc: "Contact us for a free consultation and discover how we can optimize your property management.",
      discoverServices: "Discover our services",
      contactUs: "Contact us",
      login: "Login",
      clientArea: "Client Area",
      contact: "Contact",
      allRightsReserved: "All rights reserved",
      property: { title: "Property Management", desc: "Complete management of your real estate with personalized monitoring, revenue optimization and preventive maintenance." },
      reservation: { title: "Reservations", desc: "Professional booking system to maximize your occupancy rate and automate client management." },
      revenue: { title: "Revenue Optimization", desc: "Personalized strategies to maximize your rental income with market analysis and price adjustments." }
    },
    ar: {
      title: "إدارة احترافية للشقق المفروشة",
      subtitle: "خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. اعظم عوائدك الإيجارية مع خبرتنا المعترف بها.",
      servicesTitle: "خدماتنا",
      contactTitle: "مستعد لزيادة دخلك إلى أقصى حد؟",
      contactDesc: "اتصل بنا للحصول على استشارة مجانية واكتشف كيف يمكننا تحسين إدارة عقاراتك.",
      discoverServices: "اكتشف خدماتنا",
      contactUs: "اتصل بنا",
      login: "تسجيل الدخول",
      clientArea: "منطقة العميل",
      contact: "اتصال",
      allRightsReserved: "جميع الحقوق محفوظة",
      property: { title: "إدارة العقارات", desc: "إدارة شاملة لعقاراتك مع متابعة شخصية وتحسين الإيرادات والصيانة الوقائية." },
      reservation: { title: "الحجوزات", desc: "نظام حجز احترافي لزيادة معدل الإشغال وأتمتة إدارة العملاء." },
      revenue: { title: "تحسين الإيرادات", desc: "استراتيجيات شخصية لزيادة دخلك الإيجاري مع تحليل السوق وتعديل الأسعار." }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SmoothScroll />
      <PublicHeader locale={locale} text={{ login: text.login }} />

      {/* Contenu principal */}
      <main className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <section className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              🏠 {text.title}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              {text.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <TouchButton href="#services" variant="secondary" size="lg">
                {text.discoverServices}
              </TouchButton>
              <TouchButton href="#contact" variant="outline" size="lg">
                {text.contactUs}
              </TouchButton>
            </div>
          </section>

          {/* Services */}
          <section id="services" className="mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-gray-900 dark:text-white">
              {text.servicesTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <ServiceCard 
                icon="🏢"
                title={text.property.title}
                description={text.property.desc}
              />
              <ServiceCard 
                icon="📅"
                title={text.reservation.title}
                description={text.reservation.desc}
              />
              <ServiceCard 
                icon="💰"
                title={text.revenue.title}
                description={text.revenue.desc}
              />
            </div>
          </section>

        </div>
      </main>

      {/* Stats Section */}
      <StatsSection locale={locale} />

      {/* Testimonials Section */}
      <TestimonialsSection locale={locale} />

      {/* Contact Section */}
      <main className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Contact */}
          <section id="contact" className="bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-12 lg:p-16 rounded-xl shadow-lg dark:shadow-2xl text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
              {text.contactTitle}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              {text.contactDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
              <TouchButton href="mailto:contact@loftalgerie.com" variant="primary" size="md">
                📧 contact@loftalgerie.com
              </TouchButton>
              <TouchButton href="tel:+213123456789" variant="secondary" size="md">
                📞 +213 123 456 789
              </TouchButton>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter 
        locale={locale} 
        text={{ 
          clientArea: text.clientArea,
          contact: text.contact,
          allRightsReserved: text.allRightsReserved
        }} 
      />
      
      <BackToTop />
    </div>
  );
}