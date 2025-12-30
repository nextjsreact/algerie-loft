import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Comparaison des Pages d\'Accueil | Loft Algérie',
  description: 'Comparez l\'ancienne et la nouvelle homepage de Loft Algérie',
}

interface ComparePageProps {
  params: {
    locale: string
  }
}

export default function ComparePage({ params }: ComparePageProps) {
  const { locale } = params

  const content = {
    fr: {
      title: 'Comparaison des Pages d\'Accueil',
      subtitle: 'Choisissez la version que vous souhaitez voir',
      current: 'Page Actuelle',
      currentDesc: 'La page d\'accueil existante de votre application',
      new: 'Nouvelle Homepage Dual-Audience',
      newDesc: 'La nouvelle homepage optimisée pour guests et propriétaires',
      features: 'Fonctionnalités de la nouvelle homepage :',
      featuresList: [
        '🎯 Design dual-audience (guests prioritaires)',
        '🏠 Section lofts en vedette avec prix',
        '💼 Section propriétaires repositionnée',
        '🌍 Support multilingue complet (FR/EN/AR)',
        '📱 Design responsive mobile-first',
        '♿ Accessibilité WCAG 2.1 AA',
        '⚡ Performance optimisée',
        '🧪 Tests complets (46 tests)'
      ]
    },
    en: {
      title: 'Homepage Comparison',
      subtitle: 'Choose the version you want to see',
      current: 'Current Page',
      currentDesc: 'Your application\'s existing homepage',
      new: 'New Dual-Audience Homepage',
      newDesc: 'The new homepage optimized for guests and property owners',
      features: 'New homepage features:',
      featuresList: [
        '🎯 Dual-audience design (guests priority)',
        '🏠 Featured lofts section with pricing',
        '💼 Repositioned property owners section',
        '🌍 Complete multilingual support (FR/EN/AR)',
        '📱 Mobile-first responsive design',
        '♿ WCAG 2.1 AA accessibility',
        '⚡ Optimized performance',
        '🧪 Comprehensive testing (46 tests)'
      ]
    },
    ar: {
      title: 'مقارنة الصفحات الرئيسية',
      subtitle: 'اختر النسخة التي تريد رؤيتها',
      current: 'الصفحة الحالية',
      currentDesc: 'الصفحة الرئيسية الموجودة في تطبيقك',
      new: 'الصفحة الرئيسية الجديدة ثنائية الجمهور',
      newDesc: 'الصفحة الرئيسية الجديدة المحسنة للضيوف وأصحاب العقارات',
      features: 'ميزات الصفحة الرئيسية الجديدة:',
      featuresList: [
        '🎯 تصميم ثنائي الجمهور (أولوية للضيوف)',
        '🏠 قسم الشقق المميزة مع الأسعار',
        '💼 قسم أصحاب العقارات المعاد تموضعه',
        '🌍 دعم متعدد اللغات كامل (FR/EN/AR)',
        '📱 تصميم متجاوب يركز على الهاتف المحمول',
        '♿ إمكانية الوصول WCAG 2.1 AA',
        '⚡ أداء محسن',
        '🧪 اختبارات شاملة (46 اختبار)'
      ]
    }
  }

  const t = content[locale as keyof typeof content] || content.fr

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Page Actuelle */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.current}</h2>
            <p className="text-gray-600 mb-6">{t.currentDesc}</p>
            <Link 
              href={`/${locale}`}
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {locale === 'fr' && 'Voir la Page Actuelle'}
              {locale === 'en' && 'View Current Page'}
              {locale === 'ar' && 'عرض الصفحة الحالية'}
            </Link>
          </div>

          {/* Nouvelle Homepage */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-900">{t.new}</h2>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {locale === 'fr' && 'NOUVEAU'}
                {locale === 'en' && 'NEW'}
                {locale === 'ar' && 'جديد'}
              </span>
            </div>
            <p className="text-gray-600 mb-6">{t.newDesc}</p>
            <Link 
              href={`/${locale}/demo`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {locale === 'fr' && 'Voir la Nouvelle Homepage'}
              {locale === 'en' && 'View New Homepage'}
              {locale === 'ar' && 'عرض الصفحة الرئيسية الجديدة'}
            </Link>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.features}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {t.featuresList.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="mt-12 text-center">
          <div className="inline-flex space-x-4">
            <Link 
              href={`/${locale}`}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {locale === 'fr' && '← Retour à l\'Accueil'}
              {locale === 'en' && '← Back to Home'}
              {locale === 'ar' && '← العودة للرئيسية'}
            </Link>
            <Link 
              href={`/${locale}/demo`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {locale === 'fr' && 'Démo Directe →'}
              {locale === 'en' && 'Direct Demo →'}
              {locale === 'ar' && 'عرض مباشر ←'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}