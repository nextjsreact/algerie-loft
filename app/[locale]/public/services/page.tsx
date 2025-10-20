import PublicHeader from '@/components/public/PublicHeader';
import ServiceCard from '@/components/public/ServiceCard';
import PublicFooter from '@/components/public/PublicFooter';
import Breadcrumb from '@/components/public/Breadcrumb';

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params;
  
  const content = {
    fr: {
      title: "Nos Services",
      subtitle: "Découvrez notre gamme complète de services de gestion immobilière professionnelle",
      login: "Connexion",
      clientArea: "Espace Client",
      contact: "Contact",
      allRightsReserved: "Tous droits réservés",
      services: [
        {
          title: "Gestion Complète de Propriétés",
          desc: "Prise en charge totale de vos biens : maintenance, nettoyage, accueil des locataires, gestion des clés et suivi personnalisé.",
          icon: "🏢"
        },
        {
          title: "Optimisation des Revenus",
          desc: "Analyse de marché, ajustement des prix en temps réel, stratégies de pricing dynamique pour maximiser vos profits.",
          icon: "💰"
        },
        {
          title: "Système de Réservation",
          desc: "Plateforme de réservation moderne, gestion automatisée des disponibilités et communication client 24/7.",
          icon: "📅"
        },
        {
          title: "Marketing Digital",
          desc: "Promotion de vos propriétés sur les principales plateformes, photographie professionnelle et rédaction d'annonces.",
          icon: "📱"
        },
        {
          title: "Support Client 24/7",
          desc: "Assistance continue pour vos locataires, gestion des urgences et service client multilingue.",
          icon: "🎧"
        },
        {
          title: "Reporting Détaillé",
          desc: "Rapports financiers mensuels, analyses de performance et tableaux de bord en temps réel.",
          icon: "📊"
        }
      ]
    },
    en: {
      title: "Our Services",
      subtitle: "Discover our complete range of professional property management services",
      login: "Login",
      clientArea: "Client Area",
      contact: "Contact",
      allRightsReserved: "All rights reserved",
      services: [
        {
          title: "Complete Property Management",
          desc: "Full management of your properties: maintenance, cleaning, tenant reception, key management and personalized monitoring.",
          icon: "🏢"
        },
        {
          title: "Revenue Optimization",
          desc: "Market analysis, real-time price adjustments, dynamic pricing strategies to maximize your profits.",
          icon: "💰"
        },
        {
          title: "Booking System",
          desc: "Modern booking platform, automated availability management and 24/7 client communication.",
          icon: "📅"
        },
        {
          title: "Digital Marketing",
          desc: "Promotion of your properties on major platforms, professional photography and listing writing.",
          icon: "📱"
        },
        {
          title: "24/7 Customer Support",
          desc: "Continuous assistance for your tenants, emergency management and multilingual customer service.",
          icon: "🎧"
        },
        {
          title: "Detailed Reporting",
          desc: "Monthly financial reports, performance analysis and real-time dashboards.",
          icon: "📊"
        }
      ]
    },
    ar: {
      title: "خدماتنا",
      subtitle: "اكتشف مجموعتنا الكاملة من خدمات إدارة العقارات المهنية",
      login: "تسجيل الدخول",
      clientArea: "منطقة العميل",
      contact: "اتصال",
      allRightsReserved: "جميع الحقوق محفوظة",
      services: [
        {
          title: "إدارة شاملة للعقارات",
          desc: "إدارة كاملة لعقاراتك: الصيانة، التنظيف، استقبال المستأجرين، إدارة المفاتيح والمتابعة الشخصية.",
          icon: "🏢"
        },
        {
          title: "تحسين الإيرادات",
          desc: "تحليل السوق، تعديل الأسعار في الوقت الفعلي، استراتيجيات التسعير الديناميكي لزيادة أرباحك.",
          icon: "💰"
        },
        {
          title: "نظام الحجز",
          desc: "منصة حجز حديثة، إدارة آلية للتوفر وتواصل مع العملاء على مدار الساعة.",
          icon: "📅"
        },
        {
          title: "التسويق الرقمي",
          desc: "الترويج لعقاراتك على المنصات الرئيسية، التصوير المهني وكتابة الإعلانات.",
          icon: "📱"
        },
        {
          title: "دعم العملاء 24/7",
          desc: "مساعدة مستمرة للمستأجرين، إدارة الطوارئ وخدمة عملاء متعددة اللغات.",
          icon: "🎧"
        },
        {
          title: "تقارير مفصلة",
          desc: "تقارير مالية شهرية، تحليل الأداء ولوحات معلومات في الوقت الفعلي.",
          icon: "📊"
        }
      ]
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader locale={locale} text={{ login: text.login }} />

      <main className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb */}
          <Breadcrumb 
            locale={locale} 
            items={[{ label: text.title }]} 
          />
          
          {/* Header */}
          <section className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {text.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {text.subtitle}
            </p>
          </section>

          {/* Services Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {text.services.map((service, index) => (
              <ServiceCard 
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.desc}
              />
            ))}
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
    </div>
  );
}