import { useTranslations } from 'next-intl';

interface SitePublicPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SitePublicPage({ params }: SitePublicPageProps) {
  const { locale } = await params;
  
  // Contenu multilingue
  const content = {
    fr: {
      title: "🏠 Loft Algérie - Site Public",
      subtitle: "✅ Site public intégré dans l'application principale",
      servicesTitle: "Services Professionnels",
      servicesDesc: "Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise reconnue.",
      propertyTitle: "Gestion de Propriétés",
      propertyDesc: "Gestion complète de vos biens immobiliers avec suivi personnalisé et optimisation des revenus.",
      reservationTitle: "Réservations", 
      reservationDesc: "Système de réservation optimisé pour maximiser votre taux d'occupation et vos revenus.",
      maintenanceTitle: "Maintenance",
      maintenanceDesc: "Service de maintenance préventive et corrective pour maintenir vos propriétés en parfait état.",
      consultingTitle: "Conseil Expert",
      consultingDesc: "Expertise et conseils personnalisés pour optimiser vos investissements immobiliers.",
      languagesTitle: "🌐 Versions Linguistiques",
      navigationTitle: "🔗 Navigation",
      accessApp: "🔐 Accéder à l'Application de Gestion",
      userLogin: "👤 Connexion Utilisateur",
      infoTitle: "ℹ️ Informations",
      info1: "Ce site public est intégré dans l'application de gestion",
      info2: "Navigation fluide entre le site public et l'interface d'administration", 
      info3: "Support multilingue complet (Français, Anglais, Arabe)",
      info4: "Interface responsive adaptée à tous les appareils"
    },
    en: {
      title: "🏠 Loft Algeria - Public Website",
      subtitle: "✅ Public website integrated into the main application",
      servicesTitle: "Professional Services",
      servicesDesc: "Professional loft and accommodation management services in Algeria. Maximize your rental income with our recognized expertise.",
      propertyTitle: "Property Management",
      propertyDesc: "Complete management of your real estate with personalized monitoring and revenue optimization.",
      reservationTitle: "Reservations",
      reservationDesc: "Optimized booking system to maximize your occupancy rate and revenue.",
      maintenanceTitle: "Maintenance", 
      maintenanceDesc: "Preventive and corrective maintenance service to keep your properties in perfect condition.",
      consultingTitle: "Expert Consulting",
      consultingDesc: "Personalized expertise and advice to optimize your real estate investments.",
      languagesTitle: "🌐 Language Versions",
      navigationTitle: "🔗 Navigation",
      accessApp: "🔐 Access Management Application",
      userLogin: "👤 User Login",
      infoTitle: "ℹ️ Information",
      info1: "This public website is integrated into the management application",
      info2: "Smooth navigation between public website and administration interface",
      info3: "Complete multilingual support (French, English, Arabic)",
      info4: "Responsive interface adapted to all devices"
    },
    ar: {
      title: "🏠 لوفت الجزائر - الموقع العام",
      subtitle: "✅ الموقع العام مدمج في التطبيق الرئيسي",
      servicesTitle: "الخدمات المهنية",
      servicesDesc: "خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. اعظم عوائدك الإيجارية مع خبرتنا المعترف بها.",
      propertyTitle: "إدارة العقارات",
      propertyDesc: "إدارة شاملة لعقاراتك مع متابعة شخصية وتحسين الإيرادات.",
      reservationTitle: "الحجوزات",
      reservationDesc: "نظام حجز محسن لزيادة معدل الإشغال والإيرادات إلى أقصى حد.",
      maintenanceTitle: "الصيانة",
      maintenanceDesc: "خدمة صيانة وقائية وتصحيحية للحفاظ على عقاراتك في حالة مثالية.",
      consultingTitle: "الاستشارة المتخصصة", 
      consultingDesc: "خبرة ونصائح شخصية لتحسين استثماراتك العقارية.",
      languagesTitle: "🌐 إصدارات اللغة",
      navigationTitle: "🔗 التنقل",
      accessApp: "🔐 الوصول إلى تطبيق الإدارة",
      userLogin: "👤 تسجيل دخول المستخدم",
      infoTitle: "ℹ️ معلومات",
      info1: "هذا الموقع العام مدمج في تطبيق الإدارة",
      info2: "تنقل سلس بين الموقع العام وواجهة الإدارة",
      info3: "دعم متعدد اللغات كامل (فرنسي، إنجليزي، عربي)",
      info4: "واجهة متجاوبة متكيفة مع جميع الأجهزة"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: '#10b981', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          {text.title}
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: '0.9' }}>
          {text.subtitle}
        </p>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '1.5rem', fontSize: '2rem' }}>{text.servicesTitle}</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '2rem', fontSize: '1.1rem', color: '#4b5563' }}>
          {text.servicesDesc}
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>{text.propertyTitle}</h3>
            <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.5' }}>
              {text.propertyDesc}
            </p>
          </div>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>{text.reservationTitle}</h3>
            <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.5' }}>
              {text.reservationDesc}
            </p>
          </div>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔧</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>{text.maintenanceTitle}</h3>
            <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.5' }}>
              {text.maintenanceDesc}
            </p>
          </div>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>{text.consultingTitle}</h3>
            <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.5' }}>
              {text.consultingDesc}
            </p>
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fef3c7', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h2 style={{ color: '#92400e', marginBottom: '1.5rem', fontSize: '1.8rem' }}>{text.languagesTitle}</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/fr/site-public" style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🇫🇷 Version Française
          </a>
          <a href="/en/site-public" style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🇺🇸 English Version
          </a>
          <a href="/ar/site-public" style={{ 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🇩🇿 النسخة العربية
          </a>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#166534', marginBottom: '1.5rem', fontSize: '1.8rem' }}>{text.navigationTitle}</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href={`/${locale}`} style={{ 
            backgroundColor: '#16a34a', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>
            {text.accessApp}
          </a>
          <a href={`/${locale}/login`} style={{ 
            backgroundColor: '#6b7280', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>
            {text.userLogin}
          </a>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>{text.infoTitle}</h3>
          <ul style={{ color: '#1e40af', lineHeight: '1.6', paddingLeft: locale === 'ar' ? '0' : '1.5rem', paddingRight: locale === 'ar' ? '1.5rem' : '0' }}>
            <li>{text.info1}</li>
            <li>{text.info2}</li>
            <li>{text.info3}</li>
            <li>{text.info4}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}